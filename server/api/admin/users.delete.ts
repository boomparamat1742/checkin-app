export default defineEventHandler(async (event) => {
  const requester = await requireAdmin(event);
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const { id } = body as { id: string };

  if (!id) {
    throw createError({ statusCode: 400, message: "id required" });
  }

  // ใช้ id ที่ server ตรวจจาก token เอง ไม่เชื่อค่าจาก client
  if (id === requester.id) {
    throw createError({ statusCode: 403, message: "ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่" });
  }

  const res = await fetch(
    `${config.public.supabaseUrl}/auth/v1/admin/users/${id}`,
    {
      method: "DELETE",
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
      },
    },
  );

  if (!res.ok) {
    throw createError({ statusCode: 500, message: "Failed to delete user" });
  }

  return { ok: true };
});
