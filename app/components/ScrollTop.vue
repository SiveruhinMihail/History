<template>
  <button
    v-if="showButton"
    @click="scrollToTop"
    class="fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/80 transition z-50"
    aria-label="Наверх"
  >
    <ArrowUpIcon class="w-5 h-5" />
  </button>
</template>

<script setup>
import { ArrowUpIcon } from "@heroicons/vue/24/outline";
import { ref, onMounted, onUnmounted } from "vue";

const showButton = ref(false);

function checkScroll() {
  showButton.value = window.scrollY > 300;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  window.addEventListener("scroll", checkScroll);
});
onUnmounted(() => {
  window.removeEventListener("scroll", checkScroll);
});
</script>
