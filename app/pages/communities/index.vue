<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Заголовок и кнопка создания -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Сообщества
      </h1>
      <NuxtLink
        to="/communities/create"
        class="px-5 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition shadow-sm"
      >
        Создать сообщество
      </NuxtLink>
    </div>

    <!-- Поиск -->
    <div class="mb-6 max-w-md">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск сообществ..."
          class="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
        />
        <MagnifyingGlassIcon
          class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 dark:text-gray-500"
        />
      </div>
    </div>

    <!-- Вкладки -->
    <div class="border-b border-primary/10 dark:border-gray-700 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors relative',
          activeTab === tab.value
            ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Скелетон загрузки -->
    <div
      v-if="loading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
      ></div>
    </div>

    <!-- Контент -->
    <div v-else>
      <!-- Вкладка "Популярные" -->
      <div v-if="activeTab === 'popular'">
        <div
          v-if="filteredPopular.length === 0"
          class="text-center py-10 text-gray-500 dark:text-gray-400"
        >
          Популярные сообщества не найдены
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <CommunityCard
            v-for="community in filteredPopular"
            :key="community.id"
            :community="community"
          />
        </div>
      </div>

      <!-- Вкладка "Все сообщества" -->
      <div v-if="activeTab === 'all'">
        <div
          v-if="filteredAll.length === 0"
          class="text-center py-10 text-gray-500 dark:text-gray-400"
        >
          Сообщества не найдены
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <CommunityCard
            v-for="community in filteredAll"
            :key="community.id"
            :community="community"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import type { Database } from "~/types/supabase";

const supabase = useSupabaseClient<Database>();

const communities = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const activeTab = ref<"popular" | "all">("popular");

const tabs = [
  { label: "Популярные", value: "popular" as const },
  { label: "Все сообщества", value: "all" as const },
];

const TOP_COUNT = 5;

const topCommunities = computed(() => communities.value.slice(0, TOP_COUNT));

const filterByQuery = (items: any[]) => {
  const query = searchQuery.value.toLowerCase();
  if (!query) return items;
  return items.filter(
    (c) =>
      c.name?.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query),
  );
};

const filteredPopular = computed(() => filterByQuery(topCommunities.value));
const filteredAll = computed(() => filterByQuery(communities.value));

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from("community")
      .select("*")
      .order("rating", { ascending: false });
    if (error) throw error;
    communities.value = data || [];
  } catch (e) {
    console.error("Ошибка загрузки сообществ:", e);
  } finally {
    loading.value = false;
  }
});
</script>
  