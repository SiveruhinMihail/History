<template>
  <div class="space-y-4">
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="border rounded p-4"
    >
      <!-- Шапка комментария -->
      <div class="flex items-start gap-2 mb-2">
        <img
          v-if="comment.user?.avatar"
          :src="comment.user.avatar"
          class="w-8 h-8 rounded-full object-cover"
        />
        <div class="flex-1">
          <NuxtLink
            :to="`/user/${comment.user?.username}`"
            class="font-semibold hover:text-blue-600"
          >
            {{ comment.user?.use || comment.user?.username }}
          </NuxtLink>
          <span class="text-xs text-gray-500 ml-2">{{
            formatDate(comment.created_at)
          }}</span>
        </div>
        <button
          v-if="isAuthenticated"
          @click="toggleLike(comment)"
          class="flex items-center gap-1 text-sm"
          :title="comment.isLiked ? 'Убрать лайк' : 'Лайк'"
        >
          <HeartIcon
            :class="
              comment.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'
            "
            class="w-4 h-4"
          />
          <span>{{ comment.like }}</span>
        </button>
      </div>

      <!-- Текст комментария -->
      <p class="text-gray-800 mb-2">{{ comment.text }}</p>

      <!-- Кнопка ответа -->
      <button
        v-if="isAuthenticated"
        @click="startReply(comment)"
        class="text-sm text-blue-600 hover:underline"
      >
        Ответить
      </button>

      <!-- Форма ответа (если активна) -->
      <CommentForm
        v-if="replyingTo === comment.id"
        :post-id="postId"
        :parent-id="comment.id"
        :reply-to="comment.user?.use"
        @comment-added="handleReplyAdded"
        @cancel="replyingTo = null"
        class="mt-4 ml-6"
      />

      <!-- Вложенные комментарии -->
      <div
        v-if="comment.replies && comment.replies.length"
        class="ml-6 mt-4 space-y-4"
      >
        <CommentTree
          :comments="comment.replies"
          :post-id="postId"
          @reply="handleReply"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HeartIcon } from "@heroicons/vue/24/outline";
import { useAuth } from "~/composables/useAuth";
import CommentForm from "./CommentForm.vue";
import type { Database } from "~/types/supabase";

const supabase = useSupabaseClient<Database>();
const { isAuthenticated, userId } = useAuth();

const props = defineProps<{
  comments: any[];
  postId: number;
}>();

const emit = defineEmits<{
  (e: "reply", parentId: number): void;
}>();

const replyingTo = ref<number | null>(null);

// Добавляем состояние лайка для каждого комментария
onMounted(async () => {
  if (!isAuthenticated.value || !userId.value) return;
  // Загружаем лайки пользователя для всех комментариев в дереве
  const allCommentIds = collectCommentIds(props.comments);
  if (allCommentIds.length === 0) return;
  const { data } = await supabase
    .from("like_to_comment")
    .select("comment_id")
    .in("comment_id", allCommentIds)
    .eq("user_id", userId.value);
  if (data) {
    const likedSet = new Set(data.map((l: any) => l.comment_id));
    markLikes(props.comments, likedSet);
  }
});

function collectCommentIds(comments: any[]): number[] {
  let ids: number[] = [];
  for (const c of comments) {
    ids.push(c.id);
    if (c.replies) ids = ids.concat(collectCommentIds(c.replies));
  }
  return ids;
}

function markLikes(comments: any[], likedSet: Set<number>) {
  for (const c of comments) {
    c.isLiked = likedSet.has(c.id);
    if (c.replies) markLikes(c.replies, likedSet);
  }
}

// Лайк комментария
async function toggleLike(comment: any) {
  if (!isAuthenticated.value || !userId.value) return;
  try {
    if (comment.isLiked) {
      const { error } = await supabase
        .from("like_to_comment")
        .delete()
        .eq("comment_id", comment.id)
        .eq("user_id", userId.value);
      if (error) throw error;
      comment.isLiked = false;
      comment.like -= 1;
    } else {
      const { error } = await supabase
        .from("like_to_comment")
        .insert({ comment_id: comment.id, user_id: userId.value });
      if (error) throw error;
      comment.isLiked = true;
      comment.like += 1;
    }
  } catch (e) {
    console.error(e);
  }
}

function startReply(comment: any) {
  replyingTo.value = comment.id;
}

function handleReplyAdded(newComment: any) {
  // Добавляем ответ в дерево
  const parent = findCommentById(props.comments, newComment.parent_id);
  if (parent) {
    if (!parent.replies) parent.replies = [];
    parent.replies.push(newComment);
  }
  replyingTo.value = null;
}

function handleReply(parentId: number) {
  emit("reply", parentId);
}

function findCommentById(comments: any[], id: number): any | null {
  for (const c of comments) {
    if (c.id === id) return c;
    if (c.replies) {
      const found = findCommentById(c.replies, id);
      if (found) return found;
    }
  }
  return null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
</script>
