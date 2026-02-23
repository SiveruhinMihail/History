<script setup lang="ts">
const supabase = useSupabaseClient();
const loading = ref(true);
const error = ref<string | null>(null);
const categoriesWithPosts = ref<any[]>([]);

async function loadCategoriesWithCounts() {
  try {
    // Получаем все категории
    const { data: categories, error: catError } = await supabase
      .from("category")
      .select("id, name, slug")
      .order("name");
    if (catError) throw catError;

    if (!categories) {
      categoriesWithPosts.value = [];
      return;
    }

    // Для каждой категории получаем количество одобренных постов
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        // Получаем ID постов из связующей таблицы
        const { data: postIdsData } = await supabase
          .from("post_categories")
          .select("post_id")
          .eq("category_id", cat.id);

        if (!postIdsData || postIdsData.length === 0) {
          return { ...cat, postCount: 0 };
        }

        const postIds = postIdsData.map((p) => p.post_id);

        // Считаем количество одобренных постов
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

    // Фильтруем только те, у которых есть посты
    categoriesWithPosts.value = enriched.filter((cat) => cat.postCount > 0);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadCategoriesWithCounts);
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">Категории</h1>
    <div v-if="loading" class="text-center">Загрузка...</div>
    <div v-else-if="error" class="text-center text-red-500">
      Ошибка загрузки
    </div>
    <div
      v-else-if="categoriesWithPosts.length === 0"
      class="text-center text-gray-500"
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
        class="p-4 bg-white rounded shadow hover:shadow-md transition flex justify-between items-center"
      >
        <span class="text-lg font-semibold">{{ cat.name }}</span>
        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
          {{ cat.postCount }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
