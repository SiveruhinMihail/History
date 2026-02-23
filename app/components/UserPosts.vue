<script setup lang="ts">
import type { Database } from "~/types/supabase";
import PostCard from "~/components/PostCard.vue";

const props = defineProps<{
  userId: number;
  isOwner: boolean;
}>();

const supabase = useSupabaseClient<Database>();
const { toggleFavorite } = useFavorites();

const statuses = [
  { value: "approved", label: "Опубликованные" },
  { value: "pending", label: "На проверке" },
  { value: "rejected", label: "Отклонённые" },
];

const selectedStatus = ref("approved");
const posts = ref<any[]>([]);
const loading = ref(false);
const page = ref(0);
const limit = 10;
const hasMore = ref(true);

async function loadPosts(reset = false) {
  if (reset) {
    page.value = 0;
    posts.value = [];
    hasMore.value = true;
  }
  if (!hasMore.value) return;
  loading.value = true;
  try {
    const from = page.value * limit;
    const to = from + limit - 1;
    const { data, error } = await supabase
      .from("post")
      .select(
        `
        *,
        post_images (*),
        likes:like_to_post(count)
      `,
      )
      .eq("author_id", props.userId)
      .eq("moderation_status", selectedStatus.value)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    if (data) {
      const enriched = await enrichPosts(data);
      posts.value.push(...enriched);
      hasMore.value = data.length === limit;
      page.value++;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function enrichPosts(postsData: any[]) {
  if (!props.isOwner) return postsData;
  const postIds = postsData.map((p) => p.id);
  let likedSet = new Set<number>();
  let favoritedSet = new Set<number>();

  if (props.isOwner) {
    const { data: likes } = await supabase
      .from("like_to_post")
      .select("post_id")
      .eq("user_id", props.userId)
      .in("post_id", postIds);
    likedSet = new Set(likes?.map((l) => l.post_id) || []);

    const { data: favorites } = await supabase
      .from("favorites")
      .select("post_id")
      .eq("user_id", props.userId)
      .in("post_id", postIds);
    favoritedSet = new Set(favorites?.map((f) => f.post_id) || []);
  }

  return postsData.map((post) => ({
    ...post,
    rating: post.likes?.[0]?.count || 0,
    isLiked: likedSet.has(post.id),
    isFavorited: favoritedSet.has(post.id),
  }));
}

watch(selectedStatus, () => loadPosts(true));
onMounted(() => loadPosts(true));

function loadMore() {
  loadPosts();
}

async function handleLike(post: any) {
  if (!props.isOwner) return;
  try {
    if (post.isLiked) {
      await supabase
        .from("like_to_post")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", props.userId);
      post.rating -= 1;
    } else {
      await supabase
        .from("like_to_post")
        .insert({ post_id: post.id, user_id: props.userId });
      post.rating += 1;
    }
    post.isLiked = !post.isLiked;
  } catch (e) {
    console.error(e);
  }
}

async function handleFavorite(post: any) {
  if (!props.isOwner) return;
  const newState = await toggleFavorite(post.id);
  post.isFavorited = newState;
}

async function deletePost(postId: number) {
  if (!confirm("Удалить пост?")) return;
  try {
    await $fetch("/api/moderation/delete-post", {
      method: "POST",
      body: { postId },
    });
    posts.value = posts.value.filter((p) => p.id !== postId);
  } catch (e) {
    console.error(e);
    alert("Ошибка при удалении");
  }
}
</script>
<template>
  <div>
    <!-- Переключатель статусов -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="status in statuses"
        :key="status.value"
        @click="selectedStatus = status.value"
        :class="[
          'px-3 py-1 rounded',
          selectedStatus === status.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300',
        ]"
      >
        {{ status.label }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-4">Загрузка...</div>
    <div v-else-if="posts.length === 0" class="text-center py-4 text-gray-500">
      Нет постов
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @like()="handleLike"
        @favorite()="handleFavorite"
      >
        <!-- Дополнительные действия для владельца -->
        <template #actions v-if="isOwner">
          <NuxtLink
            :to="`/edit-post/${post.id}`"
            class="text-blue-600 hover:underline"
          >
            Редактировать
          </NuxtLink>
          <button
            @click="deletePost(post.id)"
            class="text-red-600 hover:underline"
          >
            Удалить
          </button>
        </template>
      </PostCard>
    </div>

    <!-- Пагинация -->
    <div v-if="hasMore" class="text-center mt-4">
      <button @click="loadMore" class="text-blue-600 hover:underline">
        Загрузить ещё
      </button>
    </div>
  </div>
</template>
