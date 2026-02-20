<template>
  <NuxtLink
    :to="`/categories/${categorySlug}`"
    class="flex-shrink-0 w-[max(250px,30vw)] sm:w-[280px] bg-gray-50 rounded-xl shadow-sm flex items-center justify-center hover:bg-gray-100 transition border border-gray-200"
  >
    <div class="text-center p-4">
      <div class="text-4xl mb-2">→</div>
      <div class="font-medium text-gray-700">Показать ещё</div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ categorySlug: string }>();
</script>
