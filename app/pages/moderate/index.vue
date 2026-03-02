<!-- pages/moderate/index.vue -->
<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
      Панель модерации
    </h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Модерация постов -->
      <NuxtLink
        to="/moderate/posts"
        class="block p-6 bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition group"
        title="Посты, ожидающие проверки"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="p-3 bg-accent/10 dark:bg-accent/20 rounded-full">
            <DocumentTextIcon
              class="w-6 h-6 text-accent dark:text-accent-400"
            />
          </div>
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent transition"
          >
            Модерация постов
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          Посты, ожидающие проверки
        </p>
        <div class="flex justify-between items-center text-sm">
          <span class="text-accent dark:text-accent-400 font-medium">
            Ожидают: {{ pendingPostsCount }}
          </span>
          <ArrowRightIcon
            class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-accent transition"
          />
        </div>
      </NuxtLink>

      <!-- Жалобы -->
      <NuxtLink
        to="/moderate/reports"
        class="block p-6 bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition group"
        title="Необработанные жалобы на контент"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="p-3 bg-accent/10 dark:bg-accent/20 rounded-full">
            <FlagIcon class="w-6 h-6 text-accent dark:text-accent-400" />
          </div>
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent transition"
          >
            Жалобы
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          Необработанные жалобы на контент
        </p>
        <div class="flex justify-between items-center text-sm">
          <span class="text-accent dark:text-accent-400 font-medium">
            Ожидают: {{ pendingReportsCount }}
          </span>
          <ArrowRightIcon
            class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-accent transition"
          />
        </div>
      </NuxtLink>

      <!-- Верификация сообществ -->
      <NuxtLink
        to="/moderate/community-requests"
        class="block p-6 bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition group"
        title="Заявки на получение галочки"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="p-3 bg-accent/10 dark:bg-accent/20 rounded-full">
            <CheckBadgeIcon class="w-6 h-6 text-accent dark:text-accent-400" />
          </div>
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent transition"
          >
            Верификация сообществ
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          Заявки на получение галочки
        </p>
        <div class="flex justify-between items-center text-sm">
          <span class="text-accent dark:text-accent-400 font-medium"
            >Ожидают: {{ pendingVerificationCount }}</span
          >
          <ArrowRightIcon
            class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-accent transition"
          />
        </div>
      </NuxtLink>

      <!-- Смена названия сообществ -->
      <NuxtLink
        to="/moderate/community-name-requests"
        class="block p-6 bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition group"
        title="Запросы на изменение названия верифицированных сообществ"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="p-3 bg-accent/10 dark:bg-accent/20 rounded-full">
            <PencilIcon class="w-6 h-6 text-accent dark:text-accent-400" />
          </div>
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent transition"
          >
            Смена названия
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          Запросы на изменение названия верифицированных сообществ
        </p>
        <div class="flex justify-between items-center text-sm">
          <span class="text-accent dark:text-accent-400 font-medium"
            >Ожидают: {{ pendingNameChangeCount }}</span
          >
          <ArrowRightIcon
            class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-accent transition"
          />
        </div>
      </NuxtLink>

      <!-- Назначить модератора (только для админа) -->
      <NuxtLink
        v-if="isAdmin"
        to="/moderate/create-moderator"
        class="block p-6 bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition group"
        title="Повысить пользователя до модератора"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="p-3 bg-accent/10 dark:bg-accent/20 rounded-full">
            <UserPlusIcon class="w-6 h-6 text-accent dark:text-accent-400" />
          </div>
          <h2
            class="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-accent transition"
          >
            Назначить модератора
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
          Повысить пользователя до модератора
        </p>
        <div class="flex justify-end">
          <ArrowRightIcon
            class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-accent transition"
          />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  DocumentTextIcon,
  FlagIcon,
  CheckBadgeIcon,
  PencilIcon,
  UserPlusIcon,
  ArrowRightIcon,
} from "@heroicons/vue/24/outline";
import { useAuth } from "~/composables/useAuth";

const supabase = useSupabaseClient();
const { isModerator, isAdmin } = useAuth();

const pendingPostsCount = ref(0);
const pendingReportsCount = ref(0);
const pendingVerificationCount = ref(0);
const pendingNameChangeCount = ref(0);

onMounted(async () => {
  if (!isModerator.value && !isAdmin.value) return navigateTo("/");

  const [postsRes, reportsRes, verificationRes, nameChangeRes] =
    await Promise.all([
      supabase
        .from("post")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "pending"),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("community_verification_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      (supabase as any)
        .from("community_name_change_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  pendingPostsCount.value = postsRes.count || 0;
  pendingReportsCount.value = reportsRes.count || 0;
  pendingVerificationCount.value = verificationRes.count || 0;
  pendingNameChangeCount.value = nameChangeRes.count || 0;
});

definePageMeta({
  ssr: false, // отключаем SSR, так как это защищённая зона и не требует SEO
})
</script>
