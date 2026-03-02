<template>
  <div class="container mx-auto px-4 py-6 max-w-6xl">
    <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
      Заявки на верификацию сообществ
    </h1>

    <!-- Глобальный поиск по всем сообществам (для проверки уникальности) -->
    <div class="mb-6 max-w-md">
      <div class="relative">
        <input
          v-model="globalSearchQuery"
          type="text"
          placeholder="Поиск по всем сообществам..."
          class="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
          @input="debouncedGlobalSearch"
        />
        <MagnifyingGlassIcon
          class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 dark:text-gray-500"
        />
      </div>
      <!-- Результаты глобального поиска -->
      <div
        v-if="globalSearchResults.length"
        class="mt-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg p-2 max-h-60 overflow-y-auto shadow-lg"
      >
        <NuxtLink
          v-for="c in globalSearchResults"
          :key="c.id"
          :to="`/communities/${c.id}`"
          class="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
        >
          <img
            :src="c.avatar || defaultAvatar"
            class="w-6 h-6 rounded-full object-cover"
            alt=""
            @error="handleImageError"
            loading="lazy"
          />
          <span>{{ c.name }}</span>
          <CheckBadgeIcon v-if="c.patent" class="w-4 h-4 text-accent ml-auto" />
        </NuxtLink>
      </div>
    </div>

    <!-- Локальный поиск по текущим заявкам -->
    <div class="mb-4 max-w-md">
      <div class="relative">
        <input
          v-model="localSearchQuery"
          type="text"
          placeholder="Фильтр по названию сообщества в заявках..."
          class="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
        />
        <MagnifyingGlassIcon
          class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 dark:text-gray-500"
        />
      </div>
    </div>

    <!-- Список заявок -->
    <div
      v-if="loading"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Загрузка...
    </div>
    <div
      v-else-if="filteredRequests.length === 0"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Нет подходящих заявок.
    </div>
    <div v-else class="space-y-6">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg p-6 shadow-sm"
      >
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Карточка сообщества -->
          <div class="lg:w-80 flex-shrink-0">
            <CommunityCard :community="req.community" />
          </div>

          <!-- Детали заявки и действия -->
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Запрошено: {{ formatDate(req.created_at) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Текущий рейтинг: {{ req.community.rating }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Владелец:
                <NuxtLink
                  :to="`/profile/${req.community.owner?.auth_uid}`"
                  class="text-accent hover:underline dark:text-accent-400"
                >
                  {{
                    req.community.owner?.use || req.community.owner?.username
                  }}
                </NuxtLink>
              </p>
            </div>
            <div class="flex gap-3 mt-4">
              <button
                @click="approve(req.id)"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition flex items-center gap-2"
                title="Одобрить заявку и выдать галочку"
              >
                <CheckIcon class="w-5 h-5" />
                Одобрить
              </button>
              <button
                @click="reject(req.id)"
                class="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 rounded-lg transition flex items-center gap-2"
                title="Отклонить заявку"
              >
                <XMarkIcon class="w-5 h-5" />
                Отклонить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  CheckBadgeIcon,
} from "@heroicons/vue/24/outline";
import CommunityCard from "~/components/CommunityCard.vue";
import { useCommunity } from "~/composables/useCommunity";

definePageMeta({
  ssr: false, // отключаем SSR, так как это защищённая зона и не требует SEO
})

const { getVerificationRequests, approveVerification, rejectVerification } =
  useCommunity();
const supabase = useSupabaseClient();
const defaultAvatar =
  "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).src = defaultAvatar;
};

// Заявки
const requests = ref<any[]>([]);
const loading = ref(true);

// Локальный поиск по заявкам
const localSearchQuery = ref("");
const filteredRequests = computed(() => {
  const q = localSearchQuery.value.toLowerCase();
  if (!q) return requests.value;
  return requests.value.filter((req) =>
    req.community.name?.toLowerCase().includes(q),
  );
});

// Глобальный поиск по всем сообществам
const globalSearchQuery = ref("");
const globalSearchResults = ref<any[]>([]);

const performGlobalSearch = async (query: string) => {
  if (!query) {
    globalSearchResults.value = [];
    return;
  }
  const { data, error } = await supabase
    .from("community")
    .select("id, name, avatar, patent")
    .ilike("name", `%${query}%`)
    .limit(10);
  if (error) {
    console.error("Global search error:", error);
    return;
  }
  globalSearchResults.value = data || [];
};

const debouncedGlobalSearch = debounce(() => {
  performGlobalSearch(globalSearchQuery.value);
}, 300);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function loadRequests() {
  try {
    const data = await getVerificationRequests();
    requests.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function approve(id: number) {
  await approveVerification(id);
  await loadRequests();
}

async function reject(id: number) {
  await rejectVerification(id);
  await loadRequests();
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

onMounted(loadRequests);
</script>
