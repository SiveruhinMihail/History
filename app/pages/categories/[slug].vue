<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">{{ category?.name }}</h1>
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
          @click="loadMore"
          class="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Загрузить ещё
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { getPostsByCategory, getCategoryBySlug, getRecommendedPosts } =
  usePosts();
const { isAuthenticated } = useAuth();
const { toggleFavorite } = useFavorites();

const category = ref<any>(null);
const posts = ref<any[]>([]);
const loading = ref(true);
const page = ref(0);
const hasMore = ref(true);

const loadCategory = async () => {
  try {
    category.value = await getCategoryBySlug(route.params.slug as string);
    if (!category.value) return navigateTo("/404");
    await loadPosts(0);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadData = async () => {
  const slug = route.params.slug;

  // Если это страница рекомендаций
  if (slug === "recommended") {
    // Загружаем рекомендованные посты (без категории)
    const recommended = await getRecommendedPosts(20); // загружаем 20, можно с пагинацией
    posts.value = recommended;
    hasMore.value = false; // пагинацию для рекомендаций можно не делать
    category.value = { name: "Рекомендации", slug: "recommended" };
    loading.value = false;
    return;
  }

  // Для обычных категорий
  try {
    category.value = await getCategoryBySlug(slug as string);
    if (!category.value) return navigateTo("/404");
    await loadPosts(0);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadPosts = async (offset: number) => {
  const newPosts = await getPostsByCategory(category.value.id, 20, offset);
  if (newPosts.length < 20) hasMore.value = false;
  posts.value = offset === 0 ? newPosts : [...posts.value, ...newPosts];
};

const loadMore = () => {
  page.value++;
  loadPosts(page.value * 20);
};

async function handleLike(post: any) {
  if (!isAuthenticated.value) return;
  // TODO: implement like logic
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
