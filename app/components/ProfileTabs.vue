<template>
  <div class="border-b">
    <nav class="flex gap-6">
      <button
        @click="$emit('update:activeTab', 'about')"
        :class="[
          'py-2 border-b-2 font-medium',
          activeTab === 'about'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
      >
        О себе
      </button>
      <button
        @click="$emit('update:activeTab', 'favorites')"
        :class="[
          'py-2 border-b-2 font-medium',
          activeTab === 'favorites'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
      >
        Избранное
      </button>
      <button
        @click="$emit('update:activeTab', 'activity')"
        :class="[
          'py-2 border-b-2 font-medium',
          activeTab === 'activity'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700',
        ]"
      >
        Активность
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: string;
}>();
defineEmits<{
  (e: "update:activeTab", tab: string): void;
}>();
</script>
