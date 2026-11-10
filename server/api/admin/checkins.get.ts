import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { from, to } = getQuery(event) as { from?: string; to?: string };

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  );

  let query = supabase
    .from("checkins")
    .select("*")
    .order("checkin_at", { ascending: false });

  // WHERE checkin_at >= from AND checkin_at < to  (ไม่ส่งมา = ไม่กรอง)
  if (from && !Number.isNaN(Date.parse(from))) {
    query = query.gte("checkin_at", new Date(from).toISOString());
  }
  if (to && !Number.isNaN(Date.parse(to))) {
    query = query.lt("checkin_at", new Date(to).toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  return data ?? [];
});
