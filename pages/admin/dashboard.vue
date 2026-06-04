<script setup lang="ts">
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

definePageMeta({ middleware: ["admin"] });

const { $supabase } = useNuxtApp();

const loading = ref(false);
const rows = ref<any[]>([]);
const teacherRows = ref<any[]>([]);
const teacherLoading = ref(false);
const search = ref("");
const activeTab = ref<"all" | "student" | "teacher">("all");
const classroomTab = ref<string>("all");
const dashboardTab = ref<"checkins" | "teachers" | "admins">("checkins");

const teacherForm = ref({
  id: null as number | null,
  teacher_number: "",
  full_name: "",
  position_name: "",
});

// Admin management
const adminUsers = ref<{ id: string; email: string; created_at: string }[]>([]);
const adminLoading = ref(false);
const adminForm = ref({ username: "", password: "" });
const adminSaving = ref(false);
const adminError = ref("");
const currentUserId = ref("");

// Confirm dialog
const confirmDialog = ref({
  show: false,
  title: "",
  message: "",
  resolve: null as ((v: boolean) => void) | null,
});

function showConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmDialog.value = { show: true, title, message, resolve };
  });
}

function onConfirmYes() {
  confirmDialog.value.resolve?.(true);
  confirmDialog.value.show = false;
}

function onConfirmNo() {
  confirmDialog.value.resolve?.(false);
  confirmDialog.value.show = false;
}

const CLASSROOMS = Array.from({ length: 6 }, (_, m) =>
  Array.from({ length: 3 }, (_, r) => `ม.${m + 1}/${r + 1}`),
).flat();

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

async function loadTeachers() {
  teacherLoading.value = true;
  const { data, error } = await $supabase
    .from("teachers")
    .select("*")
    .order("teacher_number", { ascending: true });
  if (error) console.log(error);
  teacherRows.value = (data || []).sort(
    (a, b) => Number(a.teacher_number) - Number(b.teacher_number),
  );
  teacherLoading.value = false;
}

async function saveTeacher() {
  if (!teacherForm.value.teacher_number || !teacherForm.value.full_name) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }
  if (teacherForm.value.id) {
    const { error } = await $supabase
      .from("teachers")
      .update({
        teacher_number: teacherForm.value.teacher_number,
        full_name: teacherForm.value.full_name,
        position_name: teacherForm.value.position_name,
      })
      .eq("id", teacherForm.value.id);
    if (error) {
      alert("แก้ไขข้อมูลไม่สำเร็จ");
      return;
    }
    alert("แก้ไขข้อมูลสำเร็จ");
  } else {
    const { error } = await $supabase.from("teachers").insert({
      teacher_number: teacherForm.value.teacher_number,
      full_name: teacherForm.value.full_name,
      position_name: teacherForm.value.position_name,
    });
    if (error) {
      alert("เพิ่มข้อมูลไม่สำเร็จ");
      return;
    }
    alert("เพิ่มข้อมูลสำเร็จ");
  }
  resetTeacherForm();
  await loadTeachers();
}

function editTeacher(item: any) {
  teacherForm.value = {
    id: item.id,
    teacher_number: item.teacher_number,
    full_name: item.full_name,
    position_name: item.position_name || "",
  };
}

async function deleteTeacher(id: number) {
  const ok = await showConfirm("ลบข้อมูลครู", "ต้องการลบข้อมูลครูรายนี้ใช่หรือไม่?");
  if (!ok) return;
  const { error } = await $supabase.from("teachers").delete().eq("id", id);
  if (error) {
    alert("ลบข้อมูลไม่สำเร็จ");
    return;
  }
  await loadTeachers();
}

function resetTeacherForm() {
  teacherForm.value = {
    id: null,
    teacher_number: "",
    full_name: "",
    position_name: "",
  };
}

