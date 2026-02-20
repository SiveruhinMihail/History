<template>
  <div class="mb-4">
    <div v-if="replyTo" class="text-sm text-gray-600 mb-2">
      Ответ {{ replyTo }}
      <button
        @click="$emit('cancel')"
        class="text-red-500 hover:underline ml-2"
      >
        Отмена
      </button>
    </div>
    <textarea
      v-model="text"
      rows="3"
      class="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
      :placeholder="replyTo ? 'Ваш ответ...' : 'Напишите комментарий...'"
    ></textarea>

    <!-- Выбор изображений -->
    <input
      type="file"
      accept="image/*"
      multiple
      @change="handleImagesChange"
      class="mt-2"
    />
    <div v-if="imagePreviews.length" class="flex flex-wrap gap-2 mt-2">
      <div v-for="(preview, idx) in imagePreviews" :key="idx" class="relative">
        <img :src="preview" class="h-16 w-16 object-cover rounded" />
        <button
          type="button"
          @click="removeImage(idx)"
          class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
        >
          ×
        </button>
      </div>
    </div>

    <div class="flex justify-end mt-2 gap-2">
      <button
        v-if="replyTo"
        @click="$emit('cancel')"
        class="px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Отмена
      </button>
      <button
        @click="submit"
        :disabled="!text.trim() || submitting"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ submitting ? "Отправка..." : replyTo ? "Ответить" : "Отправить" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from "~/composables/useStorage";
import type { Database } from "~/types/supabase";

const supabase = useSupabaseClient<Database>();
const { userId } = useAuth();
const { uploadFile, getPublicUrl } = useStorage();

const props = defineProps<{
  postId: number;
  parentId?: number | null;
  replyTo?: string | null;
}>();

const emit = defineEmits<{
  (e: "comment-added", comment: any): void;
  (e: "cancel"): void;
}>();

const text = ref("");
const submitting = ref(false);
const selectedImages = ref<File[]>([]);
const imagePreviews = ref<string[]>([]);

function handleImagesChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    selectedImages.value = [];
    imagePreviews.value = [];
    return;
  }
  // Очищаем предыдущие превью
  imagePreviews.value.forEach((url) => {
    if (url) URL.revokeObjectURL(url);
  });
  const files = Array.from(input.files);
  selectedImages.value = files;
  imagePreviews.value = files.map((file) => URL.createObjectURL(file));
}

function removeImage(index: number) {
  const url = imagePreviews.value[index];
  if (url) {
    URL.revokeObjectURL(url);
  }
  selectedImages.value.splice(index, 1);
  imagePreviews.value.splice(index, 1);
}

async function submit() {
  if (!text.value.trim() || !userId.value) return;
  submitting.value = true;

  try {
    // 1. Вставляем комментарий
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        post_id: props.postId,
        user_id: userId.value,
        text: text.value.trim(),
        parent_id: props.parentId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    // 2. Загружаем изображения, если есть
    const imageUrls: string[] = [];
    if (selectedImages.value.length > 0) {
      for (const file of selectedImages.value) {
        const uploadResult = await uploadFile(
          "comments",
          file,
          comment.id.toString(),
          { upsert: false, optimize: true },
        );
        const publicUrl = getPublicUrl("comments", uploadResult.path);
        imageUrls.push(publicUrl);
      }

      const imageRecords = imageUrls.map((url, idx) => ({
        comment_id: comment.id,
        url,
        sort_order: idx,
      }));
      await supabase.from("comment_images").insert(imageRecords);
    }

    // 3. Получаем полный комментарий с автором, лайками и изображениями
    const { data: fullComment, error: fetchError } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:user_id(*),
        likes:like_to_comment(count),
        images:comment_images(*)
      `,
      )
      .eq("id", comment.id)
      .single();

    if (fetchError) throw fetchError;
    if (!fullComment) throw new Error("Не удалось загрузить комментарий");

    const enriched = {
      ...fullComment,
      likes_count: fullComment.likes?.[0]?.count || 0,
      liked: false,
    };

    emit("comment-added", enriched);
    text.value = "";
    selectedImages.value = [];
    imagePreviews.value.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    imagePreviews.value = [];
  } catch (e) {
    console.error("Error submitting comment:", e);
    alert("Ошибка при отправке комментария");
  } finally {
    submitting.value = false;
  }
}
</script>
