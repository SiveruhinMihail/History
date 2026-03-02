<script setup lang="ts">
const supabase = useSupabaseClient();
const { getHomeFeed, getRecommendedPosts } = usePosts();
const { isAuthenticated, userId } = useAuth();
import { MagnifyingGlassIcon } from "@heroicons/vue/24/outline";
import { onClickOutside } from "@vueuse/core";
import { useReactionState } from "~/composables/useReactionState";

const { initPostReactions, toggleLike, toggleFavorite } = useReactionState();

// Все категории с постами (загружаются один раз)
const allCategories = ref<any[]>([]);
const recommendedPosts = ref<any[]>([]);
const loading = ref(true);

const searchPosts = ref<any[]>([]);
const searchTotal = ref(0);
const searchPage = ref(0);
const searchHasMore = ref(false);
const searchPerPage = 12;
const searchLoading = ref(false);
const searchContainer = ref<HTMLElement | null>(null);
const showSearchResults = ref(false);

onClickOutside(searchContainer, () => {
  showSearchResults.value = false;
});

// Пагинация
const visibleCount = ref(7); // сколько категорий показываем
const pageSize = 7;

// Вычисляем видимые категории
const visibleCategories = computed(() =>
  allCategories.value.slice(0, visibleCount.value),
);
const hasMore = computed(() => visibleCount.value < allCategories.value.length);

// Загрузка всех данных
async function loadFeed() {
  loading.value = true;
  try {
    const [recommended, categoriesFeed] = await Promise.all([
      getRecommendedPosts(10),
      getHomeFeed(),
    ]);

    // Инициализируем глобальное состояние для всех загруженных постов
    const allPosts = [...(recommended || [])];
    categoriesFeed.forEach((cat) => {
      allPosts.push(...(cat.posts || []));
    });

    if (allPosts.length && isAuthenticated.value && userId.value) {
      const postIds = allPosts.map((p) => p.id);
      const [likesResult, favoritesResult] = await Promise.all([
        supabase
          .from("like_to_post")
          .select("post_id")
          .eq("user_id", userId.value)
          .in("post_id", postIds),
        supabase
          .from("favorites")
          .select("post_id")
          .eq("user_id", userId.value)
          .in("post_id", postIds),
      ]);

      const likedSet = new Set(likesResult.data?.map((l) => l.post_id) || []);
      const favoritedSet = new Set(
        favoritesResult.data?.map((f) => f.post_id) || [],
      );

      allPosts.forEach((post) => {
        initPostReactions(
          post.id,
          likedSet.has(post.id),
          post.likes?.[0]?.count || 0,
          favoritedSet.has(post.id),
        );
      });
    }

    recommendedPosts.value = recommended || [];
    allCategories.value = categoriesFeed;
  } catch (e) {
    console.error("Ошибка загрузки ленты:", e);
  } finally {
    loading.value = false;
  }
}

// Обогащение постов данными (без изменений)
async function enrichPostsWithUserData(posts: any[]) {
  if (!isAuthenticated.value || !userId.value || !posts.length) return posts;

  const postIds = posts.map((p) => p.id);

  const [likesResult, favoritesResult] = await Promise.all([
    supabase
      .from("like_to_post")
      .select("post_id")
      .eq("user_id", userId.value)
      .in("post_id", postIds),
    supabase
      .from("favorites")
      .select("post_id")
      .eq("user_id", userId.value)
      .in("post_id", postIds),
  ]);

  const likedPostIds = new Set(likesResult.data?.map((l) => l.post_id) || []);
  const favoritedPostIds = new Set(
    favoritesResult.data?.map((f) => f.post_id) || [],
  );

  return posts.map((post) => ({
    ...post,
    isLiked: likedPostIds.has(post.id),
    isFavorited: favoritedPostIds.has(post.id),
    rating: post.rating || 0,
  }));
}

function handleSearchInstant() {
  if (searchQuery.value) {
    debouncedSearch.cancel?.();
    showSearchResults.value = false; // скрыть подсказки
    performSearch(searchQuery.value, false);
  }
}

async function updateSearchSuggestions(query: string) {
  if (!query) {
    searchResults.value = [];
    return;
  }
  const { data: categories } = await supabase
    .from("category")
    .select("id, name, slug")
    .ilike("name", `%${query}%`)
    .limit(5);
  const { data: posts } = await supabase
    .from("post")
    .select("id, title")
    .ilike("title", `%${query}%`)
    .limit(5);
  searchResults.value = [
    ...(categories?.map((c) => ({
      type: "category",
      id: c.id,
      title: c.name,
      slug: c.slug,
    })) || []),
    ...(posts?.map((p) => ({ type: "post", id: p.id, title: p.title })) || []),
  ];
  showSearchResults.value = true;
}

function loadMoreSearch() {
  if (searchQuery.value) {
    performSearch(searchQuery.value, true);
  }
}

async function performSearch(query: string, loadMore = false) {
  if (!query) {
    searchPosts.value = [];
    searchTotal.value = 0;
    searchHasMore.value = false;
    return;
  }

  if (!loadMore) {
    searchPage.value = 0;
    searchPosts.value = [];
  }

  const from = searchPage.value * searchPerPage;
  const to = from + searchPerPage - 1;

  searchLoading.value = true;
  try {
    const { data, error, count } = await supabase
      .from("post")
      .select(
        `
        *,
        post_images (*),
        likes:like_to_post(count),
        comments:comments(count)
      `,
        { count: "exact" },
      )
      .eq("moderation_status", "approved")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const enriched = await enrichPostsWithUserData(data || []);
    if (loadMore) {
      searchPosts.value = [...searchPosts.value, ...enriched];
    } else {
      searchPosts.value = enriched;
    }
    searchTotal.value = count || 0;
    searchHasMore.value = (searchPage.value + 1) * searchPerPage < (count || 0);
    searchPage.value++;
  } catch (e) {
    console.error("Search error:", e);
  } finally {
    searchLoading.value = false;
  }
}
// Функция загрузки следующей порции
function loadMore() {
  visibleCount.value += pageSize;
}

