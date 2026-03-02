<template>
  <footer
    class="bg-gray-50 dark:bg-gray-800 border-t border-primary/20 dark:border-gray-700 py-8 mt-12"
  >
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <!-- Логотип и название -->
        <div class="flex items-center gap-2">
          <NuxtLink to="/" class="flex items-center gap-2">
            <img
              src="https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/logo.svg"
              class="w-8 h-8 rounded-full"
              alt="Klio"
              loading="lazy"
            />
            <span class="text-lg font-medium text-gray-800 dark:text-white"
              >Klio</span
            >
          </NuxtLink>
        </div>

        <!-- Навигация -->
        <nav class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <NuxtLink
            to="/"
            class="text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400 transition-colors"
            >Главная</NuxtLink
          >
          <NuxtLink
            to="/categories"
            class="text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400 transition-colors"
            >Категории</NuxtLink
          >
          <NuxtLink
            to="/communities"
            class="text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400 transition-colors"
            >Сообщества</NuxtLink
          >
          <NuxtLink
            to="/create"
            class="text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400 transition-colors"
            >Создать пост</NuxtLink
          >
        </nav>

        <!-- Копирайт -->
        <div class="text-sm text-gray-500 dark:text-gray-500">
          © {{ new Date().getFullYear() }} Klio
        </div>
      </div>
    </div>
  </footer>
</template>
