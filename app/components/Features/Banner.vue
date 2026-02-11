<script setup lang="ts">
import type { Props_List } from "~/types/generics/props";

interface banner {
  img: string;
  link: string;
  description: string;
  shadow: string;
}

const data = defineProps<Props_List<banner[]>>();
console.log(data);
</script>
<template>
  <div class="banner place-self-center">
    <img src="/public/banner.png" class="rounded-lg" style="width: 60vw" />
  </div>
</template>
<style scoped>
.banner {
  filter: drop-shadow(0vw 1.5vw 1.4vw rgba(5, 118, 82, 0.475));
}
</style>
