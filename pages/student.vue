<script setup lang="ts">
const { $supabase } = useNuxtApp();

const fullname = ref("");
const classroom = ref("");
const studentnum = ref("");

const loading = ref(false);
const status = ref("");
const statusType = ref<"success" | "error" | "">("");

const TARGET_LAT = 17.614395;
const TARGET_LNG = 103.649520;
const ALLOWED_RADIUS = 15;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

      const dist = haversine(lat, lng, TARGET_LAT, TARGET_LNG);

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
              <p class="info-value">10 เมตร</p>
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
