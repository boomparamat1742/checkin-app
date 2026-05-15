import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  );

  // เวลาไทย
  const thailandNow = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    }),
  );

  // เริ่มต้นวัน
  const today = new Date(thailandNow);
  today.setHours(0, 0, 0, 0);

  // วันถัดไป
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // แปลงเป็น UTC สำหรับ query
  const startUtc = new Date(today.getTime() - 7 * 60 * 60 * 1000);
  const endUtc = new Date(tomorrow.getTime() - 7 * 60 * 60 * 1000);


  // ดึงข้อมูล
  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_type", "teacher")
    .gte("checkin_at", startUtc.toISOString())
    .lt("checkin_at", endUtc.toISOString())
    .order("checkin_at", { ascending: true });

  if (error) {
    console.error(error);

    return {
      success: false,
      error: error.message,
    };
  }

  const rows = data || [];

  // แยกประเภท
  const normalRows = rows.filter((x) => x.checkin_status === "normal");

  const lateRows = rows.filter((x) => x.checkin_status === "late");

  const normalCount = normalRows.length;
  const lateCount = lateRows.length;

  // สร้างข้อความ
  let message = `📋 สรุปการเช็คชื่อครูประจำหน้าเสาธง\n`;

  message += `📅 ${today.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
  })}\n\n`;

  message += `👨‍🏫 เช็คอินทั้งหมด: ${rows.length} คน\n`;
  message += `✅ มาปกติ: ${normalCount} คน\n`;
  message += `⚠️ มาสาย: ${lateCount} คน\n\n`;

  // =========================
  // คนที่มาปกติ
  // =========================
  message += `✅ รายชื่อมาปกติ\n`;

  if (normalRows.length > 0) {
    normalRows.forEach((x, index) => {
      const time = new Date(x.checkin_at).toLocaleTimeString("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
      });

      message += `${index + 1}. ${x.full_name} (${time})\n`;
    });
  } else {
    message += `- ไม่มี -\n`;
  }

  message += `\n`;

  // =========================
  // คนที่มาสาย
  // =========================
  message += `⚠️ รายชื่อมาสาย\n`;

  if (lateRows.length > 0) {
    lateRows.forEach((x, index) => {
      const time = new Date(x.checkin_at).toLocaleTimeString("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
      });

      message += `${index + 1}. ${x.full_name} (${time})\n`;
    });
  } else {
    message += `- ไม่มี -`;
  }

  // LINE USER ID
  const USER_ID = "Ue61f9f935537715a879e4d60face9695";

  // ส่ง LINE
  await $fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: {
      to: USER_ID,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    },
  });

  return {
    success: true,
    total: rows.length,
  };
});
