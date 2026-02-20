<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-10">Загрузка...</div>
    <div v-else-if="!post" class="text-center py-10">Пост не найден</div>
    <div v-else>
      <!-- Пост -->
      <h1 class="text-3xl font-bold mb-2">{{ post.title }}</h1>
      <div class="flex items-center justify-between mb-4 text-sm text-gray-500">
        <div class="flex items-center gap-2">
          <span>Автор: {{ post.author?.use || "Неизвестно" }}</span>
          <span>•</span>
          <span>{{ formatDate(post.created_at) }}</span>
        </div>
        <div class="flex items-center gap-4">
          <button
            @click="toggleLike"
            :disabled="!isAuthenticated"
            class="flex items-center gap-1 hover:text-blue-600"
          >
            <HeartIcon
              :class="[isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400']"
              class="w-5 h-5"
            />
            <span>{{ post.rating }}</span>
          </button>
          <button
            @click="toggleFavoritePost"
            :disabled="!isAuthenticated"
            class="flex items-center gap-1 hover:text-yellow-500"
          >
            <BookmarkIcon
              :class="[
                isFavorited
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-400',
              ]"
              class="w-5 h-5"
            />
          </button>
        </div>
      </div>

      <!-- Галерея изображений поста -->
      <div
        v-if="post.post_images?.length"
        class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4"
      >
        <div
          v-for="(img, index) in post.post_images"
          :key="index"
          class="cursor-pointer overflow-hidden rounded-lg"
          @click="
            openImageViewer(
              post.post_images.map((i: any) => i.url),
              index as number,
            )
          "
        >
          <img
            :src="img.url"
            class="w-full h-40 object-cover hover:scale-105 transition"
          />
        </div>
      </div>

      <p class="text-gray-800 whitespace-pre-line mb-8">
        {{ post.description }}
      </p>

      <!-- Комментарии -->
      <div class="border-t pt-6">
        <h2 class="text-2xl font-semibold mb-4">
          Комментарии ({{ totalComments }})
        </h2>

        <!-- Форма комментария -->
        <CommentForm
          v-if="isAuthenticated"
          :post-id="post.id"
          :parent-id="replyToCommentId"
          :reply-to="replyToUsername"
          @comment-added="handleNewComment"
          @cancel="cancelReply"
          class="mb-6"
        />
        <div v-else class="mb-6 text-center text-gray-500">
          <NuxtLink to="/auth/login" class="text-blue-600 hover:underline"
            >Войдите</NuxtLink
          >, чтобы оставить комментарий.
        </div>

        <!-- Дерево комментариев -->
        <div
          v-if="commentTree.length === 0"
          class="text-gray-500 text-center py-4"
        >
          Пока нет комментариев.
        </div>
        <div v-else class="space-y-4">
          <CommentItem
            v-for="comment in commentTree"
            :key="comment.id"
            :comment="comment"
            :is-authenticated="isAuthenticated"
            @like="toggleCommentLike"
            @reply="startReply"
            @open-image="openImageViewer"
          />
        </div>

        <!-- Кнопка загрузить ещё -->
        <div v-if="hasMoreComments" class="text-center mt-4">
          <button
            @click="loadMoreComments"
            class="text-blue-600 hover:underline"
          >
            Загрузить ещё
          </button>
        </div>
      </div>
    </div>

    <!-- Просмотрщик изображений -->
    <ImageViewer
      v-if="showViewer"
      :images="viewerImages"
      :initial-index="viewerIndex"
      @close="showViewer = false"
    />
  </div>
</template>

<script setup lang="ts">
import { HeartIcon, BookmarkIcon } from "@heroicons/vue/24/outline";
import type { Database } from "~/types/supabase";
import CommentForm from "~/components/CommentForm.vue";
import CommentItem from "~/components/CommentItem.vue";
import ImageViewer from "~/components/ImageViewer.vue";

const supabase = useSupabaseClient<Database>();
const route = useRoute();
const { isAuthenticated, userId } = useAuth();
const { toggleFavorite, isFavorite } = useFavorites();

