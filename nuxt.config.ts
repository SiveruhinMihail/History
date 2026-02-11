export default defineNuxtConfig({
  compatibilityDate: "2026-02-08",
  devtools: { enabled: true },
  modules: [
    "@formkit/nuxt",
    "@nuxtjs/tailwindcss",
    "@nuxt/eslint",
    "@nuxtjs/supabase",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
  ],

  formkit: {
    autoImport: true,
    configFile: "./formkit.config.ts",
  },

  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    redirect: false,
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/"],
    },
    clientOptions: {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY,
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Форум",
    },
  },
});
