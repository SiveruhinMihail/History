<template>
  <div>
    <!-- Переключатель статусов -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="status in statuses"
        :key="status.value"
        @click="selectedStatus = status.value"
        :class="[
          'px-3 py-1 rounded text-sm font-medium transition',
          selectedStatus === status.value
            ? 'bg-accent text-white dark:bg-accent-600'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
        ]"
      >
        {{ status.label }}
      </button>
    </div>

    <div
      v-if="loading"
      class="text-center py-4 text-gray-500 dark:text-gray-400"
    >
      Загрузка...
    </div>
    <div
      v-else-if="posts.length === 0"
      class="text-center py-4 text-gray-500 dark:text-gray-400"
    >
      Нет постов
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @like="handleLike"
        @favorite="handleFavorite"
      >
        <!-- Слот для дополнительных действий -->
        <template
          #actions
          v-if="isOwner && post.moderation_status === 'rejected'"
        >
          <NuxtLink
            :to="`/edit-post/${post.id}`"
            class="text-accent hover:underline dark:text-accent-400 text-sm"
          >
            Редактировать
          </NuxtLink>
        </template>
      </PostCard>
    </div>

    <!-- Пагинация -->
    <div v-if="hasMore" class="text-center mt-4">
      <button
        @click="loadMore"
        class="text-accent hover:underline dark:text-accent-400"
      >
        Загрузить ещё
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import PostCard from "./PostCard.vue";
import { useSupabaseClient } from "#imports";
import { useAuth } from "~/composables/useAuth";
import { useReactionState } from "~/composables/useReactionState";

const props = defineProps<{
  userId: number | undefined;
  isOwner: boolean;
}>();

const supabase = useSupabaseClient();
const { userId: currentUserId } = useAuth();
const { initPostReactions, toggleLike, toggleFavorite } = useReactionState();

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

// ----- Функции загрузки -----
async function loadPosts(reset = false) {
  if (!props.userId) return;
  if (loading.value) return;

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
        likes:like_to_post(count),
        categories:post_categories(category:category_id(id, name, slug))
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
  if (!props.isOwner) return postsData; // для чужих не нужно обогащать

  const postIds = postsData.map((p) => p.id);

  let likedSet = new Set<number>();
  let favoritedSet = new Set<number>();

  if (props.isOwner && currentUserId.value) {
    const [likesRes, favsRes] = await Promise.all([
      supabase
        .from("like_to_post")
        .select("post_id")
        .eq("user_id", currentUserId.value)
        .in("post_id", postIds),
      supabase
        .from("favorites")
        .select("post_id")
        .eq("user_id", currentUserId.value)
        .in("post_id", postIds),
    ]);

    likedSet = new Set(likesRes.data?.map((l) => l.post_id) || []);
    favoritedSet = new Set(favsRes.data?.map((f) => f.post_id) || []);
  }

  // Инициализируем глобальное состояние для каждого поста
  postsData.forEach((post) => {
    initPostReactions(
      post.id,
      likedSet.has(post.id),
      post.likes?.[0]?.count || 0,
      favoritedSet.has(post.id),
    );
  });

  // Возвращаем исходные данные (без isLiked/isFavorited)
  return postsData;
}

function loadMore() {
  if (props.userId) loadPosts();
}

// ----- Обработчики лайков и избранного -----
async function handleLike(post: any) {
  try {
    await toggleLike(post.id);
  } catch (e) {
    console.error(e);
  }
}

async function handleFavorite(post: any) {
  try {
    await toggleFavorite(post.id);
  } catch (e) {
    console.error(e);
  }
}

// ----- Watchers -----
watch(
  () => props.userId,
  (newId) => {
    if (newId) loadPosts(true);
  },
  { immediate: true },
);

watch(selectedStatus, () => {
  if (props.userId) loadPosts(true);
});
</script>