const loading = ref(true);
const post = ref<any>(null);
const comments = ref<any[]>([]);
const totalComments = ref(0);
const isLiked = ref(false);
const isFavorited = ref(false);
const replyToCommentId = ref<number | null>(null);
const replyToUsername = ref<string | null>(null);

// Просмотр изображений
const viewerImages = ref<string[]>([]);
const viewerIndex = ref(0);
const showViewer = ref(false);

function openImageViewer(images: string[], index: number) {
  viewerImages.value = images;
  viewerIndex.value = index;
  showViewer.value = true;
}

// Пагинация
const commentsLimit = 20;
const commentsOffset = ref(0);
const hasMoreComments = ref(true);

// Дерево комментариев
const commentTree = ref<any[]>([]);

// Построение дерева комментариев
function buildCommentTree() {
  const map = new Map();
  comments.value.forEach((c) => {
    map.set(c.id, {
      ...c,
      children: [],
      liked: c.liked,
    });
  });
  const roots: any[] = [];
  comments.value.forEach((c) => {
    const node = map.get(c.id);
    if (c.parent_id && map.has(c.parent_id)) {
      const parent = map.get(c.parent_id);
      parent.children.push(node);
    } else if (!c.parent_id) {
      roots.push(node);
    }
  });
  const sortByDate = (a: any, b: any) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  roots.sort(sortByDate);
  roots.forEach((r) => r.children.sort(sortByDate));
  commentTree.value = roots;
}

// Загрузка поста
const loadPost = async () => {
  const id = route.params.id;
  const idStr = !id ? null : Array.isArray(id) ? id[0] : id;
  const numericId = idStr ? parseInt(idStr, 10) : -1;

  // Загружаем пост
  const { data: postData, error: postError } = await supabase
    .from("post")
    .select(
      `
      *,
      author:user!author_id(*),
      post_images (*),
      likes:like_to_post(count)
    `,
    )
    .eq("id", numericId)
    .single();
  if (postError) throw postError;

  post.value = postData;
  post.value.rating = postData.likes?.[0]?.count || 0;

  // Получаем общее количество комментариев
  const { count } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", numericId);
  totalComments.value = count || 0;

  // Загружаем первые комментарии
  await loadComments(numericId, 0);

  // Проверка лайка поста и закладки
  if (isAuthenticated.value && userId.value) {
    const { data: likeData } = await supabase
      .from("like_to_post")
      .select("user_id")
      .eq("post_id", numericId)
      .eq("user_id", userId.value)
      .maybeSingle();
    isLiked.value = !!likeData;

    isFavorited.value = await isFavorite(numericId);
  }
};