function applySheetStyle(ws: XLSX.WorkSheet, headers: string[], dataLen: number) {
  // Column widths
  const colWidths: Record<string, number> = {
    ลำดับ: 6, ชื่อ: 28, ห้อง: 10, เลขที่: 8, ตำแหน่ง: 22,
    เลขที่ครู: 10, สถานะ: 10, ระยะทาง: 12, "GPS Accuracy": 14, วันที่เวลา: 22,
  };
  ws["!cols"] = headers.map((h) => ({ wch: colWidths[h] ?? 16 }));

  // Freeze header row
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Style header row
  for (let c = 0; c < headers.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "1D4ED8" }, patternType: "solid" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "93C5FD" } },
        bottom: { style: "thin", color: { rgb: "93C5FD" } },
        left: { style: "thin", color: { rgb: "93C5FD" } },
        right: { style: "thin", color: { rgb: "93C5FD" } },
      },
    };
  }

  // Style data rows (alternating)
  for (let r = 1; r <= dataLen; r++) {
    const isEven = r % 2 === 0;
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = {
        fill: { fgColor: { rgb: isEven ? "EFF6FF" : "FFFFFF" }, patternType: "solid" },
        alignment: { horizontal: c === 0 ? "center" : "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } },
        },
      };
    }
  }

  // Row height
  ws["!rows"] = [{ hpt: 28 }, ...Array(dataLen).fill({ hpt: 22 })];
}

function exportExcel() {
  const workbook = XLSX.utils.book_new();
  const now = new Date().toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });

  // --- Sheet: นักเรียน ---
  const studentHeaders = ["ลำดับ", "ชื่อ", "ห้อง", "เลขที่", "สถานะ", "ระยะทาง", "GPS Accuracy", "วันที่เวลา"];
  const studentData = rows.value
    .filter((x) => x.user_type === "student")
    .sort((a, b) => {
      if (a.class_room !== b.class_room) return (a.class_room || "").localeCompare(b.class_room || "");
      return Number(a.student_number) - Number(b.student_number);
    })
    .map((item, i) => ({
      ลำดับ: i + 1,
      ชื่อ: item.full_name || "-",
      ห้อง: item.class_room || "-",
      เลขที่: item.student_number || "-",
      สถานะ: item.checkin_status === "late" ? "มาสาย" : "ปกติ",
      ระยะทาง: `${(item.distance || 0).toFixed(1)} m`,
      "GPS Accuracy": item.gps_accuracy ? `${Number(item.gps_accuracy).toFixed(0)} m` : "-",
      วันที่เวลา: new Date(item.checkin_at).toLocaleString("th-TH"),
    }));

  const wsStudent = XLSX.utils.json_to_sheet(studentData, { header: studentHeaders });
  applySheetStyle(wsStudent, studentHeaders, studentData.length);
  XLSX.utils.book_append_sheet(workbook, wsStudent, "นักเรียน");

  // --- Sheet: ครู ---
  const teacherHeaders = ["ลำดับ", "เลขที่ครู", "ชื่อ", "ตำแหน่ง", "สถานะ", "ระยะทาง", "GPS Accuracy", "วันที่เวลา"];
  const teacherData = rows.value
    .filter((x) => x.user_type === "teacher")
    .sort((a, b) => Number(a.teacher_number) - Number(b.teacher_number))
    .map((item, i) => ({
      ลำดับ: i + 1,
      เลขที่ครู: item.teacher_number || "-",
      ชื่อ: item.full_name || "-",
      ตำแหน่ง: item.teacher_position || "-",
      สถานะ: item.checkin_status === "late" ? "มาสาย" : "ปกติ",
      ระยะทาง: `${(item.distance || 0).toFixed(1)} m`,
      "GPS Accuracy": item.gps_accuracy ? `${Number(item.gps_accuracy).toFixed(0)} m` : "-",
      วันที่เวลา: new Date(item.checkin_at).toLocaleString("th-TH"),
    }));

  const wsTeacher = XLSX.utils.json_to_sheet(teacherData, { header: teacherHeaders });
  applySheetStyle(wsTeacher, teacherHeaders, teacherData.length);
  XLSX.utils.book_append_sheet(workbook, wsTeacher, "ครู");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true });
  saveAs(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    }),
    `checkins_${now}.xlsx`,
  );
}

