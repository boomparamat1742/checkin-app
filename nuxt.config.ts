// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    // private
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,

    // public
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY,
    },
  },
});