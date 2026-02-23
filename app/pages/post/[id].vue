<script setup lang="ts">
import { HeartIcon, BookmarkIcon, FlagIcon } from "@heroicons/vue/24/outline";
import type { Database } from "~/types/supabase";
type PostImage = Database["public"]["Tables"]["post_images"]["Row"];

const postImages = computed(
  () => post.value?.post_images?.map((img: PostImage) => img.url) || [],
);

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
const hasReportedPost = ref(false); // для блокировки повторной жалобы на пост

// Жалоба
const reportModalTarget = ref<{
  type: "post" | "comment" | "user";
  id: number;
} | null>(null);

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

function buildCommentTree() {
  const map = new Map();
  comments.value.forEach((c) => {
    map.set(c.id, { ...c, children: [] });
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

  // Функция сортировки: сначала по лайкам (убывание), потом по дате (убывание)
  const sortFn = (a: any, b: any) => {
    if (a.likes_count !== b.likes_count) {
      return b.likes_count - a.likes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  roots.sort(sortFn);
  roots.forEach((r) => r.children.sort(sortFn));
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
      `*, author:user!author_id(*), post_images (*), likes:like_to_post(count)`,
    )
    .eq("id", numericId)
    .single();
  if (postError) throw postError;

  post.value = postData;
  post.value.rating = postData.likes?.[0]?.count || 0;

  // Проверка, отправлял ли пользователь жалобу на этот пост
  if (isAuthenticated.value && userId.value) {
    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("target_type", "post")
      .eq("target_id", numericId)
      .eq("reporter_id", userId.value)
      .maybeSingle();
    hasReportedPost.value = !!report;
  }

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

// Загрузка комментариев с пагинацией и проверкой жалоб
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
        communities:subscribers(community:communities_id(id, name, patent))
      ),
      images:comment_images(*)
    `,
    )
    .eq("post_id", postId)
    .order("likes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + commentsLimit - 1);
  if (error) throw error;

  if (data) {
    let likedSet = new Set<number>();
    let reportedSet = new Set<number>();
    if (isAuthenticated.value && userId.value) {
      const commentIds = data.map((c) => c.id);
      if (commentIds.length) {
        const { data: likes } = await supabase
          .from("like_to_comment")
          .select("comment_id")
          .eq("user_id", userId.value)
          .in("comment_id", commentIds);
        likedSet = new Set(likes?.map((l) => l.comment_id) || []);

        const { data: reports } = await supabase
          .from("reports")
          .select("target_id")
          .eq("target_type", "comment")
          .eq("reporter_id", userId.value)
          .in("target_id", commentIds);
        reportedSet = new Set(reports?.map((r) => r.target_id) || []);
      }
    }

    const enriched = data.map((c) => ({
      ...c,
      likes_count: c.likes_count || 0, // используем поле из таблицы
      liked: likedSet.has(c.id),
      reported: reportedSet.has(c.id),
      images: c.images || [],
    }));

    comments.value = [...comments.value, ...enriched];
    commentsOffset.value = offset + enriched.length;
    hasMoreComments.value = enriched.length === commentsLimit;
    buildCommentTree();
  }
};

function sortComments(commentsArray: any[]) {
  return commentsArray.sort((a, b) => {
    if (a.likes_count !== b.likes_count) {
      return b.likes_count - a.likes_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

const loadMoreComments = () => {
  if (post.value) {
    loadComments(post.value.id, commentsOffset.value);
  }
};

// Real-time подписка на новые комментарии
let subscription: any;
onMounted(() => {
  const id = route.params.id;
  const idStr = !id ? null : Array.isArray(id) ? id[0] : id;
  const numericId = idStr ? parseInt(idStr, 10) : -1;
  if (isNaN(numericId) || numericId <= 0) {
    console.error("Invalid post ID for realtime subscription");
    return;
  }

  subscription = supabase
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
          let reported = false;
          if (isAuthenticated.value && userId.value) {
            const { data: like } = await supabase
              .from("like_to_comment")
              .select("comment_id")
              .eq("comment_id", newComment.id)
              .eq("user_id", userId.value)
              .maybeSingle();
            liked = !!like;
            const { data: report } = await supabase
              .from("reports")
              .select("id")
              .eq("target_type", "comment")
              .eq("target_id", newComment.id)
              .eq("reporter_id", userId.value)
              .maybeSingle();
            reported = !!report;
          }
          const enriched = {
            ...newComment,
            likes_count: newComment.likes?.[0]?.count || 0,
            liked,
            reported,
            images: newComment.images || [],
          };
          comments.value.push(enriched);
          sortComments(comments.value);
          totalComments.value++;
          buildCommentTree();
        }
      },
    )
    .subscribe();
});

onUnmounted(() => {
  if (subscription) subscription.unsubscribe();
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
    post.value = { ...post.value };
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

// Открыть модалку жалобы
function openReportModal(type: "post" | "comment" | "user", id: number) {
  reportModalTarget.value = { type, id };
}

// Жалоба на комментарий (вызывается из CommentItem)
function reportComment(comment: any) {
  openReportModal("comment", comment.id);
}

// После отправки жалобы обновляем состояние
function handleReportSubmitted() {
  if (!reportModalTarget.value) return;
  const { type, id } = reportModalTarget.value;
  if (type === "post") {
    hasReportedPost.value = true;
  } else if (type === "comment") {
    // Найти комментарий в дереве и отметить reported = true
    const markReported = (list: any[]) => {
      for (const c of list) {
        if (c.id === id) {
          c.reported = true;
          return true;
        }
        if (c.children && markReported(c.children)) return true;
      }
      return false;
    };
    markReported(commentTree.value);
    commentTree.value = [...commentTree.value]; // триггер реактивности
  }
  reportModalTarget.value = null;
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
            :disabled="!isAuthenticated"
            class="flex items-center gap-1 hover:text-blue-600"
            @click="toggleLike"
          >
            <HeartIcon
              :class="[isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400']"
              class="w-5 h-5"
            />
            <span>{{ post.rating }}</span>
          </button>
          <button
            :disabled="!isAuthenticated"
            class="flex items-center gap-1 hover:text-yellow-500"
            @click="toggleFavoritePost"
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
          <!-- Кнопка жалобы на пост -->
          <button
            :disabled="!isAuthenticated || hasReportedPost"
            class="flex items-center gap-1 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :title="
              hasReportedPost
                ? 'Вы уже отправили жалобу'
                : 'Пожаловаться на пост'
            "
            @click="openReportModal('post', post.id)"
          >
            <FlagIcon
              :class="[
                hasReportedPost ? 'text-red-500 fill-red-500' : 'text-gray-400',
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
          @click="openImageViewer(postImages, index as number)"
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
          class="mb-6"
          @comment-added="handleNewComment"
          @cancel="cancelReply"
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
            @report="reportComment"
            @open-image="openImageViewer"
          />
        </div>

        <!-- Кнопка загрузить ещё -->
        <div v-if="hasMoreComments" class="text-center mt-4">
          <button
            class="text-blue-600 hover:underline"
            @click="loadMoreComments"
          >
            Загрузить ещё
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно жалобы -->
    <ReportModal
      v-if="reportModalTarget"
      :is-open="true"
      :target-type="reportModalTarget.type"
      :target-id="reportModalTarget.id"
      @close="reportModalTarget = null"
      @submitted="handleReportSubmitted"
    />

    <!-- Просмотрщик изображений -->
    <ImageViewer
      v-if="showViewer"
      :images="viewerImages"
      :initial-index="viewerIndex"
      @close="showViewer = false"
    />
  </div>
</template>
