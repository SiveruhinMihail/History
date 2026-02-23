<!-- pages/profile/favorites.vue -->
<script setup lang="ts">
const supabase = useSupabaseClient();
const { userId, isAuthenticated } = useAuth();
const { getUserFavorites } = useUser();
const { toggleFavorite } = useFavorites();

const favorites = ref<any[]>([]);
const loading = ref(true);

// Обогащение постов информацией о лайках текущего пользователя
async function enrichWithLikes(posts: any[]) {
  if (!isAuthenticated.value || !userId.value || !posts.length) return posts;

  const postIds = posts.map((p) => p.id);
  const { data: likes } = await supabase
    .from("like_to_post")
    .select("post_id")
    .eq("user_id", userId.value)
    .in("post_id", postIds);

  const likedSet = new Set(likes?.map((l) => l.post_id) || []);
  return posts.map((post) => ({
    ...post,
    isLiked: likedSet.has(post.id),
    isFavorited: true,
  }));
}

// Обновление поста в локальном массиве
function updatePost(updatedPost: any) {
  const index = favorites.value.findIndex((p) => p.id === updatedPost.id);
  if (index !== -1) {
    favorites.value[index] = { ...updatedPost };
  }
}

// Обработка лайка
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

// Обработка закладки (удаление из избранного)
async function handleFavorite(post: any) {
  if (!isAuthenticated.value || !userId.value) return;
  try {
    const newState = await toggleFavorite(post.id);
    post.isFavorited = newState;
    if (!newState) {
      // Удаляем из текущего списка
      favorites.value = favorites.value.filter((p) => p.id !== post.id);
    } else {
      updatePost(post);
    }
  } catch (e) {
    console.error("Error toggling favorite:", e);
  }
}

onMounted(async () => {
  if (!userId.value) return;
  try {
    const userFavorites = await getUserFavorites(userId.value);
    const enriched = await enrichWithLikes(userFavorites);
    favorites.value = enriched;
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