// Загрузка комментариев с пагинацией
const loadComments = async (postId: number, offset: number) => {
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
    *,
    user:user_id(
      id,
      username,
      use,
      avatar,
      communities:subscribers(
        community:communities_id(id, name, patent)
      )
    ),
    likes:like_to_comment(count),
    images:comment_images(*)
  `,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .range(offset, offset + commentsLimit - 1);
  if (error) throw error;

  if (data) {
    let likedSet = new Set<number>();
    if (isAuthenticated.value && userId.value) {
      const commentIds = data.map((c) => c.id);
      const { data: likes } = await supabase
        .from("like_to_comment")
        .select("comment_id")
        .eq("user_id", userId.value)
        .in("comment_id", commentIds);
      likedSet = new Set(likes?.map((l) => l.comment_id) || []);
    }

    const enriched = data.map((c) => ({
      ...c,
      likes_count: c.likes?.[0]?.count || 0,
      liked: likedSet.has(c.id),
      images: c.images || [],
    }));

    comments.value = [...comments.value, ...enriched];
    commentsOffset.value = offset + enriched.length;
    hasMoreComments.value = enriched.length === commentsLimit;
    buildCommentTree();
  }
};

const loadMoreComments = () => {
  if (post.value) {
    loadComments(post.value.id, commentsOffset.value);
  }
};

// Real-time подписка на новые комментарии
onMounted(() => {
  const id = route.params.id;
  const idStr = !id ? null : Array.isArray(id) ? id[0] : id;
  const numericId = idStr ? parseInt(idStr, 10) : -1;
  if (isNaN(numericId) || numericId <= 0) {
    console.error("Invalid post ID for realtime subscription");
    return;
  }

  const subscription = supabase
    .channel("comments-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${numericId}`,
      },
      async (payload) => {
        const { data: newComment } = await supabase
          .from("comments")
          .select(
            `
            *,
            user:user_id(*),
            likes:like_to_comment(count),
            images:comment_images(*)
          `,
          )
          .eq("id", payload.new.id)
          .single();
        if (newComment) {
          let liked = false;
          if (isAuthenticated.value && userId.value) {
            const { data: like } = await supabase
              .from("like_to_comment")
              .select("comment_id")
              .eq("comment_id", newComment.id)
              .eq("user_id", userId.value)
              .maybeSingle();
            liked = !!like;
          }
          const enriched = {
            ...newComment,
            likes_count: newComment.likes?.[0]?.count || 0,
            liked,
            images: newComment.images || [],
          };
          comments.value.push(enriched);
          totalComments.value++;
          buildCommentTree();
        }
      },
    )
    .subscribe();

  onUnmounted(() => {
    subscription.unsubscribe();
  });
});

// Инициализация
onMounted(async () => {
  try {
    await loadPost();
  } catch (e) {
    console.error("Error loading post:", e);
  } finally {
    loading.value = false;
  }
});

// Обработка нового комментария из формы
function handleNewComment(comment: any) {
  comments.value.push(comment);
  totalComments.value++;
  buildCommentTree();
  replyToCommentId.value = null;
  replyToUsername.value = null;
}

// Лайк поста
async function toggleLike() {
  if (!isAuthenticated.value || !userId.value || !post.value) return;
  try {
    if (isLiked.value) {
      await supabase
        .from("like_to_post")
        .delete()
        .eq("post_id", post.value.id)
        .eq("user_id", userId.value);
      post.value.rating -= 1;
    } else {
      await supabase
        .from("like_to_post")
        .insert({ post_id: post.value.id, user_id: userId.value });
      post.value.rating += 1;
    }
    isLiked.value = !isLiked.value;
    post.value = { ...post.value }; // триггерим реактивность
  } catch (e) {
    console.error("Error toggling like:", e);
    if (isLiked.value) {
      post.value.rating += 1;
    } else {
      post.value.rating -= 1;
    }
  }
}

// Закладка
async function toggleFavoritePost() {
  if (!isAuthenticated.value || !post.value) return;
  try {
    const result = await toggleFavorite(post.value.id);
    isFavorited.value = result;
  } catch (e) {
    console.error("Error toggling favorite:", e);
  }
}

// Лайк комментария
async function toggleCommentLike(comment: any) {
  if (!isAuthenticated.value || !userId.value) return;

  const wasLiked = comment.liked;
  const previousLikesCount = comment.likes_count;

  try {
    if (wasLiked) {
      await supabase
        .from("like_to_comment")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", userId.value);
      comment.likes_count -= 1;
      comment.liked = false;
    } else {
      await supabase
        .from("like_to_comment")
        .insert({ comment_id: comment.id, user_id: userId.value });
      comment.likes_count += 1;
      comment.liked = true;
    }

    const index = comments.value.findIndex((c) => c.id === comment.id);
    if (index !== -1) {
      comments.value[index] = { ...comment };
      comments.value = [...comments.value];
    }
    buildCommentTree();
  } catch (e) {
    console.error("Error toggling comment like:", e);
    comment.likes_count = previousLikesCount;
    comment.liked = wasLiked;
  }
}

// Начать ответ
function startReply(comment: any) {
  replyToCommentId.value = comment.id;
  replyToUsername.value = comment.user?.use || "Пользователь";
}

function cancelReply() {
  replyToCommentId.value = null;
  replyToUsername.value = null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
