<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
      Категории
    </h1>
    <div v-if="loading" class="text-center text-gray-500 dark:text-gray-400">
      Загрузка...
    </div>
    <div v-else-if="error" class="text-center text-red-500 dark:text-red-400">
      Ошибка загрузки
    </div>
    <div
      v-else-if="categoriesWithPosts.length === 0"
      class="text-center text-gray-500 dark:text-gray-400"
    >
      Нет категорий с постами
    </div>
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <NuxtLink
        v-for="cat in categoriesWithPosts"
        :key="cat.id"
        :to="`/categories/${cat.slug}`"
        class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md dark:shadow-gray-900 transition flex justify-between items-center border border-primary/10 dark:border-gray-700"
      >
        <span class="text-lg font-semibold text-gray-800 dark:text-white">{{
          cat.name
        }}</span>
        <span
          class="bg-accent/20 text-accent-dark dark:bg-accent-700 dark:text-accent-200 px-2 py-1 rounded text-sm font-medium"
        >
          {{ cat.postCount }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const loading = ref(true);
const error = ref<string | null>(null);
const categoriesWithPosts = ref<any[]>([]);

async function loadCategoriesWithCounts() {
  try {
    const { data: categories, error: catError } = await supabase
      .from("category")
      .select("id, name, slug")
      .order("name");
    if (catError) throw catError;

    if (!categories) {
      categoriesWithPosts.value = [];
      return;
    }

    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const { data: postIdsData } = await supabase
          .from("post_categories")
          .select("post_id")
          .eq("category_id", cat.id);

        if (!postIdsData || postIdsData.length === 0) {
          return { ...cat, postCount: 0 };
        }

        const postIds = postIdsData.map((p) => p.post_id);

        const { count } = await supabase
          .from("post")
          .select("*", { count: "exact", head: true })
          .in("id", postIds)
          .eq("moderation_status", "approved");

        return {
          ...cat,
          postCount: count || 0,
        };
      }),
    );

    categoriesWithPosts.value = enriched.filter((cat) => cat.postCount > 0);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadCategoriesWithCounts);
</script>
