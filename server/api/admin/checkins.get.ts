import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  );

  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .order("checkin_at", { ascending: false });

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  return data ?? [];
});
