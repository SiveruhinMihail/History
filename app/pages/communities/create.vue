<template>
  <div class="container mx-auto px-4 py-6 max-w-5xl">
    <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
      Создать сообщество
    </h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Название -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Название сообщества</label
        >
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
          placeholder="Введите название"
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
            rows="8"
            class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition resize-y font-mono text-sm text-gray-900 dark:text-gray-100"
            placeholder="Расскажите о сообществе. Поддерживается Markdown"
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

      <!-- Аватар -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Аватар сообщества</label
        >
        <div class="flex items-center gap-4">
          <button
            type="button"
            @click="triggerFileSelect"
            class="px-4 py-2 border border-primary/30 dark:border-gray-600 rounded-lg text-primary dark:text-accent-400 hover:bg-primary/5 dark:hover:bg-gray-800 transition flex items-center gap-2"
          >
            <PhotoIcon class="w-5 h-5" />
            {{ selectedFile ? "Заменить файл" : "Выбрать файл" }}
          </button>
          <span
            v-if="selectedFile"
            class="text-sm text-gray-500 dark:text-gray-400"
            >{{ selectedFile.name }}</span
          >
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="onFileSelected"
        />

        <!-- Превью аватара -->
        <div v-if="imagePreview" class="mt-3">
          <img
            :src="imagePreview"
            class="w-24 h-24 object-cover rounded-full border border-primary/20 dark:border-gray-700"
            alt="Превью аватара"
            loading="lazy"
          />
          <button
            type="button"
            @click="removeImage"
            class="mt-2 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
          >
            Удалить
          </button>
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
          :disabled="submitting || !form.name"
          class="px-5 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? "Создание..." : "Создать сообщество" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { PhotoIcon } from "@heroicons/vue/24/outline";
import MarkdownIt from "markdown-it";
import type { Database } from "~/types/supabase";

const supabase = useSupabaseClient<Database>();
const { userId, isAuthenticated } = useAuth();
const { uploadFile, getPublicUrl } = useStorage();
const { createCommunity } = useCommunity();

const md = new MarkdownIt();

const form = ref({
  name: "",
  description: "",
});

const renderedDescription = computed(() =>
  md.render(form.value.description || ""),
);

// Загрузка аватара
const selectedFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const submitting = ref(false);

function triggerFileSelect() {
  fileInput.value?.click();
}

function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  selectedFile.value = file;
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
  imagePreview.value = URL.createObjectURL(file);
  (event.target as HTMLInputElement).value = "";
}

function removeImage() {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
    imagePreview.value = null;
  }
  selectedFile.value = null;
}

async function handleSubmit() {
  if (!isAuthenticated.value || !userId.value) {
    alert("Необходимо авторизоваться");
    return;
  }

  submitting.value = true;

  try {
    const communityData: any = {
      name: form.value.name,
      description: form.value.description,
      owner_id: userId.value,
    };

    if (selectedFile.value) {
      const uploadResult = await uploadFile(
        "avatars",
        selectedFile.value,
        `community-${Date.now()}`,
        { upsert: false, optimize: true },
      );
      const publicUrl = getPublicUrl("avatars", uploadResult.path);
      communityData.avatar = publicUrl;
    }

    const newCommunity = await createCommunity(communityData);
    await navigateTo(`/communities/${newCommunity.id}`);
  } catch (err: any) {
    console.error("Ошибка создания сообщества:", err);
    alert("Ошибка при создании сообщества: " + err.message);
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  navigateTo("/communities");
}

onUnmounted(() => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
});
</script>
