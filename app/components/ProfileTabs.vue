<script setup>
defineProps(["activeTab"]);
defineEmits(["update:activeTab"]);

const tabs = [
  { value: "about", label: "О себе" },
  { value: "posts", label: "Посты" },
  { value: "favorites", label: "Избранное" },
  { value: "activity", label: "Активность" },
];
</script>
<template>
  <div class="border-b mb-4">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      @click="$emit('update:activeTab', tab.value)"
      :class="[
        'px-4 py-2',
        activeTab === tab.value ? 'border-b-2 border-blue-600' : '',
      ]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
