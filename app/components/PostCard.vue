<template>
  <div
    class="flex-shrink-0 w-[max(250px,30vw)] sm:w-[280px] h-[360px] bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden border border-primary/20 dark:border-gray-700"
  >
    <!-- Ссылка на пост -->
    <NuxtLink :to="`/post/${post.id}`" class="flex flex-col flex-1 group/card">
      <!-- Контейнер изображения -->
      <div
        class="relative w-full h-40 bg-primary/10 dark:bg-gray-700 overflow-hidden"
      >
        <img
          v-if="currentImage"
          :src="getOptimizedImageUrl(currentImage, 400, 300)"
          :alt="post.title"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="handleImageError"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-primary/40 dark:text-gray-500"
        >
          <PhotoIcon class="w-8 h-8" />
        </div>

        <!-- Перелистывание изображений -->
        <div
          v-if="post.post_images?.length > 1"
          class="absolute bottom-2 right-2 bg-black/60 dark:bg-black/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm"
          @click.prevent
        >
          <button
            @click.prevent="prevImage"
            class="hover:text-secondary focus:outline-none w-4 h-4 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="currentImageIndex === 0"
          >
            ←
          </button>
          <span>{{ currentImageIndex + 1 }}/{{ post.post_images.length }}</span>
          <button
            @click.prevent="nextImage"
            class="hover:text-secondary focus:outline-none w-4 h-4 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="currentImageIndex === post.post_images.length - 1"
          >
            →
          </button>
        </div>
      </div>

      <!-- Текстовая часть -->
      <div class="p-3 flex-1">
        <h3
          class="font-semibold text-base mb-1 line-clamp-2 text-gray-900 dark:text-white"
        >
          {{ post.title }}
        </h3>

        <!-- Категории -->
        <div v-if="post.categories?.length" class="flex flex-wrap gap-1 mb-2">
          <span
            v-for="item in post.categories"
            :key="item.category.id"
            class="text-xs bg-accent/20 dark:bg-accent/30 text-accent-dark dark:text-accent-400 px-2 py-0.5 rounded font-medium"
          >
            {{ item.category.name }}
          </span>
        </div>

        <p class="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
          {{ post.description }}
        </p>
      </div>
    </NuxtLink>

    <!-- Нижняя панель -->
    <div
      class="px-3 pb-3 flex flex-col gap-2 border-t pt-2 border-primary/10 dark:border-gray-700"
    >
      <!-- Для одобренных постов -->
      <template v-if="post.moderation_status === 'approved'">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-3">
            <button
              @click="$emit('like', post)"
              class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              :title="liked ? 'Убрать лайк' : 'Поставить лайк'"
            >
              <HeartIcon
                :class="[liked ? 'text-red-500 fill-red-500' : '']"
                class="w-4 h-4"
              />
              <span class="text-xs">{{ likesCount }}</span>
            </button>
            <NuxtLink
              :to="`/post/${post.id}#comments`"
              class="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-accent-400"
              title="Перейти к комментариям"
            >
              <ChatBubbleLeftIcon class="w-4 h-4" />
              <span class="text-xs">{{ commentsCount }}</span>
            </NuxtLink>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-400 dark:text-gray-500 text-xs">{{
              formatDate(post.created_at)
            }}</span>
            <button
              @click="$emit('favorite', post)"
              class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              :title="favorited ? 'Убрать из закладок' : 'Добавить в закладки'"
            >
              <BookmarkIcon
                :class="[
                  favorited
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-400 dark:text-gray-500',
                ]"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>
      </template>

      <!-- Для неодобренных постов -->
      <template v-else>
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span
              :class="[
                'px-2 py-0.5 rounded text-xs font-medium',
                post.moderation_status === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
              ]"
            >
              {{
                post.moderation_status === "pending"
                  ? "На проверке"
                  : "Отклонён"
              }}
            </span>
            <span class="text-gray-400 dark:text-gray-500 text-xs">{{
              formatDate(post.created_at)
            }}</span>
          </div>
        </div>
        <slot name="actions" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  HeartIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  PhotoIcon,
} from "@heroicons/vue/24/outline";
import { computed, ref } from "vue";
import { useReactionState } from "~/composables/useReactionState";
import { getOptimizedImageUrl } from "~/utils/image";

const props = defineProps<{
  post: any;
}>();

const emit = defineEmits<{
  (e: "like", post: any): void;
  (e: "favorite", post: any): void;
}>();

const { getLikeState, isFavorited } = useReactionState();

const likeState = computed(() => getLikeState(props.post.id));
const liked = computed(() => likeState.value.liked);
const likesCount = computed(() => likeState.value.count);
const favorited = computed(() => isFavorited(props.post.id));

const currentImageIndex = ref(0);
const currentImage = computed(() => {
  return props.post.post_images?.[currentImageIndex.value]?.url || null;
});

const commentsCount = computed(() => props.post.comments?.[0]?.count || 0);

function prevImage(event: MouseEvent) {
  event.preventDefault();
  if (props.post.post_images && currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
}

function nextImage(event: MouseEvent) {
  event.preventDefault();
  if (
    props.post.post_images &&
    currentImageIndex.value < props.post.post_images.length - 1
  ) {
    currentImageIndex.value++;
  }
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.src = "https://via.placeholder.com/300x200?text=No+Image";
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
</script>