async function handleLogout() {
  const { $supabase } = useNuxtApp();
  await $supabase.auth.signOut();
  navigateTo("/");
}

async function loadAdminUsers() {
  adminLoading.value = true;
  try {
    adminUsers.value = await $fetch("/api/admin/users");
  } catch {
    adminUsers.value = [];
  }
  adminLoading.value = false;
}

async function createAdmin() {
  if (!adminForm.value.username || !adminForm.value.password) {
    adminError.value = "กรุณากรอกข้อมูลให้ครบ";
    return;
  }
  adminSaving.value = true;
  adminError.value = "";
  try {
    await $fetch("/api/admin/users", {
      method: "POST",
      body: adminForm.value,
    });
    adminForm.value = { username: "", password: "" };
    await loadAdminUsers();
  } catch (e: any) {
    adminError.value = e?.data?.message ?? "สร้างผู้ใช้ไม่สำเร็จ";
  }
  adminSaving.value = false;
}

async function deleteAdmin(id: string, email: string) {
  const name = email.replace("@checkin.local", "");
  const ok = await showConfirm("ลบ Admin", `ต้องการลบบัญชี "${name}" ใช่หรือไม่?`);
  if (!ok) return;
  try {
    await $fetch("/api/admin/users", {
      method: "DELETE",
      body: { id, requesterId: currentUserId.value },
    });
    await loadAdminUsers();
  } catch (e: any) {
    alert(e?.data?.message ?? "ลบผู้ใช้ไม่สำเร็จ");
  }
}

const filteredRows = computed(() => {
  const keyword = search.value.toLowerCase();
  return rows.value.filter((x) => {
    const matchTab =
      activeTab.value === "all" || x.user_type === activeTab.value;
    const matchClassroom =
      activeTab.value !== "student" ||
      classroomTab.value === "all" ||
      x.class_room === classroomTab.value;
    const matchSearch =
      x.full_name?.toLowerCase().includes(keyword) ||
      x.class_room?.toLowerCase().includes(keyword) ||
      x.teacher_number?.toLowerCase().includes(keyword) ||
      x.student_number?.toLowerCase().includes(keyword);
    return matchTab && matchClassroom && matchSearch;
  });
});

function classroomCount(room: string) {
  return rows.value.filter(
    (x) => x.user_type === "student" && x.class_room === room,
  ).length;
}

const todayCount = computed(() => {
  const today = new Date().toDateString();
  return rows.value.filter(
    (x) => new Date(x.checkin_at).toDateString() === today,
  ).length;
});
const lateCount = computed(
  () => rows.value.filter((x) => x.checkin_status === "late").length,
);
const avgDistance = computed(() => {
  if (!rows.value.length) return "0.0";
  const sum = rows.value.reduce((acc, x) => acc + (x.distance || 0), 0);
  return (sum / rows.value.length).toFixed(1);
});
const studentCount = computed(
  () => rows.value.filter((x) => x.user_type === "student").length,
);
const teacherCheckinCount = computed(
  () => rows.value.filter((x) => x.user_type === "teacher").length,
);

watch(activeTab, () => {
  classroomTab.value = "all";
});

watch(dashboardTab, (tab) => {
  if (tab === "admins" && adminUsers.value.length === 0) loadAdminUsers();
});

