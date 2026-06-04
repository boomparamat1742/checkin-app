<script setup lang="ts">
const { $supabase } = useNuxtApp();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorText = ref("");

async function handleLogin() {
  loading.value = true;
  errorText.value = "";

  const email = `${username.value.trim().toLowerCase()}@checkin.local`;

  const { error } = await $supabase.auth.signInWithPassword({
    email,
    password: password.value,
  });

  if (error) {
    errorText.value = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    loading.value = false;
    return;
  }

  navigateTo("/admin/dashboard");
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
          ระบบจัดการเช็คชื่อ
        </div>
        <div class="ck-icon-circle">🔐</div>
        <h1 class="ck-title">Admin Login</h1>
        <p class="ck-subtitle">เข้าสู่ระบบสำหรับผู้ดูแล</p>
      </div>

      <!-- Body -->
      <div class="ck-body">
        <p class="ck-section-label">ข้อมูลผู้ดูแลระบบ</p>

        <!-- Username -->
        <div class="ck-field">
          <label class="ck-label">ชื่อผู้ใช้</label>
          <input
            v-model="username"
            type="text"
            placeholder="admin"
            class="ck-input"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Password -->
        <div class="ck-field">
          <label class="ck-label">รหัสผ่าน</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="ck-input"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Error -->
        <transition name="fade">
          <div v-if="errorText" class="ck-status ck-status--error">
            <span class="status-dot" />
            {{ errorText }}
          </div>
        </transition>

        <!-- Login Button -->
        <button @click="handleLogin" :disabled="loading" class="ck-btn">
          <span v-if="!loading">🔐 เข้าสู่ระบบ</span>
          <span v-else>⏳ กำลังตรวจสอบ...</span>
        </button>

        <!-- Back -->
        <div class="mt-2">
          <NuxtLink to="/">
            <button class="admin-btn">← กลับหน้าเช็คชื่อ</button>
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

.ck-card {
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  background: #fff;
}

/* Header */
.ck-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%);
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
  background: #fbbf24;
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
  color: rgba(255, 255, 255, 0.7);
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
  border-color: #1d4ed8;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.ck-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Button */
.ck-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: #1d4ed8;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  margin-top: 14px;
  transition:
    background 0.15s,
    transform 0.1s,
    box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
}

.ck-btn:hover:not(:disabled) {
  background: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(29, 78, 216, 0.4);
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
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
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
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

/* Back button */
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
