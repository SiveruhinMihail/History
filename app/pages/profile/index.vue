<!-- pages/index.vue -->
<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Поисковая строка -->
    <div class="mb-6 relative">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по категориям и постам..."
        class="w-full p-2 border rounded"
        @input="handleSearch"
      />
      <div
        v-if="searchResults.length"
        class="absolute mt-2 bg-white shadow rounded p-2 z-10 w-full max-w-md"
      >
        <div v-for="item in searchResults" :key="item.id">
          <NuxtLink
            :to="
              item.type === 'category'
                ? `/categories/${item.slug}`
                : `/post/${item.id}`
            "
            class="block p-1 hover:bg-gray-100"
          >
            {{ item.title }} ({{
              item.type === "category" ? "Категория" : "Пост"
            }})
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-8 w-48 bg-gray-200 rounded mb-3"></div>
        <div class="flex gap-4 overflow-hidden">
          <div
            v-for="j in 4"
            :key="j"
            class="w-[max(250px,30vw)] sm:w-[300px] h-40 bg-gray-200 rounded"
          ></div>
        </div>
      </div>
    </div>

    <!-- Готовая лента -->
    <div v-else>
      <!-- Рекомендации -->
      <CategoryRow
        :category="{ name: 'Рекомендации', slug: 'recommended' }"
        :posts="recommendedPosts"
        class="mb-8"
        @like="handleLike"
        @favorite="handleFavorite"
      />

      <!-- Категории -->
      <CategoryRow
        v-for="item in feed"
        :key="item.category.id"
        :category="item.category"
        :posts="item.posts"
        class="mb-8"
        @like="handleLike"
        @favorite="handleFavorite"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const { getHomeFeed, getRecommendedPosts } = usePosts();
const { isAuthenticated, userId } = useAuth();
const { toggleFavorite } = useFavorites();

const feed = ref<any[]>([]);
const recommendedPosts = ref<any[]>([]);
const loading = ref(true);

// Поиск
const searchQuery = ref("");
const searchResults = ref<any[]>([]);

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedSearch = debounce(async (query: string) => {
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
}, 300);

function handleSearch() {
  debouncedSearch(searchQuery.value);
}

// Обогащение постов данными о лайках и закладках
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
  }));
}

// Обновление поста в реактивных массивах после изменения
function updatePost(updatedPost: any) {
  const recIndex = recommendedPosts.value.findIndex(
    (p) => p.id === updatedPost.id,
  );
  if (recIndex !== -1) {
    recommendedPosts.value[recIndex] = { ...updatedPost };
    return;
  }
  for (const category of feed.value) {
    const postIndex = category.posts.findIndex(
      (p: any) => p.id === updatedPost.id,
    );
    if (postIndex !== -1) {
      category.posts[postIndex] = { ...updatedPost };
      break;
    }
  }
}

async function handleLike(post: any) {
  if (!isAuthenticated.value || !userId.value) return;
  try {
    if (post.isLiked) {
      await supabase
        .from("like_to_post")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId.value);
      if (post.likes && post.likes[0]) {
        post.likes[0].count -= 1;
      }
    } else {
      await supabase
        .from("like_to_post")
        .insert({ post_id: post.id, user_id: userId.value });
      if (post.likes && post.likes[0]) {
        post.likes[0].count += 1;
      } else {
        post.likes = [{ count: 1 }];
      }
    }
    post.isLiked = !post.isLiked;
    updatePost(post);
  } catch (e) {
    console.error("Error toggling like:", e);
  }
}

async function handleFavorite(post: any) {
  if (!isAuthenticated.value || !userId.value) return;
  try {
    const newState = await toggleFavorite(post.id);
    post.isFavorited = newState;
    updatePost(post);
  } catch (e) {
    console.error("Error toggling favorite:", e);
  }
}

onMounted(async () => {
  try {
    const [recommended, categoriesFeed] = await Promise.all([
      getRecommendedPosts(10),
      getHomeFeed(12),
    ]);

    recommendedPosts.value = await enrichPostsWithUserData(recommended || []);
    const enrichedFeed = await Promise.all(
      categoriesFeed.map(async (item) => ({
        ...item,
        posts: item.posts ? await enrichPostsWithUserData(item.posts) : [],
      })),
    );
    feed.value = enrichedFeed;
  } catch (e) {
    console.error("Ошибка загрузки ленты:", e);
  } finally {
    loading.value = false;
  }
});
</script>