onMounted(async () => {
  const { data } = await $supabase.auth.getUser();
  currentUserId.value = data.user?.id ?? "";
  await loadData();
  await loadTeachers();
});
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
            <span v-if="loading">⏳</span><span v-else>🔄</span> รีเฟรช
          </button>
          <button @click="exportExcel" class="btn-export">
            📥 Export Excel
          </button>
          <button @click="handleLogout" class="btn-logout">ออกจากระบบ</button>
        </div>
      </div>

      <!-- MAIN TABS -->
      <div class="main-tab-group">
        <button
          class="main-tab"
          :class="{ 'main-tab--active': dashboardTab === 'checkins' }"
          @click="dashboardTab = 'checkins'"
        >
          📋 ข้อมูลเช็คชื่อ
        </button>
        <button
          class="main-tab"
          :class="{ 'main-tab--active': dashboardTab === 'teachers' }"
          @click="dashboardTab = 'teachers'"
        >
          👨‍🏫 จัดการข้อมูลครู
          <span class="main-tab-count">{{ teacherRows.length }}</span>
        </button>
        <button
          class="main-tab"
          :class="{ 'main-tab--active': dashboardTab === 'admins' }"
          @click="dashboardTab = 'admins'"
        >
          🔐 จัดการ Admin
        </button>
      </div>

      <!-- ===== CHECKINS TAB ===== -->
      <div v-if="dashboardTab === 'checkins'">
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
            <h2 class="stat-value stat-value--indigo">
              {{ teacherCheckinCount }}
            </h2>
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

        <!-- CLASSROOM SUB-TABS (แสดงเมื่อกรองนักเรียน) -->
        <div v-if="activeTab === 'student'" class="classroom-tab-wrap">
          <div class="classroom-tab-group">
            <button
              class="classroom-tab"
              :class="{ 'classroom-tab--active': classroomTab === 'all' }"
              @click="classroomTab = 'all'"
            >
              ทั้งหมด
              <span class="classroom-count">{{ studentCount }}</span>
            </button>
            <button
              v-for="room in CLASSROOMS"
              :key="room"
              class="classroom-tab"
              :class="{ 'classroom-tab--active': classroomTab === room }"
              @click="classroomTab = room"
            >
              {{ room }}
              <span v-if="classroomCount(room) > 0" class="classroom-count">
                {{ classroomCount(room) }}
              </span>
            </button>
          </div>
        </div>

        <!-- TOOLBAR -->
        <div class="toolbar">
          <div class="tab-group">
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'all' }"
              @click="activeTab = 'all'"
            >
              ทั้งหมด <span class="tab-count">{{ rows.length }}</span>
            </button>
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'student' }"
              @click="activeTab = 'student'"
            >
              นักเรียน <span class="tab-count">{{ studentCount }}</span>
            </button>
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'teacher' }"
              @click="activeTab = 'teacher'"
            >
              ครู <span class="tab-count">{{ teacherCheckinCount }}</span>
            </button>
          </div>
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input
              v-model="search"
              class="search-input"
              placeholder="ค้นหาชื่อ ห้อง เลขที่..."
            />
            <span v-if="search" class="search-count"
              >{{ filteredRows.length }} รายการ</span
            >
          </div>
        </div>

        <!-- CHECKIN TABLE -->
        <div class="table-card">
          <div v-if="loading" class="table-state">
            <div class="spinner" />
            <p>กำลังโหลดข้อมูล...</p>
          </div>
          <div v-else-if="filteredRows.length === 0" class="table-state">
            <p class="empty-icon">😕</p>
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
                      {{
                        item.user_type === "teacher" ? "👨‍🏫 ครู" : "👨‍🎓 นักเรียน"
                      }}
                    </span>
                  </td>
                  <td class="td-name">{{ item.full_name }}</td>
                  <td>
                    <span v-if="item.class_room" class="badge badge--slate">{{
                      item.class_room
                    }}</span>
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
                      {{
                        item.checkin_status === "late" ? "⚠️ มาสาย" : "✅ ปกติ"
                      }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="badge"
                      :class="
                        item.distance <= 10 ? 'badge--green' : 'badge--amber'
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
          <div v-if="!loading && filteredRows.length > 0" class="table-footer">
            แสดง {{ filteredRows.length }} จาก {{ rows.length }} รายการ
          </div>
        </div>
      </div>

      <!-- ===== ADMINS TAB ===== -->
      <div v-if="dashboardTab === 'admins'">
        <!-- FORM -->
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-header-left">
              <div class="form-icon">➕</div>
              <div>
                <h3 class="form-title">เพิ่ม Admin</h3>
                <p class="form-sub">สร้างบัญชีผู้ดูแลระบบใหม่</p>
              </div>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">ชื่อผู้ใช้ <span class="required">*</span></label>
              <input v-model="adminForm.username" class="form-input" placeholder="เช่น admin2" />
            </div>
            <div class="form-field">
              <label class="form-label">รหัสผ่าน <span class="required">*</span></label>
              <input v-model="adminForm.password" type="password" class="form-input" placeholder="••••••••" />
            </div>
            <div class="form-field form-field--action">
              <label class="form-label">&nbsp;</label>
              <button class="btn-save" @click="createAdmin" :disabled="adminSaving">
                {{ adminSaving ? "⏳ กำลังสร้าง..." : "➕ สร้าง Admin" }}
              </button>
            </div>
          </div>
          <div v-if="adminError" class="admin-error">⚠️ {{ adminError }}</div>
        </div>

        <!-- LIST -->
        <div class="table-card">
          <div class="table-card-header">
            <h3 class="table-card-title">รายชื่อ Admin ทั้งหมด</h3>
            <span class="teacher-total-badge">{{ adminUsers.length }} คน</span>
          </div>
          <div v-if="adminLoading" class="table-state">
            <div class="spinner" />
            <p>กำลังโหลด...</p>
          </div>
          <div v-else-if="adminUsers.length === 0" class="table-state">
            <p class="empty-icon">🔐</p>
            <p>ยังไม่มี Admin</p>
          </div>
          <div v-else class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อผู้ใช้</th>
                  <th>วันที่สร้าง</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(u, i) in adminUsers" :key="u.id">
                  <td class="td-index">{{ i + 1 }}</td>
                  <td class="td-name">{{ u.email.replace("@checkin.local", "") }}</td>
                  <td class="td-time">{{ new Date(u.created_at).toLocaleString("th-TH") }}</td>
                  <td>
                    <span v-if="u.id === currentUserId" class="badge badge--green">
                      ✅ บัญชีปัจจุบัน
                    </span>
                    <button
                      v-else
                      class="btn-delete"
                      @click="deleteAdmin(u.id, u.email)"
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== TEACHERS TAB ===== -->
      <div v-if="dashboardTab === 'teachers'">
        <!-- FORM CARD -->
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-header-left">
              <div class="form-icon">{{ teacherForm.id ? "✏️" : "➕" }}</div>
              <div>
                <h3 class="form-title">
                  {{ teacherForm.id ? "แก้ไขข้อมูลครู" : "เพิ่มข้อมูลครู" }}
                </h3>
                <p class="form-sub">
                  {{
                    teacherForm.id
                      ? "แก้ไขข้อมูลที่ต้องการ"
                      : "กรอกข้อมูลครูใหม่"
                  }}
                </p>
              </div>
            </div>
            <button
              v-if="teacherForm.id"
              class="btn-cancel"
              @click="resetTeacherForm"
            >
              ✕ ยกเลิก
            </button>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label class="form-label"
                >เลขที่ครู <span class="required">*</span></label
              >
              <input
                v-model="teacherForm.teacher_number"
                class="form-input"
                placeholder="เช่น 1"
              />
            </div>
            <div class="form-field form-field--wide">
              <label class="form-label"
                >ชื่อ – สกุล <span class="required">*</span></label
              >
              <input
                v-model="teacherForm.full_name"
                class="form-input"
                placeholder="กรอกชื่อ-สกุล"
              />
            </div>
            <div class="form-field form-field--wide">
              <label class="form-label">ตำแหน่ง</label>
              <input
                v-model="teacherForm.position_name"
                class="form-input"
                placeholder="เช่น ครูชำนาญการ"
              />
            </div>
            <div class="form-field form-field--action">
              <label class="form-label">&nbsp;</label>
              <button class="btn-save" @click="saveTeacher">
                {{ teacherForm.id ? "💾 บันทึกการแก้ไข" : "➕ เพิ่มครู" }}
              </button>
            </div>
          </div>
        </div>

        <!-- TEACHER TABLE -->
        <div class="table-card">
          <div class="table-card-header">
            <h3 class="table-card-title">รายชื่อครูทั้งหมด</h3>
            <span class="teacher-total-badge">{{ teacherRows.length }} คน</span>
          </div>

          <div v-if="teacherLoading" class="table-state">
            <div class="spinner" />
            <p>กำลังโหลดข้อมูล...</p>
          </div>
          <div v-else-if="teacherRows.length === 0" class="table-state">
            <p class="empty-icon">👨‍🏫</p>
            <p>ยังไม่มีข้อมูลครู</p>
          </div>
          <div v-else class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>เลขที่ครู</th>
                  <th>ชื่อ – สกุล</th>
                  <th>ตำแหน่ง</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in teacherRows" :key="item.id">
                  <td class="td-index">{{ index + 1 }}</td>
                  <td>
                    <span class="badge badge--indigo">{{
                      item.teacher_number
                    }}</span>
                  </td>
                  <td class="td-name">{{ item.full_name }}</td>
                  <td>
                    <span v-if="item.position_name" class="badge badge--slate">
                      {{ item.position_name }}
                    </span>
                    <span v-else class="td-dash">—</span>
                  </td>
                  <td>
                    <div class="action-group">
                      <button class="btn-edit" @click="editTeacher(item)">
                        ✏️ แก้ไข
                      </button>
                      <button
                        class="btn-delete"
                        @click="deleteTeacher(item.id)"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CONFIRM DIALOG -->
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="confirmDialog.show" class="modal-backdrop" @click.self="onConfirmNo">
        <div class="modal-box">
          <div class="modal-icon">⚠️</div>
          <h3 class="modal-title">{{ confirmDialog.title }}</h3>
          <p class="modal-message">{{ confirmDialog.message }}</p>
          <div class="modal-actions">
            <button class="modal-btn modal-btn--cancel" @click="onConfirmNo">ยกเลิก</button>
            <button class="modal-btn modal-btn--confirm" @click="onConfirmYes">ยืนยัน</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
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
  transition:
    opacity 0.15s,
    transform 0.1s;
}

