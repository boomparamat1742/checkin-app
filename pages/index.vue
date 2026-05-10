<template>
  <div class="page-wrapper">

    <!-- Header -->
    <div class="page-header">
      <div class="header-blob-1" />
      <div class="header-blob-2" />
      <div class="header-icon">🏫</div>
      <h1 class="header-title">ระบบเช็คชื่อหน้าเสาธง</h1>
      <p class="header-sub">Smart Attendance Check-In</p>
    </div>

    <!-- Cards -->
    <div class="card-grid">

      <NuxtLink to="/student" class="role-card">
        <div class="role-icon-wrap role-icon--blue">
          <span>👨‍🎓</span>
        </div>
        <div class="role-info">
          <h2 class="role-title">นักเรียน</h2>
          <p class="role-sub">เช็คชื่อเข้าแถวหน้าเสาธง</p>
        </div>
        <span class="role-arrow">→</span>
      </NuxtLink>

      <NuxtLink to="/teacher" class="role-card">
        <div class="role-icon-wrap role-icon--indigo">
          <span>👨‍🏫</span>
        </div>
        <div class="role-info">
          <h2 class="role-title">ครู</h2>
          <p class="role-sub">เช็คชื่อครูประจำการ</p>
        </div>
        <span class="role-arrow">→</span>
      </NuxtLink>

    </div>

    <!-- Admin -->
    <div class="admin-wrap">
      <NuxtLink to="/admin/login">
        <button class="admin-btn">🔐 เข้าสู่ระบบ Admin</button>
      </NuxtLink>
    </div>

  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  font-family: 'Sarabun', sans-serif;
  gap: 1rem;
}

/* Header */
.page-header {
  width: 100%;
  max-width: 460px;
  background: linear-gradient(135deg, #1a56db 0%, #2563eb 55%, #3b82f6 100%);
  border-radius: 20px;
  padding: 1.75rem 1.5rem 2.75rem;
  position: relative;
  overflow: hidden;
}

.header-blob-1 {
  position: absolute;
  top: -50px; right: -50px;
  width: 160px; height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
}

.header-blob-2 {
  position: absolute;
  bottom: -30px; left: 20px;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.header-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  border: 0.5px solid rgba(255, 255, 255, 0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  margin-bottom: 12px;
  position: relative; z-index: 1;
}

.header-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
  position: relative; z-index: 1;
}

.header-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  position: relative; z-index: 1;
}

/* Cards */
.card-grid {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: -20px;
}

.role-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.role-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
  border-color: #bfdbfe;
}

.role-icon-wrap {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.role-icon--blue {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.role-icon--indigo {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.role-info {
  flex: 1;
}

.role-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
}

.role-sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.role-arrow {
  font-size: 18px;
  color: #cbd5e1;
  flex-shrink: 0;
  transition: color 0.15s, transform 0.15s;
}

.role-card:hover .role-arrow {
  color: #2563eb;
  transform: translateX(3px);
}

/* Admin */
.admin-wrap {
  width: 100%;
  max-width: 460px;
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
  font-family: 'Sarabun', sans-serif;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.admin-btn:hover {
  background: #f8fafc;
  color: #334155;
}
</style>