<template>
  <ClientOnly>
    <button
      @click="toggleTheme"
      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      :title="colorMode.value === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
    >
      <SunIcon
        v-if="colorMode.value === 'dark'"
        class="w-5 h-5 text-yellow-500"
      />
      <MoonIcon v-else class="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
    <template #fallback>
      <!-- Пустой блок того же размера для предотвращения смещения вёрстки -->
      <div class="w-9 h-9"></div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";

const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>
