<script setup lang="ts">
const { $supabase } = useNuxtApp();

const fullname = ref("");
const teacherNumber = ref("");
const teacherPosition = ref("");

const loading = ref(false);
const status = ref("");
const statusType = ref<"success" | "error" | "">("");

const ALLOWED_RADIUS = 30;

function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID() + "-" + Date.now();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}

function getTeacherCheckinStatus() {
  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 08:00
  const normalStart = 8 * 60;

  // 08:15
  const normalEnd = 8 * 60 + 15;

  // ก่อน 08:00
  if (currentMinutes < normalStart) {
    return {
      allow: false,
      status: null,
      message: "ยังไม่ถึงเวลาเช็คชื่อ",
    };
  }

  // 08:00 - 08:15
  if (currentMinutes <= normalEnd) {
    return {
      allow: true,
      status: "normal",
      message: "เช็คชื่อสำเร็จ",
    };
  }

  // หลัง 08:15 = มาสายทั้งหมด
  return {
    allow: true,
    status: "late",
    message: "เช็คชื่อสำเร็จ (มาสาย)",
  };
}

async function getTeacherData() {
  status.value = "";
  if (!teacherNumber.value) {
    fullname.value = "";
    teacherPosition.value = "";
    return;
  }
  const { data, error } = await $supabase
    .from("teachers")
    .select("teacher_number, full_name, position_name")
    .eq("teacher_number", teacherNumber.value.trim())
    .maybeSingle();
  if (error) {
    fullname.value = "";
    teacherPosition.value = "";
    status.value = "เกิดข้อผิดพลาด";
    statusType.value = "error";
    return;
  }
  if (data) {
    fullname.value = data.full_name ?? "";
    teacherPosition.value = data.position_name ?? "";
    status.value = "";
    statusType.value = "";
  } else {
    fullname.value = "";
    teacherPosition.value = "";
    status.value = "ไม่พบข้อมูลครู";
    statusType.value = "error";
  }
}

async function handleCheckin() {
  if (!teacherNumber.value) {
    status.value = "กรุณากรอกเลขที่ครู";
    statusType.value = "error";
    return;
  }
  if (!fullname.value) {
    status.value = "ไม่พบข้อมูลครู";
    statusType.value = "error";
    return;
  }
  const checkin = getTeacherCheckinStatus();
  if (!checkin.allow) {
    status.value = checkin.message;
    statusType.value = "error";
    return;
  }
  loading.value = true;

  const deviceId = getDeviceId();

  // วันปัจจุบัน
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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
  try {
    const gps = await collectGps((msg) => {
      status.value = msg;
      statusType.value = "";
    });

    if (gps.distance > ALLOWED_RADIUS) {
      status.value = `อยู่นอกพื้นที่ (${gps.distance.toFixed(1)} เมตร)`;
      statusType.value = "error";
      loading.value = false;
      return;
    }

    const { error } = await $supabase.from("checkins").insert({
      user_type: "teacher",
      checkin_status: checkin.status,
      full_name: fullname.value,
      teacher_number: teacherNumber.value,
      teacher_position: teacherPosition.value,
      latitude: gps.lat,
      longitude: gps.lng,
      distance: gps.distance,
      gps_accuracy: gps.accuracy,
      checkin_at: new Date().toISOString(),
      device_id: deviceId,
    });

    if (error) {
      status.value = "บันทึกข้อมูลไม่สำเร็จ";
      statusType.value = "error";
    } else {
      status.value = checkin.message;
      statusType.value = "success";
      fullname.value = "";
      teacherNumber.value = "";
      teacherPosition.value = "";
    }
  } catch (e: any) {
    status.value = e.message ?? "เกิดข้อผิดพลาด GPS";
    statusType.value = "error";
  }
  loading.value = false;
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
          Teacher Attendance
        </div>
        <div class="ck-icon-circle">👨‍🏫</div>
        <h1 class="ck-title">ระบบเช็คชื่อครู</h1>
        <p class="ck-subtitle">เช็คชื่อครูประจำหน้าเสาธง</p>
      </div>

      <!-- Body -->
      <div class="ck-body">
        <!-- Section label -->
        <p class="section-label">ข้อมูลครู</p>

        <!-- Teacher Number -->
        <div class="ck-field">
          <label class="ck-label">เลขที่ครู</label>
          <div class="input-wrap">
            <span class="input-prefix">👤</span>
            <input
              v-model="teacherNumber"
              type="text"
              class="ck-input"
              placeholder="เช่น 1"
              @input="getTeacherData"
            />
          </div>
        </div>

        <!-- Fullname (auto-filled) -->
        <div class="ck-field">
          <label class="ck-label">
            ชื่อ – สกุล
            <span class="label-hint">กรอกอัตโนมัติ</span>
          </label>
          <div class="input-wrap">
            <span class="input-prefix">📋</span>
            <input
              v-model="fullname"
              type="text"
              class="ck-input ck-input--readonly"
              placeholder="จะกรอกอัตโนมัติเมื่อพบข้อมูล"
            />
          </div>
        </div>

        <div class="ck-divider" />

        <!-- Info boxes -->
        <div class="info-grid">
          <div class="info-box">
            <span class="info-icon">⏰</span>
            <div>
              <p class="info-title">เวลาเช็คชื่อ</p>
              <p class="info-value">08:00 – 08:15</p>
            </div>
          </div>
          <div class="info-box">
            <span class="info-icon">📍</span>
            <div>
              <p class="info-title">รัศมีที่อนุญาต</p>
              <p class="info-value">30 เมตร</p>
            </div>
          </div>
        </div>

        <!-- Button -->
        <button @click="handleCheckin" :disabled="loading" class="ck-btn">
          <span v-if="!loading">📍 เช็คชื่อครู</span>
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
  background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 55%, #8b5cf6 100%);
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.label-hint {
  font-size: 11px;
  font-weight: 500;
  color: #a78bfa;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 20px;
  padding: 1px 8px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 14px;
  font-size: 15px;
  pointer-events: none;
  z-index: 1;
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
  border-color: #7c3aed;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.ck-input--readonly {
  background: #faf5ff;
  border-color: #e9d5ff;
  color: #6d28d9;
  cursor: default;
}

.ck-input--readonly:focus {
  border-color: #e9d5ff;
  box-shadow: none;
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
  background: #f5f3ff;
  border: 1px solid #ede9fe;
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
  color: #7c3aed;
  font-weight: 600;
  margin: 0 0 2px;
}

.info-value {
  font-size: 13px;
  color: #4c1d95;
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
  background: #7c3aed;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  transition:
    background 0.15s,
    transform 0.1s,
    box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
}

.ck-btn:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
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
