<template>
  <div class="relative">
    <!-- Заголовок категории + ссылка на все записи -->
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
        {{ category.name }}
      </h2>
      <NuxtLink
        v-if="category.slug !== 'recommended'"
        :to="`/categories/${category.slug}`"
        class="text-primary hover:text-accent dark:text-accent-400 transition"
      >
        Все записи
      </NuxtLink>
    </div>

    <!-- Контейнер с кнопками навигации -->
    <div class="relative group/row">
      <!-- Кнопка влево -->
      <button
        v-if="showLeftButton"
        @click="scrollLeft"
        class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 disabled:opacity-30 hover:scale-110 -ml-4 text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400"
        :disabled="atStart"
        title="Прокрутить влево"
      >
        <ChevronLeftIcon class="w-5 h-5" />
      </button>

      <!-- Горизонтальная лента -->
      <div
        ref="scrollContainer"
        class="flex overflow-x-auto pb-4 gap-4 hide-scrollbar scroll-smooth"
        @scroll="updateScrollButtons"
      >
        <PostCard
          v-for="post in visiblePosts"
          :key="post.id"
          :post="post"
          @like="$emit('like', $event)"
          @favorite="$emit('favorite', $event)"
        />
        <ShowMoreCard
          v-if="hasMore && category.slug !== 'recommended'"
          :category-slug="category.slug"
        />
      </div>

      <!-- Кнопка вправо -->
      <button
        v-if="showRightButton"
        @click="scrollRight"
        class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 disabled:opacity-30 hover:scale-110 -mr-4 text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400"
        :disabled="atEnd"
        title="Прокрутить вправо"
      >
        <ChevronRightIcon class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/24/outline";
import PostCard from "./PostCard.vue";
import ShowMoreCard from "./ShowMoreCard.vue";

const props = defineProps<{
  category: any;
  posts: any[];
}>();

const emit = defineEmits<{
  (e: "like" | "favorite", post: any): void;
}>();

const MAX_VISIBLE = 10;
const visiblePosts = computed(() => props.posts.slice(0, MAX_VISIBLE));
const hasMore = computed(() => props.posts.length > MAX_VISIBLE);

const scrollContainer = ref<HTMLElement | null>(null);
const showLeftButton = ref(false);
const showRightButton = ref(false);
const atStart = ref(true);
const atEnd = ref(false);

const updateScrollButtons = () => {
  if (!scrollContainer.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
  atStart.value = scrollLeft <= 5;
  atEnd.value = scrollLeft + clientWidth >= scrollWidth - 5;
  showLeftButton.value = scrollWidth > clientWidth;
  showRightButton.value = scrollWidth > clientWidth;
};

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -300, behavior: "smooth" });
  }
};

const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 300, behavior: "smooth" });
  }
};

onMounted(() => {
  updateScrollButtons();
  window.addEventListener("resize", updateScrollButtons);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScrollButtons);
});
</script>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
