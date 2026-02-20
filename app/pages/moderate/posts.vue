<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">Модерация постов</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else-if="pendingPosts.length === 0">Нет постов на модерацию</div>
    <div v-else>
      <div
        v-for="post in pendingPosts"
        :key="post.id"
        class="border p-4 mb-4 rounded"
      >
        <h2 class="text-xl font-semibold">{{ post.title }}</h2>
        <p class="text-gray-600">{{ post.description }}</p>
        <div class="flex gap-2 mt-2">
          <button
            @click="approve(post.id)"
            class="bg-green-600 text-white px-3 py-1 rounded"
          >
            Одобрить
          </button>
          <button
            @click="reject(post.id)"
            class="bg-red-600 text-white px-3 py-1 rounded"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const { isModerator, isAdmin } = useAuth();

definePageMeta({
  composable: "auth",
});

const pendingPosts = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  if (!isModerator.value && !isAdmin.value) {
    return navigateTo("/");
  }
  const { data } = await supabase
    .from("post")
    .select("*")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: false });
  pendingPosts.value = data || [];
  loading.value = false;
});

const approve = async (id: number) => {
  await supabase
    .from("post")
    .update({ moderation_status: "approved" })
    .eq("id", id);
  pendingPosts.value = pendingPosts.value.filter((p) => p.id !== id);
};

const reject = async (id: number) => {
  await supabase
    .from("post")
    .update({ moderation_status: "rejected" })
    .eq("id", id);
  pendingPosts.value = pendingPosts.value.filter((p) => p.id !== id);
};
</script>
