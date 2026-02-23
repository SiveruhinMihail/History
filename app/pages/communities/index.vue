<script setup lang="ts">
const supabase = useSupabaseClient();
const communities = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  const { data, error } = await supabase
    .from("community")
    .select("*")
    .order("rating", { ascending: false });
  if (error) console.error(error);
  else communities.value = data || [];
  loading.value = false;
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Сообщества</h1>
      <NuxtLink
        to="/communities/create"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Создать сообщество
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center">Загрузка...</div>
    <div v-else-if="communities.length === 0" class="text-center text-gray-500">
      Пока нет сообществ. Будьте первым!
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="c in communities"
        :key="c.id"
        :to="`/communities/${c.id}`"
        class="block p-4 bg-white rounded shadow hover:shadow-md transition"
      >
        <div class="flex items-center gap-3">
          <img
            :src="c.avatar || '/default-community.png'"
            class="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h2 class="font-semibold text-lg">{{ c.name }}</h2>
            <p class="text-sm text-gray-500 line-clamp-1">
              {{ c.description }}
            </p>
          </div>
        </div>
        <div
          class="mt-2 flex items-center justify-between text-sm text-gray-400"
        >
          <span>⭐ {{ c.rating }}</span>
          <span v-if="c.patent" class="text-yellow-500">✓</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
