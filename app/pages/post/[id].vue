<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div
      v-if="pending"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Загрузка...
    </div>
    <div
      v-else-if="!post"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Пост не найден
    </div>
    <div v-else>
      <!-- Шапка поста -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ post.title }}
        </h1>

        <div class="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div class="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <NuxtLink
              :to="`/profile/${post.author?.auth_uid}`"
              class="flex items-center gap-2 hover:text-accent dark:hover:text-accent-400 transition"
            >
              <img
                :src="getAvatarUrl(post.author?.avatar as string, 24)"
                class="w-6 h-6 rounded-full object-cover"
                alt=""
                loading="lazy"
              />
              <span class="font-medium">{{ post.author?.use || "Автор" }}</span>
            </NuxtLink>
            <span>•</span>
            <span>{{ formatDate(post.created_at) }}</span>
          </div>

          <!-- Кнопки действий -->
          <div v-if="isPostActive" class="flex items-center gap-4">
            <button
              @click="toggleLike"
              :disabled="!isAuthenticated"
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
              title="Поставить лайк"
            >
              <HeartIcon
                :class="[isLiked ? 'text-red-500 fill-red-500' : '']"
                class="w-5 h-5"
              />
              <span
                class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {{ postRating }}
              </span>
            </button>

            <button
              @click="toggleFavoritePost"
              :disabled="!isAuthenticated"
              class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition"
              :title="
                isFavoritedState ? 'Убрать из закладок' : 'Добавить в закладки'
              "
            >
              <BookmarkIcon
                :class="[
                  isFavoritedState ? 'text-yellow-500 fill-yellow-500' : '',
                ]"
                class="w-5 h-5"
              />
            </button>

            <button
              @click="openReportModal('post', post.id)"
              :disabled="!isAuthenticated || hasReportedPost"
              class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-accent-400 disabled:opacity-50"
              :title="
                hasReportedPost ? 'Вы уже отправили жалобу' : 'Пожаловаться'
              "
            >
              <FlagIcon
                :class="[hasReportedPost ? 'text-primary fill-primary' : '']"
                class="w-5 h-5"
              />
            </button>
          </div>

          <!-- Баннер для неодобренных постов -->
          <div v-else class="text-sm text-orange-600 dark:text-orange-400">
            <p v-if="post.moderation_status === 'pending'">
              Пост на проверке. Взаимодействие недоступно.
            </p>
            <div v-else-if="post.moderation_status === 'rejected'">
              <p>Пост отклонён модератором.</p>
              <p
                v-if="post.moderation_comment"
                class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-300"
              >
                {{ post.moderation_comment }}
              </p>
            </div>
          </div>
        </div>

        <!-- Категории -->
        <div v-if="postCategories.length" class="flex flex-wrap gap-2 mt-4">
          <NuxtLink
            v-for="cat in postCategories"
            :key="cat.id"
            :to="`/categories/${cat.slug}`"
            class="px-3 py-1 bg-accent/20 dark:bg-accent/30 text-accent-dark dark:text-accent-400 rounded-full text-sm hover:bg-accent/30 dark:hover:bg-accent/40 transition"
          >
            {{ cat.name }}
          </NuxtLink>
        </div>
      </div>

      <!-- Галерея изображений -->
      <div v-if="post.post_images?.length" class="mb-8">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div
            v-for="(img, index) in post.post_images"
            :key="index"
            class="aspect-square bg-primary/5 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
            @click="openImageViewer(postImages, index)"
          >
            <img
              :src="getOptimizedImageUrl(img.url, 400, 400)"
              class="w-full h-full object-cover"
              alt=""
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <!-- Описание поста -->
      <div
        class="prose prose-lg max-w-none dark:prose-invert mb-8"
        v-html="renderedDescription"
      ></div>

      <!-- Комментарии -->
      <div
        class="border-t border-primary/10 dark:border-gray-700 pt-6"
        id="comments"
      >
        <h2
          class="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"
        >
          <ChatBubbleLeftIcon
            class="w-6 h-6 text-primary dark:text-accent-400"
          />
          Комментарии ({{ totalComments }})
        </h2>

        <!-- Форма комментария -->
        <CommentForm
          v-if="isAuthenticated && isPostActive"
          :post-id="post.id"
          :parent-id="replyToCommentId"
          :reply-to="replyToUsername"
          @comment-added="handleNewComment"
          @cancel="cancelReply"
          class="mb-6"
        />
        <div
          v-else-if="!isAuthenticated && isPostActive"
          class="mb-6 text-center text-gray-500 dark:text-gray-400"
        >
          <NuxtLink
            to="/auth/login"
            class="text-accent hover:underline dark:text-accent-400"
            >Войдите</NuxtLink
          >, чтобы оставить комментарий.
        </div>

        <!-- Список комментариев с v-memo -->
        <div
          v-if="commentTree.length === 0"
          class="text-gray-500 dark:text-gray-400 text-center py-4"
        >
          Пока нет комментариев. Будьте первым!
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="comment in commentTree"
            :key="comment.id"
            v-memo="[
              comment.likes_count,
              comment.liked,
              comment.reported,
              comment.children?.length,
            ]"
          >
            <CommentItem
              :comment="comment"
              :is-authenticated="isAuthenticated"
              :interactive="isPostActive"
              @like="toggleCommentLike"
              @reply="startReply"
              @report="reportComment"
              @open-image="openImageViewer"
            />
          </div>
        </div>

        <!-- Кнопка загрузить ещё комментарии -->
        <div v-if="hasMoreComments" class="text-center mt-4">
          <button
            @click="loadMoreComments"
            class="text-accent hover:underline dark:text-accent-400"
          >
            Загрузить ещё комментарии
          </button>
        </div>
      </div>
    </div>

    <!-- Модальные окна -->
    <ReportModal
      v-if="reportModalTarget"
      :is-open="true"
      :target-type="reportModalTarget.type"
      :target-id="reportModalTarget.id"
      @close="reportModalTarget = null"
      @submitted="handleReportSubmitted"
    />
    <ImageViewer
      v-if="showViewer"
      :images="viewerImages"
      :initial-index="viewerIndex"
      @close="showViewer = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import {
  HeartIcon,
  BookmarkIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/vue/24/outline";
