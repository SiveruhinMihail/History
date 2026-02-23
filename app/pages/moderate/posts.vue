<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

const { isModerator, isAdmin } = useAuth();
const supabase = useSupabaseClient();

definePageMeta({
  composable: "auth",
});

const pendingPosts = ref<any[]>([]);
const loading = ref(true);

async function loadPosts() {
  if (!isModerator.value && !isAdmin.value) {
    return navigateTo("/");
  }
  loading.value = true;
  try {
    const { data } = await supabase
      .from("post")
      .select("*")
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: false });
    pendingPosts.value = data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPosts);

const approve = async (id: number) => {
  try {
    await $fetch("/api/moderation/approve-post", {
      method: "POST",
      body: { postId: id },
    });
    pendingPosts.value = pendingPosts.value.filter((p) => p.id !== id);
  } catch (e) {
    console.error(e);
    alert("Ошибка при одобрении");
  }
};

const reject = async (id: number) => {
  try {
    await $fetch("/api/moderation/reject-post", {
      method: "POST",
      body: { postId: id },
    });
    pendingPosts.value = pendingPosts.value.filter((p) => p.id !== id);
  } catch (e) {
    console.error(e);
    alert("Ошибка при отклонении");
  }
};
</script>

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
            class="bg-green-600 text-white px-3 py-1 rounded"
            @click="approve(post.id)"
          >
            Одобрить
          </button>
          <button
            class="bg-red-600 text-white px-3 py-1 rounded"
            @click="reject(post.id)"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
