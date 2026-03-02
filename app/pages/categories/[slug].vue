<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">{{ category?.name }}</h1>
    <div v-if="loading" class="text-center">Загрузка...</div>
    <div v-else-if="posts.length === 0" class="text-center text-gray-500">
      Нет постов в этой категории
    </div>
    <div v-else>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @like="handleLike"
          @favorite="handleFavorite"
        />
      </div>
      <div v-if="hasMore" class="text-center mt-4">
        <button
          @click="loadMore"
          class="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition shadow-sm"
        >
          Загрузить ещё
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/supabase";
import { useAuth } from "~/composables/useAuth";
import { useReactionState } from "~/composables/useReactionState";
import PostCard from "~/components/PostCard.vue";

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const { getPostsByCategory, getCategoryBySlug } = usePosts();
const { isAuthenticated, userId } = useAuth();
const { initPostReactions, toggleLike, toggleFavorite } = useReactionState();

const category = ref<any>(null);
const posts = ref<any[]>([]);
const loading = ref(true);
const page = ref(0);
const hasMore = ref(true);
const limit = 20;

// Инициализация реакций для массива постов
async function initReactionsForPosts(postsData: any[]) {
  if (!isAuthenticated.value || !userId.value || !postsData.length)
    return postsData;

  const postIds = postsData.map((p) => p.id);
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

  postsData.forEach((post) => {
    initPostReactions(
      post.id,
      likedSet.has(post.id),
      post.likes?.[0]?.count || 0,
      favoritedSet.has(post.id),
    );
  });

  return postsData;
}

async function loadCategory() {
  try {
    category.value = await getCategoryBySlug(route.params.slug as string);
    if (!category.value) return navigateTo("/404");
    await resetAndLoad();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function resetAndLoad() {
  page.value = 0;
  posts.value = [];
  hasMore.value = true;
  await loadPosts(0);
}

async function loadPosts(offset: number) {
  const newPosts = await getPostsByCategory(category.value.id, limit, offset);
  const enriched = await initReactionsForPosts(newPosts);
  if (enriched.length < limit) hasMore.value = false;
  posts.value = offset === 0 ? enriched : [...posts.value, ...enriched];
}

async function loadMore() {
  page.value++;
  await loadPosts(page.value * limit);
}

// Обработчики теперь вызывают глобальные функции
async function handleLike(post: any) {
  try {
    await toggleLike(post.id);
  } catch (e) {
    console.error(e);
  }
}

async function handleFavorite(post: any) {
  try {
    await toggleFavorite(post.id);
  } catch (e) {
    console.error(e);
  }
}

onMounted(loadCategory);
</script>
