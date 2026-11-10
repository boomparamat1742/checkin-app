export default defineNuxtRouteMiddleware(async () => {
  // supabase plugin เป็น client-only (.client.ts) — ข้ามตอน SSR
  if (import.meta.server) return;

  const { $supabase } = useNuxtApp();
  const { data } = await $supabase.auth.getSession();

  if (!data.session) {
    return navigateTo("/admin/login");
  }

  // ต้องเป็น admin (app_metadata ตั้งได้จาก server เท่านั้น)
  if (data.session.user.app_metadata?.role !== "admin") {
    await $supabase.auth.signOut();
    return navigateTo("/admin/login");
  }
});
