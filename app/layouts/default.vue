<script setup lang="ts">
const { profile, isLoading } = useAuth();
</script>
<template>
  <div class="min-h-screen flex flex-col">
    <Header :profile="profile" :is-loading="isLoading" />

    <main class="flex" style="margin-top: 4rem">
      <slot />
    </main>
  </div>
</template>
