import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  const supabase = createClient(
  config.public.supabaseUrl as string,
  config.supabaseServiceKey as string
);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_type", "teacher")
    .gte("checkin_at", today.toISOString())
    .lt("checkin_at", tomorrow.toISOString())
    .order("checkin_at", { ascending: true });

  const rows = data || [];

  const normalCount = rows.filter(
    (x) => x.checkin_status === "normal"
  ).length;

  const lateCount = rows.filter(
    (x) => x.checkin_status === "late"
  ).length;

  let message = `📋 สรุปการเช็คชื่อครูประจำหน้าเสาธง\n`;
  message += `📅 ${today.toLocaleDateString("th-TH")}\n\n`;

  message += `👨‍🏫 เช็คอินทั้งหมด: ${rows.length} คน\n\n`;
  message += `✅ มาปกติ: ${normalCount} คน\n`;
  message += `⚠️ มาสาย: ${lateCount} คน\n`;

  rows.forEach((x, index) => {
    const time = new Date(x.checkin_at).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    message += `${index + 1}. ${x.full_name} (${time})\n`;
  });

  // USER ID ของคนที่จะรับข้อความ
  const USER_ID = "Ue61f9f935537715a879e4d60face9695";

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
  };
});