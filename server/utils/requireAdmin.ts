import { createClient, type User } from "@supabase/supabase-js";
import type { H3Event } from "h3";

/**
 * ตรวจว่าผู้เรียกเป็น admin ที่ login อยู่จริง
 * - ต้องส่ง Authorization: Bearer <access_token> ของ Supabase session
 * - user ต้องมี app_metadata.role === "admin" (ตั้งโดย server เท่านั้น ผู้ใช้แก้เองไม่ได้)
 * คืนค่า user ที่ตรวจแล้ว ไม่ผ่าน → throw 401/403
 */
export async function requireAdmin(event: H3Event): Promise<User> {
  const header = getHeader(event, "authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    throw createError({ statusCode: 401, message: "กรุณาเข้าสู่ระบบ" });
  }

  const config = useRuntimeConfig();
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw createError({ statusCode: 401, message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }

  if (data.user.app_metadata?.role !== "admin") {
    throw createError({ statusCode: 403, message: "ไม่มีสิทธิ์ผู้ดูแลระบบ" });
  }

  return data.user;
}