.btn-refresh {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
}
.btn-refresh:hover {
  background: #e2e8f0;
}
.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-export {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}
.btn-export:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-logout {
  background: #fff;
  color: #ef4444;
  border: 1px solid #fecaca;
}
.btn-logout:hover {
  background: #fef2f2;
}

/* MAIN TABS */
.main-tab-group {
  display: flex;
  gap: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 6px;
}

.main-tab {
  flex: 1;
  height: 42px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  color: #64748b;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    background 0.15s,
    color 0.15s;
}

.main-tab:hover {
  background: #f1f5f9;
  color: #334155;
}

.main-tab--active {
  background: #2563eb;
  color: #fff;
}
.main-tab--active:hover {
  background: #1d4ed8;
}

.main-tab-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.25);
}

.main-tab:not(.main-tab--active) .main-tab-count {
  background: #f1f5f9;
  color: #64748b;
}

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
  font-size: 18px;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon--blue {
  background: #eff6ff;
}
.stat-icon--green {
  background: #f0fdf4;
}
.stat-icon--red {
  background: #fef2f2;
}
.stat-icon--purple {
  background: #f5f3ff;
}
.stat-icon--indigo {
  background: #eef2ff;
}
.stat-icon--amber {
  background: #fffbeb;
}

.stat-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.stat-badge--blue {
  background: #dbeafe;
  color: #1d4ed8;
}
.stat-badge--green {
  background: #dcfce7;
  color: #166534;
}
.stat-badge--red {
  background: #fee2e2;
  color: #991b1b;
}
.stat-badge--purple {
  background: #ede9fe;
  color: #6d28d9;
}
.stat-badge--indigo {
  background: #e0e7ff;
  color: #3730a3;
}
.stat-badge--amber {
  background: #fef3c7;
  color: #92400e;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 2px;
  line-height: 1;
}
.stat-value--blue {
  color: #1d4ed8;
}
.stat-value--green {
  color: #16a34a;
}
.stat-value--red {
  color: #dc2626;
}
.stat-value--purple {
  color: #7c3aed;
}
.stat-value--indigo {
  color: #4338ca;
}
.stat-value--amber {
  color: #d97706;
}
.stat-unit {
  font-size: 14px;
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
  transition:
    background 0.15s,
    color 0.15s;
}