import type { Database } from "~/types/supabase";
import MarkdownIt from "markdown-it";
import CommentForm from "~/components/CommentForm.vue";
import CommentItem from "~/components/CommentItem.vue";
import ImageViewer from "~/components/ImageViewer.vue";
import ReportModal from "~/components/ReportModal.vue";
import { useReactionState } from "~/composables/useReactionState";
import { useFavorites } from "~/composables/useFavorites";
import { getOptimizedImageUrl, getAvatarUrl } from "~/utils/image";

const supabase = useSupabaseClient<Database>();
const route = useRoute();
const { isAuthenticated, userId } = useAuth();
const { isFavorite } = useFavorites();

const {
  getLikeState,
  isFavorited,
  toggleLike: globalToggleLike,
  toggleFavorite: globalToggleFavorite,
  initPostReactions,
} = useReactionState();

const md = new MarkdownIt();

// Загрузка поста с кэшированием
const {
  data: post,
  refresh,
  pending,
} = useAsyncData(
  `post-${route.params.id}`,
  async () => {
    const id = route.params.id;
    const numericId = typeof id === "string" ? parseInt(id, 10) : -1;
    if (isNaN(numericId)) return null;

    const { data, error } = await supabase
      .from("post")
      .select(
        "*, author:user!author_id(*), post_images (*), likes:like_to_post(count)",
      )
      .eq("id", numericId)
      .single();
    if (error) throw error;
    return data;
  },
  {
    default: () => null,
  },
);

const comments = ref<any[]>([]);
const totalComments = ref(0);
const replyToCommentId = ref<number | null>(null);
const replyToUsername = ref<string | null>(null);
const hasReportedPost = ref(false);
const postCategories = ref<any[]>([]);

const reportModalTarget = ref<{
  type: "post" | "comment" | "user";
  id: number;
} | null>(null);
const viewerImages = ref<string[]>([]);
const viewerIndex = ref(0);
const showViewer = ref(false);

const postImages = computed(
  () => post.value?.post_images?.map((img: any) => img.url) || [],
);
const renderedDescription = computed(() =>
  md.render(post.value?.description || ""),
);

const isPostActive = computed(
  () => post.value?.moderation_status === "approved",
);

const commentsLimit = 20;
const commentsOffset = ref(0);
const hasMoreComments = ref(true);
const commentTree = ref<any[]>([]);

// Вычисляемые значения из глобального состояния
const likeState = computed(() => getLikeState(post.value?.id as number));
const isLiked = computed(() => likeState.value.liked);
const postRating = computed(() => likeState.value.count);
const isFavoritedState = computed(() => isFavorited(post.value?.id as number));

// Построение дерева комментариев
function buildCommentTree() {
  const map = new Map();
  comments.value.forEach((c) => {
    map.set(c.id, { ...c, children: [] });
  });
  const roots: any[] = [];
  comments.value.forEach((c) => {
    const node = map.get(c.id);
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id).children.push(node);
    } else if (!c.parent_id) {
      roots.push(node);
    }
  });
  const sortFn = (a: any, b: any) => {
    if (a.likes_count !== b.likes_count) return b.likes_count - a.likes_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };
  roots.sort(sortFn);
  roots.forEach((r) => r.children.sort(sortFn));
  commentTree.value = roots;
}

