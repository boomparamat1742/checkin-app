<script setup lang="ts">
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

definePageMeta({
  middleware: ["admin"],
});

const { $supabase } = useNuxtApp();

const loading = ref(false);
const rows = ref<any[]>([]);
const search = ref("");

async function loadData() {
  loading.value = true;
  const { data } = await $supabase
    .from("checkins")
    .select("*")
    .order("checkin_at", { ascending: false });
  rows.value = data || [];
  loading.value = false;
}

function exportExcel() {
  const worksheet = XLSX.utils.json_to_sheet(rows.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Checkins");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  saveAs(blob, "checkins.xlsx");
}

function handleLogout() {
  localStorage.removeItem("admin");
  navigateTo("/");
}

const filteredRows = computed(() =>
  rows.value.filter(
    (x) =>
      x.full_name?.toLowerCase().includes(search.value.toLowerCase()) ||
      x.class_room?.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

const todayCount = computed(() => {
  const today = new Date().toDateString();
  return rows.value.filter(
    (x) => new Date(x.checkin_at).toDateString() === today,
  ).length;
});

const avgDistance = computed(() => {
  if (!rows.value.length) return "0.0";
  const sum = rows.value.reduce((acc, x) => acc + (x.distance || 0), 0);
  return (sum / rows.value.length).toFixed(1);
});

onMounted(() => loadData());
</script>

<template>
  <div class="page-wrapper">
    <div class="dash-container">
      <!-- Top Bar -->
      <div class="topbar">
        <div class="topbar-left">
          <div class="topbar-icon">🏫</div>
          <div>
            <h1 class="topbar-title">Dashboard</h1>
            <p class="topbar-sub">ระบบเช็คชื่อหน้าเสาธง</p>
          </div>
        </div>
        <div class="topbar-right">
          <button @click="exportExcel" class="btn-export">
            📥 Export Excel
          </button>
          <button @click="handleLogout" class="btn-logout">ออกจากระบบ</button>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card stat-blue">
          <p class="stat-label">เช็คชื่อทั้งหมด</p>
          <h2 class="stat-value">{{ rows.length }}</h2>
          <p class="stat-hint">รายการในระบบ</p>
        </div>
        <div class="stat-card stat-green">
          <p class="stat-label">วันนี้</p>
          <h2 class="stat-value">{{ todayCount }}</h2>
          <p class="stat-hint">รายการวันนี้</p>
        </div>
        <div class="stat-card stat-amber">
          <p class="stat-label">ระยะทางเฉลี่ย</p>
          <h2 class="stat-value">
            {{ avgDistance }}<span class="stat-unit">m</span>
          </h2>
          <p class="stat-hint">จากจุดเช็คชื่อ</p>
        </div>
      </div>

      <!-- Search -->
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="search"
          placeholder="ค้นหาชื่อ หรือ ห้อง..."
          class="search-input"
        />
        <span v-if="search" class="search-count">
          {{ filteredRows.length }} รายการ
        </span>
      </div>

      <!-- Table -->
      <div class="table-card">
        <div v-if="loading" class="table-loading">⏳ กำลังโหลดข้อมูล...</div>

        <div v-else-if="filteredRows.length === 0" class="table-empty">
          <p>😕 ไม่พบข้อมูล</p>
        </div>

        <div v-else class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ชื่อ – สกุล</th>
                <th>ห้อง</th>
                <th>เลขที่</th>
                <th>ระยะทาง</th>
                <th>เวลาเช็คชื่อ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredRows" :key="item.id">
                <td class="td-index">{{ index + 1 }}</td>
                <td class="td-name">{{ item.full_name }}</td>
                <td>
                  <span class="badge-room">{{ item.class_room }}</span>
                </td>
                <td class="td-center">{{ item.student_number }}</td>
                <td>
                  <span
                    class="badge-dist"
                    :class="
                      item.distance <= 10
                        ? 'badge-dist--near'
                        : 'badge-dist--far'
                    "
                  >
                    {{ item.distance?.toFixed(1) }} m
                  </span>
                </td>
                <td class="td-time">
                  {{ new Date(item.checkin_at).toLocaleDateString("en-GB") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: #f1f5f9;
  padding: 1.5rem 1rem;
  font-family: "Sarabun", sans-serif;
}

.dash-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.topbar-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.topbar-sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.topbar-right {
  display: flex;
  gap: 8px;
}

.btn-export {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-export:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-logout {
  height: 40px;
  padding: 0 16px;
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

.btn-logout:hover {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

/* Stat Cards */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  border: 1px solid transparent;
}

.stat-blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.stat-green {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.stat-amber {
  background: #fffbeb;
  border-color: #fde68a;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 6px;
}

.stat-blue .stat-label {
  color: #3b82f6;
}
.stat-green .stat-label {
  color: #22c55e;
}
.stat-amber .stat-label {
  color: #f59e0b;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 4px;
  line-height: 1;
}

.stat-blue .stat-value {
  color: #1d4ed8;
}
.stat-green .stat-value {
  color: #16a34a;
}
.stat-amber .stat-value {
  color: #d97706;
}

.stat-unit {
  font-size: 18px;
  font-weight: 600;
  margin-left: 2px;
}

.stat-hint {
  font-size: 12px;
  margin: 0;
  color: #94a3b8;
}

/* Search */
.search-wrap {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 50px;
}

.search-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: "Sarabun", sans-serif;
  color: #0f172a;
  background: transparent;
}

.search-input::placeholder {
  color: #cbd5e1;
}

.search-count {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
}

/* Table */
.table-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-loading,
.table-empty {
  padding: 3rem;
  text-align: center;
  color: #94a3b8;
  font-size: 15px;
}

.table-scroll {
  overflow-x: auto;
}

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
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s;
}

.data-table tbody tr:last-child {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.data-table td {
  padding: 12px 16px;
  color: #334155;
  vertical-align: middle;
}

.td-index {
  color: #cbd5e1 !important;
  font-size: 12px;
  font-weight: 600;
  width: 40px;
}

.td-name {
  font-weight: 600;
  color: #0f172a !important;
}

.td-center {
  text-align: left;
}

.td-time {
  font-size: 13px;
  color: #64748b !important;
  white-space: nowrap;
}

.badge-room {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-dist {
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-dist--near {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.badge-dist--far {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

@media (max-width: 640px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
