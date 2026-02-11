// pages/debug.vue
<template>
  <div>
    <h1>Debug Info</h1>
    <pre>{{ config }}</pre>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
</script>
