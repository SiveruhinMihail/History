<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">Категории</h1>
    <div v-if="loading" class="text-center">Загрузка...</div>
    <div v-else-if="error" class="text-center text-red-500">
      Ошибка загрузки
    </div>
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <NuxtLink
        v-for="cat in categories"
        :key="cat.id"
        :to="`/categories/${cat.slug}`"
        class="p-4 bg-white rounded shadow hover:shadow-md transition"
      >
        <h2 class="text-lg font-semibold">{{ cat.name }}</h2>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const loading = ref(true);
const error = ref<string | null>(null);
const categories = ref<any[]>([]);

onMounted(async () => {
  try {
    const { data, error: err } = await supabase
      .from("category")
      .select("*")
      .order("name");
    if (err) throw err;
    categories.value = data || [];
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>
