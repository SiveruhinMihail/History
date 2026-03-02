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
  nitro: {
    prerender: {
      routes: ["/", "/categories", "/communities"],
    },
    preset: 'github_pages',
  },
  routeRules: {
    '/**': { prerender: true }
  },

  app: {
    baseURL: '/Klio/',
    buildAssetsDir: '/nuxt_assets/',
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css",
        },
        {
          rel: "preload",
          href: "/fonts/FiraMono-Regular.ttf",
          as: "font",
          type: "font/ttf",
          crossorigin: "",
        },
        { rel: "preconnect", href: "https://phlyzwfqtpddvgrprngo.supabase.co" },
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

  typescript: {
    tsConfig: {
      compilerOptions: {
        noImplicitAny: false,
      },
    },
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