// Загрузка категорий и инициализация после получения поста
watch(
  post,
  async () => {
    if (!post.value) return;

    const numericId = post.value.id;

    // Категории поста
    const { data: categoriesData } = await supabase
      .from("post_categories")
      .select("category_id, category:category_id(id, name, slug)")
      .eq("post_id", numericId);
    if (categoriesData) {
      postCategories.value = categoriesData.map((item) => item.category);
    }

    // Проверка жалобы на пост
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

    // Общее количество комментариев
    const { count } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", numericId);
    totalComments.value = count || 0;

    // Загрузка комментариев
    await loadComments(numericId, 0);

    // Инициализация состояния лайков и избранного
    if (isAuthenticated.value && userId.value && isPostActive.value) {
      const { data: likeData } = await supabase
        .from("like_to_post")
        .select("user_id")
        .eq("post_id", numericId)
        .eq("user_id", userId.value)
        .maybeSingle();
      const isFavoritedValue = await isFavorite(numericId);
      initPostReactions(
        numericId,
        !!likeData,
        post.value.likes?.[0]?.count || 0,
        isFavoritedValue,
      );
    }
  },
  { immediate: true },
);

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
        auth_uid, 
        communities:subscribers(
          community:communities_id(id, name, patent, rating),
          role
        )
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
    if (isAuthenticated.value && userId.value && isPostActive.value) {
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
      likes_count: c.likes_count || 0,
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

const loadMoreComments = () => {
  if (post.value) loadComments(post.value.id, commentsOffset.value);
};

// Real-time подписка
let subscription: any;
onMounted(async () => {
  const numericId = parseInt(route.params.id as string, 10);
  if (!isNaN(numericId)) {
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
              `*,
              user:user_id(
                *, 
                communities:subscribers(
                  community:communities_id(id, name, patent, rating),
                  role
                )
              ),
              likes:like_to_comment(count),
              images:comment_images(*)`,
            )
            .eq("id", payload.new.id)
            .single();

          if (newComment) {
            let liked = false;
            let reported = false;
            if (isAuthenticated.value && userId.value && isPostActive.value) {
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
            totalComments.value++;
            buildCommentTree();
          }
        },
      )
      .subscribe();
  }
});

onUnmounted(() => {
  if (subscription) subscription.unsubscribe();
});

function handleNewComment(comment: any) {
  comments.value.push(comment);
  totalComments.value++;
  buildCommentTree();
  replyToCommentId.value = null;
  replyToUsername.value = null;
}

async function toggleLike() {
  if (!post.value) return;
  try {
    await globalToggleLike(post.value.id);
    refresh(); // обновить данные поста в фоне
  } catch (e) {
    console.error(e);
  }
}

async function toggleFavoritePost() {
  if (!post.value) return;
  try {
    await globalToggleFavorite(post.value.id);
  } catch (e) {
    console.error(e);
  }
}

async function toggleCommentLike(comment: any) {
  if (!isAuthenticated.value || !userId.value) return;
  if (!isPostActive.value) return;
  const uid = userId.value;
  const wasLiked = comment.liked;
  comment.liked = !wasLiked;
  comment.likes_count += wasLiked ? -1 : 1;
  buildCommentTree();
  try {
    if (wasLiked) {
      await supabase
        .from("like_to_comment")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", uid);
    } else {
      await supabase
        .from("like_to_comment")
        .insert({ comment_id: comment.id, user_id: uid });
    }
  } catch (e) {
    comment.liked = wasLiked;
    comment.likes_count += wasLiked ? 1 : -1;
    buildCommentTree();
    console.error(e);
  }
}

function startReply(comment: any) {
  replyToCommentId.value = comment.id;
  replyToUsername.value = comment.user?.use || "Пользователь";
}

function cancelReply() {
  replyToCommentId.value = null;
  replyToUsername.value = null;
}

function openReportModal(type: "post" | "comment" | "user", id: number) {
  reportModalTarget.value = { type, id };
}

function reportComment(comment: any) {
  openReportModal("comment", comment.id);
}

function handleReportSubmitted() {
  if (!reportModalTarget.value) return;
  const { type, id } = reportModalTarget.value;
  if (type === "post") {
    hasReportedPost.value = true;
  } else if (type === "comment") {
    const markReported = (list: any[]) => {
      for (let c of list) {
        if (c.id === id) {
          c.reported = true;
          return true;
        }
        if (c.children && markReported(c.children)) return true;
      }
      return false;
    };
    markReported(commentTree.value);
    commentTree.value = [...commentTree.value];
  }
  reportModalTarget.value = null;
}

function openImageViewer(images: string[], index: number) {
  viewerImages.value = images;
  viewerIndex.value = index;
  showViewer.value = true;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
