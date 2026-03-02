<template>
  <div
    class="border border-primary/10 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
  >
    <!-- Шапка комментария -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <NuxtLink
          :to="`/profile/${comment.user?.auth_uid}`"
          class="flex items-center gap-2 group"
        >
          <img
            :src="getAvatarUrl(comment.user?.avatar, 48)"
            class="w-6 h-6 rounded-full object-cover"
            alt=""
            loading="lazy"
          />
          <span
            class="font-medium group-hover:text-accent dark:group-hover:text-accent-400 text-gray-900 dark:text-white"
          >
            {{ comment.user?.use || "Пользователь" }}
          </span>
        </NuxtLink>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{
          formatDate(comment.created_at)
        }}</span>
      </div>

      <!-- Кнопки действий -->
      <div v-if="interactive" class="flex items-center gap-2">
        <button
          @click="$emit('like', comment)"
          :disabled="!isAuthenticated"
          class="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
          :title="comment.liked ? 'Убрать лайк' : 'Поставить лайк'"
        >
          <HeartIcon
            :class="[comment.liked ? 'text-red-500 fill-red-500' : '']"
            class="w-4 h-4"
          />
          <span class="text-xs">{{ comment.likes_count }}</span>
        </button>
        <button
          @click="$emit('reply', comment)"
          class="text-gray-500 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400 text-sm transition"
          title="Ответить"
        >
          Ответить
        </button>
        <button
          @click="$emit('report', comment)"
          :disabled="!isAuthenticated || comment.reported"
          class="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent-400 disabled:opacity-50 transition"
          :title="comment.reported ? 'Вы уже отправили жалобу' : 'Пожаловаться'"
        >
          <FlagIcon
            :class="[comment.reported ? 'text-primary fill-primary' : '']"
            class="w-4 h-4"
          />
        </button>
      </div>
    </div>

    <!-- Текст комментария -->
    <p class="text-gray-800 dark:text-gray-200">{{ comment.text }}</p>

    <!-- Топ верифицированные сообщества пользователя -->
    <div v-if="topCommunities.length" class="flex flex-wrap gap-1 mt-1">
      <NuxtLink
        v-for="c in topCommunities"
        :key="c.id"
        :to="`/communities/${c.id}`"
        class="flex items-center gap-1 text-xs bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent-400 px-2 py-0.5 rounded-full hover:bg-accent/20 dark:hover:bg-accent/30 transition"
      >
        <span>{{ c.name }}</span>
        <CheckBadgeIcon class="w-3 h-3" />
      </NuxtLink>
    </div>

    <!-- Изображения -->
    <div v-if="comment.images?.length" class="flex flex-wrap gap-2 mt-2">
      <img
        v-for="(img, idx) in comment.images"
        :key="idx"
        :src="img.url"
        class="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition"
        loading="lazy"
        @click="
          $emit(
            'open-image',
            comment.images.map((i) => i.url),
            idx as number,
          )
        "
      />
    </div>

    <!-- Дочерние комментарии -->
    <div v-if="comment.children?.length" class="ml-6 mt-4 space-y-4">
      <CommentItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :is-authenticated="isAuthenticated"
        :interactive="interactive"
        @like="(c) => $emit('like', c)"
        @reply="(c) => $emit('reply', c)"
        @report="(c) => $emit('report', c)"
        @open-image="(images, index) => $emit('open-image', images, index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { HeartIcon, FlagIcon, CheckBadgeIcon } from "@heroicons/vue/24/outline";
import { computed } from "vue";
import { getAvatarUrl } from "~/utils/image";

const props = defineProps<{
  comment: any;
  isAuthenticated: boolean;
  interactive?: boolean;
}>();
defineEmits<{
  (e: "like" | "reply" | "report", comment: any): void;
  (e: "open-image", images: string[], index: number): void;
}>();

const defaultAvatar =
  "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";

const topCommunities = computed(() => {
  if (!props.comment.user?.communities) return [];
  return props.comment.user.communities
    .filter((item: any) => item.role === "member" || item.role === "admin")
    .map((item: any) => item.community)
    .filter((c: any) => c.patent)
    .sort((a: any, b: any) => b.rating - a.rating)
    .slice(0, 3);
});

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
