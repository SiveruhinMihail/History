<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">Избранные посты</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else-if="posts.length === 0" class="text-center text-gray-500">
      У вас пока нет избранных постов
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @like="handleLike"
        @favorite="handleFavorite"
      />
    </div>
  </div>
</template>

<script setup>
import { useUser } from "~/composables/useUser";
import { useAuth } from "~/composables/useAuth";

const { getUserFavorites } = useUser();
const { profile } = useAuth();
const loading = ref(true);
const posts = ref([]);

onMounted(async () => {
  if (!profile.value) {
    // Редирект на логин
    return navigateTo("/auth/login");
  }
  try {
    posts.value = await getUserFavorites(profile.value.id);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

async function handleFavorite(post) {
  try {
    const isNowFavorited = await toggleFavorite(post.id);
    if (!isNowFavorited) {
      // Удаляем из списка
      posts.value = posts.value.filter((p) => p.id !== post.id);
    }
  } catch (e) {
    console.error(e);
  }
}
</script>
