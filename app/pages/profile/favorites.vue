<!-- pages/profile/favorites.vue -->
<script setup lang="ts">
import { useReactionState } from "~/composables/useReactionState";

const supabase = useSupabaseClient();
const { userId, isAuthenticated } = useAuth();
const { getUserFavorites } = useUser();
const { initPostReactions, toggleLike, toggleFavorite } = useReactionState();

const favorites = ref<any[]>([]);
const loading = ref(true);

// Инициализация реакций для списка избранного
async function initReactions(posts: any[]) {
  if (!isAuthenticated.value || !userId.value || !posts.length) return posts;

  const postIds = posts.map((p) => p.id);
  const [likesResult] = await Promise.all([
    supabase
      .from("like_to_post")
      .select("post_id")
      .eq("user_id", userId.value)
      .in("post_id", postIds),
  ]);

  const likedSet = new Set(likesResult.data?.map((l) => l.post_id) || []);

  posts.forEach((post) => {
    initPostReactions(
      post.id,
      likedSet.has(post.id),
      post.likes?.[0]?.count || 0,
      true, // все посты в избранном уже favorited
    );
  });

  return posts;
}

// Обновление поста в локальном массиве (для отображения)
function updatePost(updatedPost: any) {
  const index = favorites.value.findIndex((p) => p.id === updatedPost.id);
  if (index !== -1) {
    favorites.value[index] = { ...updatedPost };
  }
}

// Обработка лайка (используем глобальное состояние)
async function handleLike(post: any) {
  try {
    await toggleLike(post.id);
  } catch (e) {
    console.error("Error toggling like:", e);
  }
}

// Обработка закладки (удаление из избранного)
async function handleFavorite(post: any) {
  try {
    await toggleFavorite(post.id);
    // Удаляем из текущего списка, т.к. больше не в избранном
    favorites.value = favorites.value.filter((p) => p.id !== post.id);
  } catch (e) {
    console.error("Error toggling favorite:", e);
  }
}

onMounted(async () => {
  if (!userId.value) return;
  try {
    const userFavorites = await getUserFavorites(userId.value);
    const initialized = await initReactions(userFavorites);
    favorites.value = initialized;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">Мои закладки</h1>

    <div v-if="loading" class="text-center py-10">Загрузка...</div>
    <div
      v-else-if="favorites.length === 0"
      class="text-center py-10 text-gray-500"
    >
      У вас пока нет избранных постов.
    </div>
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <PostCard
        v-for="post in favorites"
        :key="post.id"
        :post="post"
        @like="() => handleLike(post)"
        @favorite="() => handleFavorite(post)"
      />
    </div>
  </div>
</template>
