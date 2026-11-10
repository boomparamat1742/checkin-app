<template>
  <div class="page-wrapper">
    <div class="split-card">
      <!-- LEFT: welcome panel -->
      <div class="welcome-panel">
        <div class="circle circle--big" />
        <div class="circle circle--mid" />
        <div class="circle circle--small" />

        <div class="welcome-content">
          <div class="header-icon">🏫</div>
          <h1 class="header-title">ระบบเช็คชื่อหน้าเสาธง</h1>
          <p class="header-sub">Smart Attendance Check-In</p>
        </div>
      </div>

      <!-- RIGHT: actions -->
      <div class="action-panel">
        <div class="corner-circle" />

        <div class="card-grid">
          <NuxtLink to="/student" class="role-card">
            <div class="role-icon-wrap">
              <span>👨‍🎓</span>
            </div>
            <div class="role-info">
              <h2 class="role-title">นักเรียน</h2>
              <p class="role-sub">เช็คชื่อเข้าแถวหน้าเสาธง</p>
            </div>
            <span class="role-arrow">→</span>
          </NuxtLink>

          <NuxtLink to="/teacher" class="role-card">
            <div class="role-icon-wrap">
              <span>👨‍🏫</span>
            </div>
            <div class="role-info">
              <h2 class="role-title">ครู</h2>
              <p class="role-sub">เช็คชื่อครูประจำการ</p>
            </div>
            <span class="role-arrow">→</span>
          </NuxtLink>
        </div>

        <div class="or-divider"><span /></div>

        <!-- Admin -->
        <div class="admin-wrap">
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
  background: linear-gradient(180deg, #0a6fd6 0%, #0b5bb8 45%, #083f86 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  font-family: "Sarabun", sans-serif;
}

/* Card */
.split-card {
  width: 100%;
  max-width: 860px;
  min-height: 440px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 30px 70px rgba(3, 25, 64, 0.45);
}

/* LEFT */
.welcome-panel {
  position: relative;
  overflow: hidden;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 2.5rem 2.25rem;
}

.circle {
  position: absolute;
  border-radius: 50%;
}

/* big shape that forms the blue panel with a curved right edge */
.circle--big {
  width: 560px;
  height: 560px;
  top: -190px;
  left: -170px;
  background: linear-gradient(145deg, #1e88f5 0%, #0b63c9 55%, #08479a 100%);
}

.circle--mid {
  width: 170px;
  height: 170px;
  bottom: -40px;
  right: 18px;
  background: radial-gradient(circle at 35% 30%, #3aa0ff 0%, #0b63c9 60%, #084a9f 100%);
  box-shadow: 0 18px 40px rgba(8, 63, 134, 0.45);
}

.circle--small {
  width: 210px;
  height: 210px;
  bottom: -120px;
  left: -70px;
  background: linear-gradient(145deg, #2b95ff 0%, #0a5fc4 100%);
  opacity: 0.9;
}

.welcome-content {
  position: relative;
  z-index: 1;
  max-width: 260px;
  margin-top: -40px;
}

.header-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-bottom: 16px;
}

.header-title {
  font-size: 30px;
  line-height: 1.2;
  font-weight: 800;
  color: #fff;
  margin: 0 0 10px;
  letter-spacing: 0.01em;
}

.header-sub {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin: 0;
}

/* RIGHT */
.action-panel {
  position: relative;
  overflow: hidden;
  padding: 2.75rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.corner-circle {
  position: absolute;
  width: 150px;
  height: 150px;
  right: -55px;
  bottom: -55px;
  border-radius: 50%;
  background: linear-gradient(145deg, #1e88f5 0%, #0b5bb8 100%);
}

.card-grid {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* role buttons styled like the gray input fields */
.role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f1f3f6;
  border: 1px solid transparent;
  text-decoration: none;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.15s;
}

.role-card:hover {
  background: #e8f1fd;
  border-color: #9cc7f5;
  transform: translateY(-1px);
}

.role-icon-wrap {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.role-info {
  flex: 1;
}

.role-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f2747;
  margin: 0 0 1px;
}

.role-sub {
  font-size: 12px;
  color: #7a8597;
  margin: 0;
}

.role-arrow {
  font-size: 17px;
  font-weight: 700;
  color: #0b5bb8;
  opacity: 0.55;
  flex-shrink: 0;
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.role-card:hover .role-arrow {
  opacity: 1;
  transform: translateX(3px);
}

/* thin divider like the "or" line */
.or-divider {
  position: relative;
  height: 1px;
  margin: 1.5rem 0;
  background: #d5dbe3;
}

.or-divider span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #d5dbe3;
  transform: translate(-50%, -50%);
}

/* Admin — solid navy button */
.admin-wrap {
  position: relative;
}

.admin-wrap a {
  display: block;
  text-decoration: none;
}

.admin-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  background: #0d3b74;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(13, 59, 116, 0.3);
  transition:
    background 0.15s,
    transform 0.15s;
}

.admin-btn:hover {
  background: #0a2f5d;
  transform: translateY(-1px);
}

.admin-btn:active {
  transform: scale(0.99);
}

/* Mobile: stack panels */
@media (max-width: 720px) {
  .split-card {
    grid-template-columns: 1fr;
    max-width: 440px;
    min-height: 0;
  }

  .welcome-panel {
    min-height: 220px;
    padding: 2rem 1.75rem;
    background: linear-gradient(145deg, #1e88f5 0%, #0b63c9 55%, #08479a 100%);
  }

  .circle--big {
    display: none;
  }

  .circle--mid {
    width: 120px;
    height: 120px;
    bottom: -40px;
    right: -20px;
  }

  .circle--small {
    width: 140px;
    height: 140px;
    bottom: -80px;
    left: -50px;
  }

  .welcome-content {
    margin-top: 0;
  }

  .header-title {
    font-size: 24px;
  }

  .action-panel {
    padding: 2rem 1.5rem 2.5rem;
  }

  .corner-circle {
    width: 100px;
    height: 100px;
    right: -40px;
    bottom: -40px;
  }
}
</style>
