<script setup lang="ts">
import { Geodesic } from "geographiclib";
const { $supabase } = useNuxtApp();

const fullname = ref("");
const classroom = ref("");
const studentnum = ref("");

const loading = ref(false);
const status = ref("");
const statusType = ref<"success" | "error" | "">("");

const TARGET_LAT = 17.614383;
const TARGET_LNG = 103.649526;
const ALLOWED_RADIUS = 20;

// function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
//   const R = 6371000;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// function vincentyDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   // รัศมีของโลกตามมาตรฐาน WGS-84
//   const a = 6378137.0; // รัศมีที่เส้นศูนย์สูตร (เมตร)
//   const b = 6356752.314245; // รัศมีที่ขั้วโลก (เมตร)
//   const f = 1 / 298.257223563; // ความแป้นของโลก

//   const toRadians = (deg: number) => (deg * Math.PI) / 180;

//   const L = toRadians(lon2 - lon1);
//   const U1 = Math.atan((1 - f) * Math.tan(toRadians(lat1)));
//   const U2 = Math.atan((1 - f) * Math.tan(toRadians(lat2)));

//   const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
//   const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

//   let lambda = L;
//   let lambdaP: number;
//   let iterLimit = 100;
//   let cosSqAlpha = 0, sinSigma = 0, cos2SigmaM = 0, cosSigma = 0, sigma = 0;

//   do {
//     const sinLambda = Math.sin(lambda);
//     const cosLambda = Math.cos(lambda);
    
//     sinSigma = Math.sqrt(
//       (cosU2 * sinLambda) ** 2 +
//       (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) ** 2
//     );

//     if (sinSigma === 0) return 0; // จุดเดียวกัน

//     cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
//     sigma = Math.atan2(sinSigma, cosSigma);
    
//     const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
//     cosSqAlpha = 1 - sinAlpha ** 2;
    
//     // จัดการกรณีจุดอยู่บนเส้นศูนย์สูตร
//     cos2SigmaM = cosSqAlpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha : 0; 
    
//     const C = (f / 16) * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
//     lambdaP = lambda;
//     lambda = L + (1 - C) * f * sinAlpha * (
//       sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2))
//     );
//   } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

//   if (iterLimit === 0) return NaN; // คำนวณไม่ลู่เข้าหาผลลัพธ์ (กรณีจุดตรงข้ามโลกกันพอดี)

//   const uSq = (cosSqAlpha * (a ** 2 - b ** 2)) / (b ** 2);
//   const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
//   const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
//   const deltaSigma = B * sinSigma * (
//     cos2SigmaM + (B / 4) * (
//       cosSigma * (-1 + 2 * cos2SigmaM ** 2) -
//       (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)
//     )
//   );

//   const distance = b * A * (sigma - deltaSigma);
//   return distance; // ผลลัพธ์เป็นเมตร
// }

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const result = Geodesic.WGS84.Inverse(lat1, lon1, lat2, lon2);

  return result.s12 ?? 0;
}

function getStudentCheckinStatus() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 6 * 60;
  const lateMinutes = 8 * 60 + 15;
  if (currentMinutes < startMinutes)
    return {
      allow: false,
      status: null,
      message: "ยังไม่ถึงเวลาเช็คชื่อของนักเรียน",
    };
  if (currentMinutes > lateMinutes)
    return { allow: true, status: "late", message: "เช็คชื่อสำเร็จ (มาสาย)" };
  return { allow: true, status: "normal", message: "เช็คชื่อสำเร็จ" };
}

function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function handleCheckin() {
  if (!fullname.value || !classroom.value || !studentnum.value) {
    status.value = "กรุณากรอกข้อมูลให้ครบ";
    statusType.value = "error";
    return;
  }

  const checkin = getStudentCheckinStatus();

  if (!checkin.allow) {
    status.value = checkin.message;
    statusType.value = "error";
    return;
  }

  loading.value = true;

  await delay(2000);

  const deviceId = getDeviceId();

  // วันที่วันนี้
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // ตรวจสอบว่า device นี้เช็คอินแล้วหรือยัง
  const { data: existing } = await $supabase
    .from("checkins")
    .select("id")
    .eq("device_id", deviceId)
    .gte("checkin_at", today.toISOString())
    .lt("checkin_at", tomorrow.toISOString())
    .maybeSingle();

  if (existing) {
    status.value = "อุปกรณ์นี้เช็คชื่อแล้ววันนี้";
    statusType.value = "error";
    loading.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const dist = calculateDistanceMeters(lat, lng, TARGET_LAT, TARGET_LNG);

      if (dist > ALLOWED_RADIUS) {
        status.value = `อยู่นอกพื้นที่ (${(dist / 1000).toFixed(2)} กิโลเมตร)`;
        statusType.value = "error";
        loading.value = false;
        return;
      }

      const { error } = await $supabase.from("checkins").insert({
        user_type: "student",
        checkin_status: checkin.status,
        full_name: fullname.value,
        class_room: classroom.value,
        student_number: studentnum.value,
        latitude: lat,
        longitude: lng,
        distance: dist,
        device_id: deviceId,
        checkin_at: new Date().toISOString(),
      });

      if (error) {
        status.value = "บันทึกข้อมูลไม่สำเร็จ";
        statusType.value = "error";
      } else {
        status.value = checkin.message;
        statusType.value = "success";

        fullname.value = "";
        classroom.value = "";
        studentnum.value = "";
      }

      loading.value = false;
    },
    () => {
      status.value = "ไม่สามารถเข้าถึง GPS";
      statusType.value = "error";
      loading.value = false;
    },
    { enableHighAccuracy: true },
  );
}
</script>