.tab-btn:hover {
  background: #f1f5f9;
  color: #334155;
}
.tab-btn--active {
  background: #2563eb;
  color: #fff;
}
.tab-btn--active:hover {
  background: #1d4ed8;
}

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

.search-icon {
  font-size: 15px;
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
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
}

/* TABLE CARD */
.table-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.table-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.teacher-total-badge {
  font-size: 12px;
  font-weight: 700;
  color: #3730a3;
  background: #e0e7ff;
  border-radius: 20px;
  padding: 3px 12px;
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

.empty-icon {
  font-size: 32px;
  margin: 0;
}

.spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  border-bottom: 1px solid #f8fafc;
  transition: background 0.1s;
}
.data-table tbody tr:last-child {
  border-bottom: none;
}
.data-table tbody tr:hover {
  background: #fafbff;
}

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
.td-center {
  text-align: center;
}
.td-time {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}
.td-dash {
  color: #cbd5e1;
}

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

.badge--blue {
  background: #dbeafe;
  color: #1d4ed8;
}
.badge--purple {
  background: #ede9fe;
  color: #6d28d9;
}
.badge--green {
  background: #dcfce7;
  color: #166534;
}
.badge--red {
  background: #fee2e2;
  color: #991b1b;
}
.badge--amber {
  background: #fef3c7;
  color: #92400e;
}
.badge--slate {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.badge--indigo {
  background: #e0e7ff;
  color: #3730a3;
}

.table-footer {
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
  font-weight: 500;
}

/* FORM CARD */
.form-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.form-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.form-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.form-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
}
.form-sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 120px 1fr 1fr auto;
  gap: 12px;
  padding: 1.25rem;
  align-items: end;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field--wide {
}
.form-field--action {
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  display: block;
}

