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

  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css",
        },
      ],
      script: [
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js",
          defer: true,
        },
      ],
    },
  },

  formkit: {
    autoImport: true,
    configFile: "./formkit.config.ts",
  },

  supabase: {
    types: "~/types/supabase.ts",
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    redirect: false,
    redirectOptions: {
      login: "/auth/login",
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
  serverDir: "app/server",

  runtimeConfig: {
    serviceKey: process.env.NUXT_SERVICE_KEY,
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY,
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Форум",
    },
  },
});
