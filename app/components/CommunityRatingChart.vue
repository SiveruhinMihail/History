<template>
  <div class="container mx-auto px-4 py-6 max-w-5xl">
    <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
      Создать новый пост
    </h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Заголовок -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Заголовок</label
        >
        <input
          v-model="form.title"
          type="text"
          required
          class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
          placeholder="Введите заголовок поста"
        />
      </div>

      <!-- Описание и предпросмотр -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Описание (Markdown)</label
          >
          <textarea
            v-model="form.description"
            rows="10"
            class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition resize-y font-mono text-sm text-gray-900 dark:text-gray-100"
            placeholder="О чём ваш пост? Поддерживается Markdown"
          ></textarea>
        </div>
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Предпросмотр</label
          >
          <div
            class="prose prose-sm max-w-none p-4 bg-gray-50 dark:bg-gray-900 border border-primary/20 dark:border-gray-700 rounded-lg overflow-auto h-[260px] dark:prose-invert"
            v-html="renderedDescription"
          ></div>
        </div>
      </div>

      <!-- Категории с поиском и чекбоксами -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Категории</label
        >
        <div class="mb-2">
          <input
            v-model="categorySearch"
            type="text"
            class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
            placeholder="Поиск категорий..."
          />
        </div>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border border-primary/20 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
        >
          <label
            v-for="cat in filteredCategories"
            :key="cat.id"
            class="flex items-center gap-2 p-2 rounded hover:bg-primary/5 dark:hover:bg-gray-700 cursor-pointer transition text-gray-700 dark:text-gray-300"
          >
            <input
              type="checkbox"
              :value="cat.id"
              v-model="selectedCategories"
              class="rounded border-primary/30 text-accent focus:ring-accent dark:bg-gray-700 dark:border-gray-600"
            />
            <span class="text-sm">{{ cat.name }}</span>
          </label>
        </div>
        <p
          v-if="!filteredCategories.length"
          class="text-sm text-gray-500 dark:text-gray-400 mt-2"
        >
          Ничего не найдено
        </p>
      </div>

      <!-- Загрузка изображений -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Изображения</label
        >
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="triggerFileSelect"
            class="px-4 py-2 border border-primary/30 dark:border-gray-600 rounded-lg text-primary dark:text-accent-400 hover:bg-primary/5 dark:hover:bg-gray-800 transition flex items-center gap-2"
          >
            <PhotoIcon class="w-5 h-5" />
            Выбрать файлы
          </button>
          <span
            v-if="selectedImages.length"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ selectedImages.length }}
            {{ pluralize("файл", selectedImages.length) }}
          </span>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          class="hidden"
          @change="onFileSelected"
        />

        <!-- Превью изображений (оптимизированные превью не требуются, т.к. это локальные файлы) -->
        <div
          v-if="imagePreviews.length"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3"
        >
          <div
            v-for="(preview, idx) in imagePreviews"
            :key="idx"
            class="relative group aspect-square"
          >
            <img
              :src="preview"
              class="w-full h-full object-cover rounded-lg border border-primary/20 dark:border-gray-700"
              alt=""
              loading="lazy"
            />
            <button
              @click="removeImage(idx)"
              class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-sm opacity-0 group-hover:opacity-100 transition"
              title="Удалить"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <div
        class="flex justify-end gap-3 pt-4 border-t border-primary/10 dark:border-gray-700"
      >
        <button
          type="button"
          @click="cancel"
          class="px-5 py-2 border border-primary/30 dark:border-gray-600 rounded-lg text-primary dark:text-accent-400 hover:bg-primary/5 dark:hover:bg-gray-800 transition"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="
            submitting ||
            !form.title ||
            !form.description ||
            !selectedCategories.length
          "
          class="px-5 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? "Публикация..." : "Опубликовать" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { PhotoIcon } from "@heroicons/vue/24/outline";
import MarkdownIt from "markdown-it";
import type { Database } from "~/types/supabase";
import { useCategories } from "~/composables/useCategories"; // новый composable

const supabase = useSupabaseClient<Database>();
const { userId, isAuthenticated } = useAuth();
const { uploadFile, getPublicUrl } = useStorage();
const { loadCategories } = useCategories(); // кэшированный загрузчик категорий

const md = new MarkdownIt();

const form = ref({
  title: "",
  description: "",
});

const categorySearch = ref("");
const allCategories = ref<{ id: number; name: string | null }[]>([]);
const selectedCategories = ref<number[]>([]);

const filteredCategories = computed(() => {
  const query = categorySearch.value.toLowerCase();
  return allCategories.value.filter((cat) =>
    cat.name?.toLowerCase().includes(query),
  );
});

const renderedDescription = computed(() => {
  return md.render(form.value.description || "");
});

// Загрузка категорий с кэшированием
onMounted(async () => {
  allCategories.value = await loadCategories();
});

// Изображения
const selectedImages = ref<File[]>([]);
const imagePreviews = ref<string[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const submitting = ref(false);

function triggerFileSelect() {
  fileInput.value?.click();
}

function onFileSelected(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;
  const newFiles = Array.from(files);
  selectedImages.value = [...selectedImages.value, ...newFiles];
  newFiles.forEach((file) => {
    const url = URL.createObjectURL(file);
    imagePreviews.value.push(url);
  });
  (event.target as HTMLInputElement).value = "";
}

function removeImage(index: number) {
  const url = imagePreviews.value[index];
  if (url) URL.revokeObjectURL(url);
  imagePreviews.value.splice(index, 1);
  selectedImages.value.splice(index, 1);
}

function pluralize(word: string, count: number) {
  return word + (count % 10 === 1 && count % 100 !== 11 ? "" : "ов");
}

async function handleSubmit() {
  if (!isAuthenticated.value || !userId.value) {
    alert("Необходимо авторизоваться");
    return;
  }

  submitting.value = true;

  try {
    // 1. Создаём пост
    const { data: post, error: postError } = await supabase
      .from("post")
      .insert({
        author_id: userId.value,
        title: form.value.title,
        description: form.value.description,
        status: "published",
        moderation_status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (postError) throw postError;

    // 2. Загружаем изображения
    const imageUrls: string[] = [];
    if (selectedImages.value.length) {
      for (const file of selectedImages.value) {
        const uploadResult = await uploadFile(
          "posts",
          file,
          post.id.toString(),
          { upsert: false, optimize: true },
        );
        const publicUrl = getPublicUrl("posts", uploadResult.path);
        imageUrls.push(publicUrl);
      }

      const imageRecords = imageUrls.map((url, idx) => ({
        post_id: post.id,
        url,
        sort_order: idx,
      }));
      const { error: imagesError } = await supabase
        .from("post_images")
        .insert(imageRecords);
      if (imagesError) throw imagesError;
    }

    // 3. Привязываем категории
    const categoryLinks = selectedCategories.value.map((catId) => ({
      post_id: post.id,
      category_id: catId,
    }));
    const { error: linkError } = await supabase
      .from("post_categories")
      .insert(categoryLinks);
    if (linkError) throw linkError;

    await navigateTo(`/post/${post.id}`);
  } catch (err: any) {
    console.error("Ошибка создания поста:", err);
    alert("Ошибка при создании поста: " + err.message);
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  navigateTo("/");
}

onUnmounted(() => {
  imagePreviews.value.forEach((url) => URL.revokeObjectURL(url));
});
</script>
