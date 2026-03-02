<template>
  <div class="border-b border-primary/10 mb-6">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      @click="$emit('update:activeTab', tab.value)"
      :class="[
        'px-4 py-2 text-sm font-medium transition-colors relative',
        activeTab === tab.value
          ? 'text-accent border-b-2 border-accent'
          : 'text-gray-600 hover:text-accent',
      ]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps(["activeTab"]);
defineEmits(["update:activeTab"]);

const tabs = [
  { value: "about", label: "О себе" },
  { value: "posts", label: "Посты" },
  { value: "favorites", label: "Избранное" },
  { value: "communities", label: "Сообщества" },
  { value: "activity", label: "Активность" },
];
</script>
