<script setup lang="ts">
const { $supabase } = useNuxtApp();

const fullname = ref("");
const classroom = ref("");
const studentnum = ref("");

const loading = ref(false);
const status = ref("");
const statusType = ref<"success" | "error" | "">("");
const TARGET_LAT = 17.614403;
const TARGET_LNG = 103.649487;
const ALLOWED_RADIUS = 50;

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

async function handleCheckin() {
  if (!fullname.value || !classroom.value || !studentnum.value) {
    status.value = "กรุณากรอกข้อมูลให้ครบ";
    statusType.value = "error";
    return;
  }

  loading.value = true;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const dist = haversine(lat, lng, TARGET_LAT, TARGET_LNG);

      if (dist > ALLOWED_RADIUS) {
        const km = dist / 1000;

        status.value = `อยู่นอกพื้นที่ (${km.toFixed(2)} กิโลเมตร) ไม่สามารถเช็คชื่อได้`;
        statusType.value = "error";
        loading.value = false;
        return;
      }

      const { error } = await $supabase.from("checkins").insert({
        full_name: fullname.value,
        class_room: classroom.value,
        student_number: studentnum.value,
        latitude: lat,
        longitude: lng,
        distance: dist,
      });

      if (error) {
        status.value = "บันทึกข้อมูลไม่สำเร็จ";
        statusType.value = "error";
      } else {
        status.value = "เช็คชื่อสำเร็จ — บันทึกข้อมูลเรียบร้อยแล้ว";
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
        <div class="ck-header-blob-1" />
        <div class="ck-header-blob-2" />
        <div class="ck-school-badge">
          <span class="badge-dot" />
          Smart Attendance System
        </div>
        <div class="ck-icon-circle">🏫</div>
        <h1 class="ck-title">ระบบเช็คชื่อหน้าเสาธง</h1>
        <p class="ck-subtitle">กรุณากรอกข้อมูลให้ครบถ้วน</p>
      </div>

      <!-- Body -->
      <div class="ck-body">
        <p class="ck-section-label">ข้อมูลของครูประจำหน้าเสาธง</p>

        <!-- Fullname -->
        <div class="ck-field">
          <label class="ck-label">ชื่อ – สกุล</label>
          <input
            v-model="fullname"
            type="text"
            placeholder="กรอกชื่อ-สกุล"
            class="ck-input"
          />
        </div>

        <!-- Classroom + Student Number -->
        <div class="ck-row">
          <div class="ck-field">
            <label class="ck-label">ชั้น</label>
            <input
              v-model="classroom"
              type="text"
              placeholder="เช่น ม.6/1"
              class="ck-input"
            />
          </div>
          <div class="ck-field">
            <label class="ck-label">เลขที่</label>
            <input
              v-model="studentnum"
              type="text"
              placeholder="12"
              class="ck-input"
            />
          </div>
        </div>

        <!-- Location hint -->
        <div class="ck-divider" />
        <div class="ck-location-hint">
          📍 ระบบจะตรวจสอบว่าคุณอยู่ในรัศมี
          <strong>20 เมตร</strong> จากโรงเรียนก่อนบันทึก
        </div>

        <!-- Button -->
        <button @click="handleCheckin" :disabled="loading" class="ck-btn">
          <span v-if="!loading">📍 ตรวจสอบตำแหน่งและเช็คชื่อ</span>
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
        <!-- Admin Login -->
        <div class="pt-2 mt-2 border-t">
          <NuxtLink to="/admin/login">
            <button class="admin-btn">🔐 เข้าสู่ระบบ Admin</button>
          </NuxtLink>
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
  max-width: 460px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  background: #fff;
}

/* Header */
.ck-header {
  background: linear-gradient(135deg, #1a56db 0%, #2563eb 55%, #3b82f6 100%);
  padding: 1.75rem 1.5rem 2.75rem;
  position: relative;
  overflow: hidden;
}

.ck-header-blob-1 {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
}

.ck-header-blob-2 {
  position: absolute;
  bottom: -30px;
  left: 20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.ck-school-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.18);
  border: 0.5px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #86efac;
  flex-shrink: 0;
}

.ck-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
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

.ck-section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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

.ck-input {
  width: 100%;
  box-sizing: border-box;
  height: 48px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0 14px;
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

/* Location hint */
.ck-location-hint {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #1e40af;
  margin-bottom: 4px;
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
  margin-top: 14px;
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

.admin-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  font-family: "Sarabun", sans-serif;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.admin-btn:hover {
  background: #f8fafc;
  color: #334155;
}
</style>
