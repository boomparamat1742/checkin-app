/**
 * แปลง error จากการ insert ตาราง checkins เป็นข้อความภาษาไทย
 * การกันเช็คชื่อซ้ำทำด้วย unique index ใน database (ดู supabase/sql/checkins_unique_per_day.sql)
 */
export function checkinErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === "23505") {
    const msg = error.message ?? "";
    if (msg.includes("checkins_device_per_day")) return "อุปกรณ์นี้เช็คชื่อแล้ววันนี้";
    if (msg.includes("checkins_teacher_per_day")) return "ครูท่านนี้เช็คชื่อแล้ววันนี้";
    if (msg.includes("checkins_student_per_day")) return "นักเรียนคนนี้เช็คชื่อแล้ววันนี้";
    return "เช็คชื่อแล้ววันนี้";
  }
  return "บันทึกข้อมูลไม่สำเร็จ";
}
