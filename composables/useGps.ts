const TARGET_LAT = 17.614378;
const TARGET_LNG = 103.649527;
const MAX_POSITION_AGE = 10000;
const GPS_COLLECT_MS = 20000; // เก็บนานขึ้นสำหรับสภาพแวดล้อมใต้โดม

export interface GpsResult {
  lat: number;
  lng: number;
  accuracy: number;
  distance: number;
}

function calcDistance(lat: number, lng: number): number {
  const R = 6371000;
  const dLat = ((TARGET_LAT - lat) * Math.PI) / 180;
  const dLon = ((TARGET_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((TARGET_LAT * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * เก็บ GPS samples ด้วย watchPosition แล้วคืนค่า median position
 * เหมาะกับสภาพแวดล้อมใต้โดม/สัญญาณสะท้อน
 */
export function collectGps(
  onStatus: (msg: string) => void,
): Promise<GpsResult> {
  return new Promise((resolve, reject) => {
    interface Sample {
      lat: number;
      lng: number;
      accuracy: number;
      ts: number;
    }
    const samples: Sample[] = [];
    let watchId: number | null = null;

    const done = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }

      if (samples.length === 0) {
        reject(new Error("ไม่สามารถรับสัญญาณ GPS ได้ กรุณาลองใหม่"));
        return;
      }

      // ตัด outlier: เอาแค่ครึ่งกลางของ accuracy (interquartile)
      const sorted = [...samples].sort((a, b) => a.accuracy - b.accuracy);
      const q1 = Math.floor(sorted.length * 0.25);
      const q3 = Math.ceil(sorted.length * 0.75);
      const filtered = sorted.length >= 4 ? sorted.slice(q1, q3) : sorted;

      // ใช้ median lat/lng เพื่อลด multipath error
      const lat = median(filtered.map((s) => s.lat));
      const lng = median(filtered.map((s) => s.lng));
      const accuracy = median(filtered.map((s) => s.accuracy));
      const distance = calcDistance(lat, lng);

      resolve({ lat, lng, accuracy, distance });
    };

    const timeout = setTimeout(done, GPS_COLLECT_MS);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const age = Date.now() - pos.timestamp;
        if (age > MAX_POSITION_AGE) return;

        samples.push({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: pos.timestamp,
        });

        // อัปเดต status แสดงความคืบหน้า
        const remaining = Math.max(
          0,
          Math.ceil((GPS_COLLECT_MS - (Date.now() - (pos.timestamp - age))) / 1000),
        );
        onStatus(
          `กำลังรับสัญญาณ GPS... (${samples.length} samples${remaining > 0 ? `, ~${remaining}s` : ""})`,
        );
      },
      () => {
        clearTimeout(timeout);
        reject(new Error("ไม่สามารถเข้าถึง GPS"));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: GPS_COLLECT_MS + 3000 },
    );

    void timeout;
  });
}

export { TARGET_LAT, TARGET_LNG, GPS_COLLECT_MS };
