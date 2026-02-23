<script setup lang="ts">
import type { Database } from "~/types/supabase";
import { useAuth } from "~/composables/useAuth";
import { useFavorites } from "~/composables/useFavorites";

const route = useRoute();
const supabase = useSupabaseClient<Database>();
const { getPostsByCategory, getCategoryBySlug } = usePosts();
const { isAuthenticated, userId } = useAuth();
const { toggleFavorite } = useFavorites();

const category = ref<any>(null);
const posts = ref<any[]>([]);
const loading = ref(true);
const page = ref(0);
const hasMore = ref(true);

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
  const likedSet = new Set(likesResult.data?.map((l) => l.post_id) || []);
  const favoritedSet = new Set(
    favoritesResult.data?.map((f) => f.post_id) || [],
  );
  return posts.map((post) => ({
    ...post,
    isLiked: likedSet.has(post.id),
    isFavorited: favoritedSet.has(post.id),
    rating: post.rating || 0,
  }));
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
  const newPosts = await getPostsByCategory(category.value.id, 20, offset);
  const enriched = await enrichPostsWithUserData(newPosts);
  if (enriched.length < 20) hasMore.value = false;
  posts.value = offset === 0 ? enriched : [...posts.value, ...enriched];
}

async function loadMore() {
  page.value++;
  await loadPosts(page.value * 20);
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
      post.rating -= 1;
    } else {
      await supabase
        .from("like_to_post")
        .insert({ post_id: post.id, user_id: userId.value });
      post.rating += 1;
    }
    post.isLiked = !post.isLiked;
  } catch (e) {
    console.error(e);
  }
}

async function handleFavorite(post: any) {
  if (!isAuthenticated.value) return;
  try {
    const newState = await toggleFavorite(post.id);
    post.isFavorited = newState;
  } catch (e) {
    console.error(e);
  }
}

onMounted(loadCategory);
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">{{ category?.name }}</h1>
    </div>
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
          @like="() => handleLike(post)"
          @favorite="() => handleFavorite(post)"
        />
      </div>
      <div v-if="hasMore" class="text-center mt-4">
        <button
          class="bg-blue-600 text-white px-4 py-2 rounded"
          @click="loadMore"
        >
          Загрузить ещё
        </button>
      </div>
    </div>
  </div>
</template>
