<script setup lang="ts">
import { computed } from "vue";
import { HeartIcon, FlagIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  comment: any;
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  (e: "like" | "reply" | "report", comment: any): void;
  (e: "open-image", images: string[], index: number): void;
}>();

const imageUrls = computed(
  () => props.comment.images?.map((img: any) => img.url) || [],
);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
<template>
  <div class="border rounded-lg p-4">
    <!-- Шапка -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="font-medium">{{
          comment.user?.use || "Пользователь"
        }}</span>
        <span class="text-xs text-gray-400">{{
          formatDate(comment.created_at)
        }}</span>
      </div>
      <div class="flex items-center gap-2">
        <!-- Лайк -->
        <button
          @click="$emit('like', comment)"
          :disabled="!isAuthenticated"
          class="flex items-center gap-1 text-sm hover:text-blue-600"
        >
          <HeartIcon
            :class="[
              comment.liked ? 'text-red-500 fill-red-500' : 'text-gray-400',
            ]"
            class="w-4 h-4"
          />
          <span>{{ comment.likes_count }}</span>
        </button>
        <!-- Ответить -->
        <button
          @click="$emit('reply', comment)"
          class="text-sm text-gray-500 hover:text-blue-600"
        >
          Ответить
        </button>
        <!-- Жалоба -->
        <button
          @click="$emit('report', comment)"
          :disabled="!isAuthenticated || comment.reported"
          class="text-sm text-gray-500 hover:text-yellow-600 disabled:opacity-50"
          :title="comment.reported ? 'Вы уже отправили жалобу' : 'Пожаловаться'"
        >
          <FlagIcon
            :class="[
              comment.reported ? 'text-red-500 fill-red-500' : 'text-gray-400',
            ]"
            class="w-4 h-4"
          />
        </button>
      </div>
    </div>
    <!-- Текст -->
    <p class="text-gray-800">{{ comment.text }}</p>
    <div
      v-if="comment.user?.communities?.length"
      class="flex flex-wrap gap-1 mt-1"
    >
      <span
        v-for="item in comment.user.communities"
        :key="item.community.id"
        class="text-xs bg-gray-100 px-1.5 py-0.5 rounded"
        :title="item.community.name"
      >
        {{ item.community.name }} {{ item.community.patent ? "✓" : "" }}
      </span>
    </div>
    <div
      v-if="comment.images && comment.images.length"
      class="flex flex-wrap gap-2 mt-2"
    >
      <img
        v-for="(img, idx) in comment.images"
        :key="idx"
        :src="img.url"
        class="h-20 w-20 object-cover rounded cursor-pointer hover:opacity-80 transition"
        @click="$emit('open-image', imageUrls, idx as number)"
      />
    </div>

    <!-- Дочерние комментарии -->
    <div
      v-if="comment.children && comment.children.length"
      class="ml-6 mt-4 space-y-4"
    >
      <CommentItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :is-authenticated="isAuthenticated"
        @like="(c) => $emit('like', c)"
        @reply="(c) => $emit('reply', c)"
        @report="(c) => $emit('report', c)"
        @open-image="(images, index) => $emit('open-image', images, index)"
      />
    </div>
  </div>
</template>