.required {
  color: #ef4444;
}

.form-input {
  height: 44px;
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
  width: 100%;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #cbd5e1;
}

.form-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.btn-save {
  height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    transform 0.1s;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.btn-save:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-cancel {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  font-family: "Sarabun", sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover {
  background: #fef2f2;
}

/* ACTION BUTTONS */
.action-group {
  display: flex;
  gap: 6px;
}

.btn-edit,
.btn-delete {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  transition:
    opacity 0.15s,
    transform 0.1s;
}

.btn-edit {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}
.btn-edit:hover {
  background: #fde68a;
  transform: translateY(-1px);
}
.btn-delete {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.btn-delete:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

/* CLASSROOM TABS */
.classroom-tab-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 12px;
  overflow-x: auto;
}

.classroom-tab-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.classroom-tab {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  font-family: "Sarabun", sans-serif;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  white-space: nowrap;
}

.classroom-tab:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.classroom-tab--active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.classroom-count {
  font-size: 10px;
  font-weight: 700;
  background: rgba(255,255,255,0.25);
  border-radius: 20px;
  padding: 1px 6px;
}

.classroom-tab:not(.classroom-tab--active) .classroom-count {
  background: #e0e7ff;
  color: #3730a3;
}

/* ADMIN ERROR */
.admin-error {
  margin: 0 1.25rem 1rem;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #991b1b;
  font-size: 13px;
  font-weight: 600;
}

/* CONFIRM MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-box {
  background: #fff;
  border-radius: 18px;
  padding: 2rem 1.75rem 1.5rem;
  max-width: 360px;
  width: 100%;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
  text-align: center;
}

.modal-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}

.modal-message {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.modal-btn {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  font-family: "Sarabun", sans-serif;
  transition: opacity 0.15s, transform 0.1s;
}

.modal-btn--cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.modal-btn--cancel:hover {
  background: #e2e8f0;
}

.modal-btn--confirm {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.modal-btn--confirm:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-box,
.modal-fade-leave-active .modal-box {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-box {
  transform: scale(0.95) translateY(8px);
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .tab-group {
    justify-content: center;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