// Обновление поста (лайки, избранное)
function updatePost(updatedPost: any) {
  // обновляем в рекомендациях
  const recIndex = recommendedPosts.value.findIndex(
    (p) => p.id === updatedPost.id,
  );
  if (recIndex !== -1) {
    recommendedPosts.value[recIndex] = { ...updatedPost };
  }
  // обновляем во всех категориях
  for (const category of allCategories.value) {
    const postIndex = category.posts.findIndex((p) => p.id === updatedPost.id);
    if (postIndex !== -1) {
      category.posts[postIndex] = { ...updatedPost };
    }
  }
}

// Обработка лайка (без изменений)
async function handleLike(post: any) {
  try {
    await toggleLike(post.id);
  } catch (e) {
    console.error("Error toggling like:", e);
  }
}

async function handleFavorite(post: any) {
  try {
    await toggleFavorite(post.id);
  } catch (e) {
    console.error("Error toggling favorite:", e);
  }
}
function onResultClick() {
  showSearchResults.value = false;
}

// Поиск (без изменений)
const searchQuery = ref("");
const searchResults = ref<any[]>([]);
const debouncedSearch = debounce(async (query: string) => {
  if (!query) {
    searchResults.value = [];
    showSearchResults.value = false;
    searchPosts.value = []; // очищаем результаты постов
    return;
  }
  await updateSearchSuggestions(query);
  await performSearch(query, false); // запускаем полнотекстовый поиск
}, 300);

function handleSearch() {
  debouncedSearch(searchQuery.value);
}

watch(searchQuery, (newVal) => {
  if (!newVal) {
    searchPosts.value = [];
    searchResults.value = [];
  }
});

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return debounced;
}

onMounted(loadFeed);
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Поиск -->
    <div class="mb-4 relative" ref="searchContainer">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по категориям и постам..."
        class="w-full p-2 pl-9 text-sm bg-white dark:bg-gray-800 border border-primary/30 dark:border-gray-700 rounded-lg shadow-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition text-gray-900 dark:text-gray-100"
        @input="handleSearch"
        @keyup.enter="handleSearchInstant"
      />
      <MagnifyingGlassIcon
        class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/50 dark:text-gray-500"
      />
      <!-- Результаты поиска -->
      <div
        v-if="showSearchResults && searchResults.length"
        class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg border border-primary/20 dark:border-gray-700 rounded-lg p-2"
      >
        <div
          v-for="item in searchResults"
          :key="item.id"
          @click="onResultClick"
        >
          <NuxtLink
            :to="
              item.type === 'category'
                ? `/categories/${item.slug}`
                : `/post/${item.id}`
            "
            class="block p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          >
            {{ item.title }}
            <span class="text-xs text-primary dark:text-accent-400"
              >({{ item.type === "category" ? "Категория" : "Пост" }})</span
            >
          </NuxtLink>
        </div>
      </div>
    </div>

    <div
      v-if="searchLoading"
      class="text-center py-4 text-gray-500 dark:text-gray-400"
    >
      Поиск...
    </div>

    <div v-else-if="searchQuery && searchPosts.length > 0" class="mt-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Результаты поиска: "{{ searchQuery }}"
      </h2>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <PostCard
          v-for="post in searchPosts"
          :key="post.id"
          :post="post"
          @like="handleLike"
          @favorite="handleFavorite"
        />
      </div>
      <div v-if="searchHasMore" class="text-center my-8">
        <button
          @click="loadMoreSearch"
          class="px-6 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition shadow-sm"
        >
          Загрузить ещё
        </button>
      </div>
    </div>

    <div
      v-else-if="searchQuery && !searchLoading && searchPosts.length === 0"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Ничего не найдено по запросу "{{ searchQuery }}"
    </div>

    <div v-else>
      <!-- Скелетон загрузки -->
      <div v-if="loading" class="space-y-6">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div class="flex gap-4 overflow-hidden">
            <div
              v-for="j in 4"
              :key="j"
              class="w-[250px] h-36 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          </div>
        </div>
      </div>

      <div v-else>
        <!-- Рекомендации -->
        <CategoryRow
          v-if="recommendedPosts.length > 0"
          :category="{ name: 'Рекомендации', slug: 'recommended' }"
          :posts="recommendedPosts"
          class="mb-8"
          @like="handleLike"
          @favorite="handleFavorite"
        />

        <!-- Категории -->
        <CategoryRow
          v-for="item in visibleCategories"
          :key="item.category.id"
          :category="item.category"
          :posts="item.posts"
          class="mb-8"
          @like="handleLike"
          @favorite="handleFavorite"
        />

        <!-- Кнопка "Загрузить ещё" -->
        <div v-if="hasMore" class="text-center my-8">
          <button
            @click="loadMore"
            class="px-6 py-2 bg-secondary hover:bg-secondary/80 dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition shadow-sm"
          >
            Загрузить ещё
          </button>
        </div>

        <!-- Сообщение о конце контента -->
        <div
          v-if="!hasMore && allCategories.length > 0"
          class="text-center my-8 text-gray-500 dark:text-gray-400"
        >
          Контента больше нет
        </div>
      </div>
    </div>
  </div>
</template>
