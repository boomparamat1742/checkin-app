export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  const res = await fetch(
    `${config.public.supabaseUrl}/auth/v1/admin/users?per_page=100`,
    {
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${config.supabaseServiceKey}`,
      },
    },
  );

  if (!res.ok) {
    throw createError({ statusCode: 500, message: "Failed to fetch users" });
  }

  const data = await res.json();
  return (data.users ?? []).map((u: any) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
  }));
});