<template>
  <div class="page-wrapper">
    <div class="ck-card">
      <!-- Header -->
      <div class="ck-header">
        <div class="blob-1" />
        <div class="blob-2" />
        <div class="ck-badge">
          <span class="badge-dot" />
          Student Attendance
        </div>
        <div class="ck-icon-circle">👨‍🎓</div>
        <h1 class="ck-title">ระบบเช็คชื่อนักเรียน</h1>
        <p class="ck-subtitle">เช็คชื่อเข้าแถวหน้าเสาธง</p>
      </div>

      <!-- Body -->
      <div class="ck-body">
        <p class="section-label">ข้อมูลนักเรียน</p>

        <!-- Fullname -->
        <div class="ck-field">
          <label class="ck-label">ชื่อ – สกุล</label>
          <div class="input-wrap">
            <span class="input-prefix">👤</span>
            <input
              v-model="fullname"
              type="text"
              class="ck-input"
              placeholder="กรอกชื่อ-สกุล"
            />
          </div>
        </div>

        <!-- Classroom + Number -->
        <div class="ck-row">
          <div class="ck-field">
            <label class="ck-label">ชั้น</label>
            <div class="input-wrap">
              <span class="input-prefix">🏫</span>
              <input
                v-model="classroom"
                type="text"
                class="ck-input"
                placeholder="เช่น ม.6/1"
              />
            </div>
          </div>
          <div class="ck-field">
            <label class="ck-label">เลขที่</label>
            <div class="input-wrap">
              <span class="input-prefix">#</span>
              <input
                v-model="studentnum"
                type="text"
                class="ck-input ck-input--center"
                placeholder="12"
              />
            </div>
          </div>
        </div>

        <div class="ck-divider" />

        <!-- Info grid -->
        <div class="info-grid">
          <div class="info-box">
            <span class="info-icon">⏰</span>
            <div>
              <p class="info-title">เวลาเช็คชื่อ</p>
              <p class="info-value">06:00 – 08:15</p>
            </div>
          </div>
          <div class="info-box">
            <span class="info-icon">📍</span>
            <div>
              <p class="info-title">รัศมีที่อนุญาต</p>
              <p class="info-value">20 เมตร</p>
            </div>
          </div>
        </div>

        <!-- Button -->
        <button @click="handleCheckin" :disabled="loading" class="ck-btn">
          <span v-if="!loading">📍 เช็คชื่อนักเรียน</span>
          <span v-else>⏳ กำลังตรวจสอบ GPS...</span>
        </button>

        <!-- Status -->
        <transition name="fade">
          <div
            v-if="status"
            class="ck-status"
            :class="{
              'ck-status--success': statusType === 'success',
              'ck-status--error': statusType === 'error',
            }"
          >
            <span class="status-dot" />
            {{ status }}
          </div>
        </transition>

        <!-- Back -->
        <div class="back-wrap">
          <NuxtLink to="/" class="back-link">← กลับหน้าหลัก</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  font-family: "Sarabun", sans-serif;
}

/* Card */
.ck-card {
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
}

/* Header */
.ck-header {
  background: linear-gradient(135deg, #1a56db 0%, #2563eb 55%, #3b82f6 100%);
  padding: 1.75rem 1.5rem 2.75rem;
  position: relative;
  overflow: hidden;
}

.blob-1 {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
}

.blob-2 {
  position: absolute;
  bottom: -30px;
  left: 20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.ck-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  border: 0.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}

.ck-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  border: 0.5px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.ck-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
  position: relative;
  z-index: 1;
}

.ck-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
  margin: 0;
  position: relative;
  z-index: 1;
}

/* Body */
.ck-body {
  background: #fff;
  border-radius: 16px 16px 0 0;
  margin-top: -16px;
  padding: 1.5rem;
  position: relative;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin: 0 0 14px;
}

/* Fields */
.ck-field {
  margin-bottom: 12px;
}

.ck-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 13px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
  color: #94a3b8;
}

.ck-input {
  width: 100%;
  box-sizing: border-box;
  height: 48px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0 14px 0 40px;
  font-size: 14px;
  font-family: "Sarabun", sans-serif;
  color: #0f172a;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    background 0.15s;
}

.ck-input::placeholder {
  color: #cbd5e1;
}

.ck-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.ck-input--center {
  text-align: center;
  padding-left: 14px;
}

.ck-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
}

/* Divider */
.ck-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 14px 0;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.info-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-title {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 600;
  margin: 0 0 2px;
}

.info-value {
  font-size: 13px;
  color: #1e40af;
  font-weight: 700;
  margin: 0;
}

/* Button */
.ck-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: #2563eb;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  transition:
    background 0.15s,
    transform 0.1s,
    box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.ck-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.ck-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.ck-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Status */
.ck-status {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 11px 14px;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
}

.ck-status--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.ck-status--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ck-status--success .status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

.ck-status--error .status-dot {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

/* Back */
.back-wrap {
  margin-top: 16px;
  text-align: center;
}

.back-link {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.15s;
}

.back-link:hover {
  color: #334155;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
