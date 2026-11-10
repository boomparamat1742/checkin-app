export default defineNuxtRouteMiddleware(async () => {
  // supabase plugin เป็น client-only (.client.ts) — ข้ามตอน SSR
  if (import.meta.server) return;

  const { $supabase } = useNuxtApp();
  const { data } = await $supabase.auth.getSession();

  if (!data.session) {
    return navigateTo("/admin/login");
  }
});
