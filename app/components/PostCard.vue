<template>
  <div
    class="flex-shrink-0 w-[max(250px,30vw)] sm:w-[280px] h-[360px] bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden border border-gray-100"
  >
    <!-- Ссылка с именованной группой для карточки -->
    <NuxtLink :to="`/post/${post.id}`" class="flex flex-col flex-1 group/card">
      <!-- Контейнер изображения фиксированной высоты -->
      <div class="relative w-full h-40 bg-gray-100 overflow-hidden">
        <img
          v-if="currentImage"
          :src="currentImage"
          :alt="post.title"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="handleImageError"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-gray-400"
        >
          <PhotoIcon class="w-8 h-8" />
        </div>

        <!-- Индикатор количества изображений и перелистывание -->
        <div
          v-if="post.post_images?.length > 1"
          class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm"
          @click.prevent
        >
          <button
            @click.prevent="prevImage"
            class="hover:text-blue-300 focus:outline-none w-4 h-4 flex items-center justify-center"
            :disabled="currentImageIndex === 0"
          >
            ←
          </button>
          <span>{{ currentImageIndex + 1 }}/{{ post.post_images.length }}</span>
          <button
            @click.prevent="nextImage"
            class="hover:text-blue-300 focus:outline-none w-4 h-4 flex items-center justify-center"
            :disabled="currentImageIndex === post.post_images.length - 1"
          >
            →
          </button>
        </div>
      </div>

      <!-- Текстовая часть (занимает оставшееся пространство) -->
      <div class="p-3 flex-1">
        <h3
          class="font-semibold text-base mb-1 line-clamp-2 group-hover/card:text-blue-600"
        >
          {{ post.title }}
        </h3>
        <p class="text-gray-500 text-sm line-clamp-2">{{ post.description }}</p>
      </div>
    </NuxtLink>

    <!-- Нижняя панель (действия) -->
    <div
      class="px-3 pb-3 flex items-center justify-between text-sm border-t pt-2"
    >
      <div class="flex items-center gap-3">
        <!-- Лайки -->
        <button
          @click="$emit('like')"
          class="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
        >
          <HeartIcon
            :class="[
              post.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400',
            ]"
            class="w-4 h-4"
          />
          <span class="text-xs">{{ likesCount }}</span>
        </button>

        <!-- Комментарии -->
        <div class="flex items-center gap-1 text-gray-400">
          <ChatBubbleLeftIcon class="w-4 h-4" />
          <span class="text-xs">{{ commentsCount }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Дата -->
        <span class="text-gray-400 text-xs">{{
          formatDate(post.created_at)
        }}</span>

        <!-- Закладка -->
        <button
          @click="$emit('favorite')"
          class="p-1 rounded-full hover:bg-gray-100 transition"
          :title="
            post.isFavorited ? 'Убрать из закладок' : 'Добавить в закладки'
          "
        >
          <BookmarkIcon
            :class="[
              post.isFavorited
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-400',
            ]"
            class="w-4 h-4"
          />
        </button>
      </div>
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

const props = defineProps<{
  post: any;
}>();

const emit = defineEmits<{
  (e: "like"): void;
  (e: "favorite"): void;
}>();

const currentImageIndex = ref(0);
const currentImage = computed(() => {
  return props.post.post_images?.[currentImageIndex.value]?.url || null;
});

const likesCount = computed(() => props.post.likes?.[0]?.count || 0);
const commentsCount = computed(
  () => props.post.comments_count?.[0]?.count || 0,
);

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
