<script setup lang="ts">
const props = defineProps<{
  images: string[];
  initialIndex?: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const isOpen = ref(true);
const currentIndex = ref(props.initialIndex || 0);

const currentImage = computed(() => props.images[currentIndex.value] || "");

function next() {
  if (props.images.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % props.images.length;
  }
}

function prev() {
  if (props.images.length > 0) {
    currentIndex.value =
      (currentIndex.value - 1 + props.images.length) % props.images.length;
  }
}

function close() {
  isOpen.value = false;
  emit("close");
}

// Закрытие по Escape
onMounted(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };
  window.addEventListener("keydown", handleKey);
  onUnmounted(() => window.removeEventListener("keydown", handleKey));
});
</script>
<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      @click.self="close"
    >
      <button
        @click="close"
        class="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
      >
        &times;
      </button>

      <!-- Навигация -->
      <button
        v-if="images.length > 1"
        @click="prev"
        class="absolute left-4 text-white text-4xl hover:text-gray-300 z-10"
      >
        ‹
      </button>
      <button
        v-if="images.length > 1"
        @click="next"
        class="absolute right-4 text-white text-4xl hover:text-gray-300 z-10"
      >
        ›
      </button>

      <!-- Текущее изображение -->
      <div class="max-w-5xl max-h-full p-4">
        <img
          :src="currentImage"
          class="max-w-full max-h-screen object-contain"
          alt="Full size"
        />
      </div>

      <!-- Счётчик -->
      <div
        v-if="images.length > 1"
        class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded"
      >
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>
  </Teleport>
</template>
