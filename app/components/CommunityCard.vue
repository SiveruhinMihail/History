<template>
  <NuxtLink
    :to="`/communities/${community.id}`"
    class="block p-4 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
  >
    <div class="flex items-center gap-3">
      <img
        :src="getAvatarUrl(community.avatar, 48)"
        class="w-12 h-12 rounded-full object-cover"
        alt=""
        @error="handleImageError"
        loading="lazy"
      />
      <div class="flex-1 min-w-0">
        <h3
          class="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1"
        >
          {{ community.name }}
          <CheckBadgeIcon
            v-if="community.patent"
            class="w-5 h-5 text-accent dark:text-accent-400 shrink-0"
            title="Проверенное сообщество"
          />
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
          {{ community.description || "Нет описания" }}
        </p>
      </div>
    </div>
    <div class="mt-3 flex items-center justify-between text-sm">
      <div class="flex items-center gap-1 text-primary dark:text-accent-400">
        <StarIcon class="w-4 h-4 fill-yellow-500 text-yellow-500" />
        <span>{{ community.rating }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
import { ref } from "vue";
import { StarIcon, CheckBadgeIcon } from "@heroicons/vue/24/outline";

defineProps({ community: Object });

const defaultAvatar =
  "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";

const handleImageError = (e) => {
  e.target.src = defaultAvatar;
};
</script>
