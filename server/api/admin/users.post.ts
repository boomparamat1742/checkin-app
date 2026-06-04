export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { username, password } = body as { username: string; password: string };

  if (!username || !password) {
    throw createError({ statusCode: 400, message: "username and password required" });
  }

  const email = `${username.trim().toLowerCase()}@checkin.local`;

  const res = await fetch(`${config.public.supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: config.supabaseServiceKey,
      Authorization: `Bearer ${config.supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw createError({ statusCode: 400, message: err.message ?? "Failed to create user" });
  }

  return { ok: true };
});
