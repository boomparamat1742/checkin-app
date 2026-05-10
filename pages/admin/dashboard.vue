<script setup lang="ts">
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

definePageMeta({ middleware: ["admin"] });

const { $supabase } = useNuxtApp();

const loading = ref(false);
const rows = ref<any[]>([]);
const search = ref("");
const activeTab = ref<"all" | "student" | "teacher">("all");

async function loadData() {
  loading.value = true;
  const { data, error } = await $supabase
    .from("checkins")
    .select("*")
    .order("checkin_at", { ascending: false });
  if (error) console.log(error);
  rows.value = data || [];
  loading.value = false;
}

function exportExcel() {
  const exportData = rows.value.map((item, index) => ({
    ลำดับ: index + 1,
    ประเภท: item.user_type === "teacher" ? "ครู" : "นักเรียน",
    ชื่อ: item.full_name || "-",
    ห้อง: item.class_room || "-",
    เลขที่นักเรียน: item.student_number || "-",
    เลขที่ครู: item.teacher_number || "-",
    ตำแหน่ง: item.teacher_position || "-",
    สถานะ: item.checkin_status === "late" ? "มาสาย" : "ปกติ",
    ระยะทาง: `${(item.distance || 0).toFixed(1)} m`,
    วันที่เวลา: new Date(item.checkin_at).toLocaleString("th-TH"),
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Checkins");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    }),
    "checkins.xlsx"
  );
}

function handleLogout() {
  localStorage.removeItem("admin");
  navigateTo("/");
}

const filteredRows = computed(() => {
  const keyword = search.value.toLowerCase();
  return rows.value.filter((x) => {
    const matchTab =
      activeTab.value === "all" || x.user_type === activeTab.value;
    const matchSearch =
      x.full_name?.toLowerCase().includes(keyword) ||
      x.class_room?.toLowerCase().includes(keyword) ||
      x.teacher_number?.toLowerCase().includes(keyword) ||
      x.student_number?.toLowerCase().includes(keyword);
    return matchTab && matchSearch;
  });
});

const todayCount = computed(() => {
  const today = new Date().toDateString();
  return rows.value.filter(
    (x) => new Date(x.checkin_at).toDateString() === today
  ).length;
});

const lateCount = computed(() =>
  rows.value.filter((x) => x.checkin_status === "late").length
);

const avgDistance = computed(() => {
  if (!rows.value.length) return "0.0";
  const sum = rows.value.reduce((acc, x) => acc + (x.distance || 0), 0);
  return (sum / rows.value.length).toFixed(1);
});

const studentCount = computed(
  () => rows.value.filter((x) => x.user_type === "student").length
);

const teacherCount = computed(
  () => rows.value.filter((x) => x.user_type === "teacher").length
);

onMounted(() => loadData());
</script>

<template>
  <div class="page-wrapper">
    <div class="dash-container">

      <!-- TOPBAR -->
      <div class="topbar">
        <div class="topbar-left">
          <div class="topbar-icon">🏫</div>
          <div>
            <h1 class="topbar-title">Dashboard</h1>
            <p class="topbar-sub">ระบบเช็คชื่อหน้าเสาธง</p>
          </div>
        </div>
        <div class="topbar-right">
          <button @click="loadData" class="btn-refresh" :disabled="loading">
            {{ loading ? "⏳" : "🔄" }} รีเฟรช
          </button>
          <button @click="exportExcel" class="btn-export">
            📥 Export Excel
          </button>
          <button @click="handleLogout" class="btn-logout">
            ออกจากระบบ
          </button>
        </div>
      </div>

      <!-- STATS -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon stat-icon--blue">📋</span>
            <span class="stat-badge stat-badge--blue">ทั้งหมด</span>
          </div>
          <h2 class="stat-value stat-value--blue">{{ rows.length }}</h2>
          <p class="stat-label">รายการทั้งหมด</p>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon stat-icon--green">✅</span>
            <span class="stat-badge stat-badge--green">วันนี้</span>
          </div>
          <h2 class="stat-value stat-value--green">{{ todayCount }}</h2>
          <p class="stat-label">เช็คชื่อวันนี้</p>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon stat-icon--red">⚠️</span>
            <span class="stat-badge stat-badge--red">สาย</span>
          </div>
          <h2 class="stat-value stat-value--red">{{ lateCount }}</h2>
          <p class="stat-label">ผู้มาสายทั้งหมด</p>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon stat-icon--purple">👨‍🎓</span>
            <span class="stat-badge stat-badge--purple">นักเรียน</span>
          </div>
          <h2 class="stat-value stat-value--purple">{{ studentCount }}</h2>
          <p class="stat-label">รายการนักเรียน</p>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon stat-icon--indigo">👨‍🏫</span>
            <span class="stat-badge stat-badge--indigo">ครู</span>
          </div>
          <h2 class="stat-value stat-value--indigo">{{ teacherCount }}</h2>
          <p class="stat-label">รายการครู</p>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon stat-icon--amber">📍</span>
            <span class="stat-badge stat-badge--amber">ระยะทาง</span>
          </div>
          <h2 class="stat-value stat-value--amber">
            {{ avgDistance }}<span class="stat-unit">m</span>
          </h2>
          <p class="stat-label">ระยะทางเฉลี่ย</p>
        </div>
      </div>

      <!-- FILTER + SEARCH -->
      <div class="toolbar">
        <div class="tab-group">
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            ทั้งหมด
            <span class="tab-count">{{ rows.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'student' }"
            @click="activeTab = 'student'"
          >
            นักเรียน
            <span class="tab-count">{{ studentCount }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'teacher' }"
            @click="activeTab = 'teacher'"
          >
            ครู
            <span class="tab-count">{{ teacherCount }}</span>
          </button>
        </div>

        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="search"
            class="search-input"
            placeholder="ค้นหาชื่อ ห้อง เลขที่..."
          />
          <span v-if="search" class="search-count">
            {{ filteredRows.length }} รายการ
          </span>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-card">
        <div v-if="loading" class="table-state">
          <div class="spinner" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>

        <div v-else-if="filteredRows.length === 0" class="table-state">
          <p class="table-empty-icon">😕</p>
          <p>ไม่พบข้อมูล</p>
        </div>

        <div v-else class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ประเภท</th>
                <th>ชื่อ – สกุล</th>
                <th>ห้อง</th>
                <th>เลขที่</th>
                <th>สถานะ</th>
                <th>ระยะทาง</th>
                <th>เวลาเช็คชื่อ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredRows" :key="item.id">
                <td class="td-index">{{ index + 1 }}</td>

                <td>
                  <span
                    class="badge"
                    :class="
                      item.user_type === 'teacher'
                        ? 'badge--purple'
                        : 'badge--blue'
                    "
                  >
                    {{ item.user_type === "teacher" ? "👨‍🏫 ครู" : "👨‍🎓 นักเรียน" }}
                  </span>
                </td>

                <td class="td-name">{{ item.full_name }}</td>

                <td>
                  <span v-if="item.class_room" class="badge badge--slate">
                    {{ item.class_room }}
                  </span>
                  <span v-else class="td-dash">—</span>
                </td>

                <td class="td-center">
                  {{ item.student_number || item.teacher_number || "—" }}
                </td>

                <td>
                  <span
                    class="badge"
                    :class="
                      item.checkin_status === 'late'
                        ? 'badge--red'
                        : 'badge--green'
                    "
                  >
                    {{ item.checkin_status === "late" ? "⚠️ มาสาย" : "✅ ปกติ" }}
                  </span>
                </td>

                <td>
                  <span
                    class="badge"
                    :class="
                      item.distance <= 10
                        ? 'badge--green'
                        : 'badge--amber'
                    "
                  >
                    {{ item.distance?.toFixed(1) }} m
                  </span>
                </td>

                <td class="td-time">
                  {{ new Date(item.checkin_at).toLocaleString("th-TH") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div v-if="!loading && filteredRows.length > 0" class="table-footer">
          แสดง {{ filteredRows.length }} จาก {{ rows.length }} รายการ
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: #f1f5f9;
  padding: 1.5rem 1rem 3rem;
  font-family: "Sarabun", sans-serif;
}

.dash-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* TOPBAR */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.topbar-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.topbar-sub {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
}

.topbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-refresh,
.btn-export,
.btn-logout {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  transition: opacity 0.15s, transform 0.1s;
}

.btn-refresh {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-refresh:hover { background: #e2e8f0; }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-export {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-export:hover { opacity: 0.9; transform: translateY(-1px); }

.btn-logout {
  background: #fff;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.btn-logout:hover { background: #fef2f2; }

/* STATS */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 1rem 1.1rem;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.stat-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon--blue   { background: #eff6ff; }
.stat-icon--green  { background: #f0fdf4; }
.stat-icon--red    { background: #fef2f2; }
.stat-icon--purple { background: #f5f3ff; }
.stat-icon--indigo { background: #eef2ff; }
.stat-icon--amber  { background: #fffbeb; }

.stat-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.stat-badge--blue   { background: #dbeafe; color: #1d4ed8; }
.stat-badge--green  { background: #dcfce7; color: #166534; }
.stat-badge--red    { background: #fee2e2; color: #991b1b; }
.stat-badge--purple { background: #ede9fe; color: #6d28d9; }
.stat-badge--indigo { background: #e0e7ff; color: #3730a3; }
.stat-badge--amber  { background: #fef3c7; color: #92400e; }

.stat-value {
  font-size: 30px;
  font-weight: 800;
  margin: 0 0 2px;
  line-height: 1;
}

.stat-value--blue   { color: #1d4ed8; }
.stat-value--green  { color: #16a34a; }
.stat-value--red    { color: #dc2626; }
.stat-value--purple { color: #7c3aed; }
.stat-value--indigo { color: #4338ca; }
.stat-value--amber  { color: #d97706; }

.stat-unit {
  font-size: 16px;
  font-weight: 600;
  margin-left: 2px;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
  font-weight: 500;
}

/* TOOLBAR */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-group {
  display: flex;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  gap: 2px;
}

.tab-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: "Sarabun", sans-serif;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s, color 0.15s;
}

.tab-btn:hover { background: #f1f5f9; color: #334155; }

.tab-btn--active {
  background: #2563eb;
  color: #fff;
}

.tab-btn--active:hover { background: #1d4ed8; color: #fff; }

.tab-count {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.25);
  font-weight: 700;
}

.tab-btn:not(.tab-btn--active) .tab-count {
  background: #f1f5f9;
  color: #475569;
}

.search-wrap {
  flex: 1;
  min-width: 200px;
  height: 46px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}

.search-icon { font-size: 15px; flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: "Sarabun", sans-serif;
  color: #0f172a;
  background: transparent;
}

.search-input::placeholder { color: #cbd5e1; }

.search-count {
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
}

/* TABLE */
.table-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.table-state {
  padding: 4rem;
  text-align: center;
  color: #94a3b8;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.table-empty-icon { font-size: 32px; margin: 0; }

.spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.table-scroll { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  white-space: nowrap;
}

.data-table tbody tr {
  border-bottom: 1px solid #f8fafc;
  transition: background 0.1s;
}

.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #fafbff; }

.data-table td {
  padding: 12px 16px;
  color: #334155;
  vertical-align: middle;
}

.td-index {
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  width: 44px;
}

.td-name {
  font-weight: 700;
  color: #0f172a;
}

.td-center { text-align: center; }

.td-time {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.td-dash { color: #cbd5e1; }

/* BADGES */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.badge--blue   { background: #dbeafe; color: #1d4ed8; }
.badge--purple { background: #ede9fe; color: #6d28d9; }
.badge--green  { background: #dcfce7; color: #166534; }
.badge--red    { background: #fee2e2; color: #991b1b; }
.badge--amber  { background: #fef3c7; color: #92400e; }
.badge--slate  { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

/* TABLE FOOTER */
.table-footer {
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
  font-weight: 500;
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .stat-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 640px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .topbar { flex-direction: column; align-items: flex-start; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .tab-group { justify-content: center; }
}
</style>