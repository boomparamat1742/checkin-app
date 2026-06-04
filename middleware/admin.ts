export default defineNuxtRouteMiddleware(async () => {
  const { $supabase } = useNuxtApp();

  const { data } = await $supabase.auth.getSession();

  if (!data.session) {
    return navigateTo("/admin/login");
  }
});
