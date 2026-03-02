<template>
  <div class="container mx-auto px-4 py-6 max-w-5xl">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">Редактировать пост</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Заголовок -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1"
          >Заголовок</label
        >
        <input
          v-model="form.title"
          type="text"
          required
          class="w-full px-4 py-2 bg-white border border-primary/20 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
          placeholder="Введите заголовок поста"
        />
      </div>

      <!-- Описание и предпросмотр -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Описание (Markdown)</label
          >
          <textarea
            v-model="form.description"
            rows="10"
            class="w-full px-4 py-2 bg-white border border-primary/20 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition resize-y font-mono text-sm"
            placeholder="О чём ваш пост? Поддерживается Markdown"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Предпросмотр</label
          >
          <div
            class="prose prose-sm max-w-none p-4 bg-gray-50 border border-primary/20 rounded-lg overflow-auto h-[300px]"
            v-html="renderedPreview"
          ></div>
        </div>
      </div>

      <!-- Категории -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >Категории</label
        >
        <div class="mb-2">
          <input
            v-model="categorySearch"
            type="text"
            class="w-full px-3 py-2 bg-white border border-primary/20 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            placeholder="Поиск категорий..."
          />
        </div>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border border-primary/20 rounded-lg bg-white"
        >
          <label
            v-for="cat in filteredCategories"
            :key="cat.id"
            class="flex items-center gap-2 p-2 rounded hover:bg-primary/5 cursor-pointer transition"
          >
            <input
              type="checkbox"
              :value="cat.id"
              v-model="selectedCategories"
              class="rounded border-primary/30 text-accent focus:ring-accent"
            />
            <span class="text-sm text-gray-700">{{ cat.name }}</span>
          </label>
        </div>
      </div>

      <!-- Изображения -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >Изображения</label
        >
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="triggerFileSelect"
            class="px-4 py-2 border border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition flex items-center gap-2"
          >
            <PhotoIcon class="w-5 h-5" />
            Выбрать файлы
          </button>
          <span v-if="selectedFiles.length" class="text-sm text-gray-500">
            {{ selectedFiles.length }} файлов
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

        <!-- Превью существующих изображений -->
        <div v-if="existingImages.length" class="mt-3">
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Текущие изображения
          </h4>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(img, idx) in existingImages"
              :key="idx"
              class="relative"
            >
              <img
                :src="img.url"
                class="w-20 h-20 object-cover rounded border border-primary/20"
                loading="lazy"
              />
              <button
                type="button"
                @click="removeExistingImage(idx)"
                class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                title="Удалить изображение"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Превью новых изображений -->
        <div v-if="newImagePreviews.length" class="mt-3">
          <h4 class="text-sm font-medium text-gray-700 mb-2">
            Новые изображения
          </h4>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(preview, idx) in newImagePreviews"
              :key="idx"
              class="relative"
            >
              <img
                :src="preview"
                loading="lazy"
                class="w-20 h-20 object-cover rounded border border-primary/20"
              />
              <button
                type="button"
                @click="removeNewImage(idx)"
                class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                title="Удалить изображение"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-3 pt-4 border-t border-primary/10">
        <button
          type="button"
          @click="cancel"
          class="px-5 py-2 border border-primary/30 rounded-lg text-primary hover:bg-primary/5 transition"
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
          class="px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition disabled:opacity-50"
        >
          {{ submitting ? "Сохранение..." : "Сохранить изменения" }}
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

const supabase = useSupabaseClient<Database>();
const route = useRoute();
const router = useRouter();
const { userId, isModerator, isAdmin } = useAuth();
const { uploadFile, getPublicUrl } = useStorage();

const md = new MarkdownIt();

const post = ref<any>(null);
const form = ref({ title: "", description: "" });

// Категории
const allCategories = ref<{ id: number; name: string | null }[]>([]);
const categorySearch = ref("");
const selectedCategories = ref<number[]>([]);
const filteredCategories = computed(() => {
  const query = categorySearch.value.toLowerCase();
  return allCategories.value.filter((cat) =>
    cat.name?.toLowerCase().includes(query),
  );
});

// Изображения (храним id и url)
const existingImages = ref<{ id: number; url: string }[]>([]);
const selectedFiles = ref<File[]>([]);
const newImagePreviews = ref<string[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const submitting = ref(false);
const renderedPreview = computed(() => md.render(form.value.description || ""));

// Загрузка данных поста и категорий
onMounted(async () => {
  const id = Number(route.params.id);
  if (isNaN(id)) return navigateTo("/404");

  const [postRes, catsRes] = await Promise.all([
    supabase.from("post").select("*, post_images(*)").eq("id", id).single(),
    supabase.from("category").select("*").order("name"),
  ]);

  if (postRes.error || !postRes.data) return navigateTo("/404");
  if (catsRes.data) allCategories.value = catsRes.data;

  const p = postRes.data;
  post.value = p;

  // Проверка прав: автор, модератор или админ
  const canEdit =
    p.author_id === userId.value || isModerator.value || isAdmin.value;
  if (!canEdit) {
    alert("У вас нет прав на редактирование этого поста");
    return navigateTo("/");
  }

  // Если пользователь не модератор/админ, то редактировать можно только отклонённые посты
  if (
    !isModerator.value &&
    !isAdmin.value &&
    p.moderation_status !== "rejected"
  ) {
    alert(
      "Этот пост нельзя редактировать (он уже опубликован или на проверке)",
    );
    return navigateTo("/");
  }

  form.value.title = p.title as string;
  form.value.description = p.description || "";
  existingImages.value = (p.post_images || []).map((img: any) => ({
    id: img.id,
    url: img.url,
  }));

  // Загрузка категорий поста
  const { data: catLinks } = await supabase
    .from("post_categories")
    .select("category_id")
    .eq("post_id", id);
  if (catLinks) {
    selectedCategories.value = catLinks.map((c) => c.category_id);
  }
});

function triggerFileSelect() {
  fileInput.value?.click();
}

function onFileSelected(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;
  const newFiles = Array.from(files);
  selectedFiles.value = [...selectedFiles.value, ...newFiles];
  newFiles.forEach((file) => {
    const url = URL.createObjectURL(file);
    newImagePreviews.value.push(url);
  });
  (event.target as HTMLInputElement).value = "";
}

function removeExistingImage(index: number) {
  existingImages.value.splice(index, 1);
}

function removeNewImage(index: number) {
  const url = newImagePreviews.value[index];
  URL.revokeObjectURL(url as string);
  newImagePreviews.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
}

async function handleSubmit() {
  if (!post.value) return;
  submitting.value = true;
  try {
    // 1. Обновляем основные поля поста и сбрасываем статус на pending
    const { error: updateError } = await supabase
      .from("post")
      .update({
        title: form.value.title,
        description: form.value.description,
        moderation_status: "pending",
      })
      .eq("id", post.value.id);
    if (updateError) throw updateError;

    // 2. Категории: удаляем старые связи и вставляем новые
    const { error: deleteCatsError } = await supabase
      .from("post_categories")
      .delete()
      .eq("post_id", post.value.id);
    if (deleteCatsError) throw deleteCatsError;

    if (selectedCategories.value.length) {
      const newLinks = selectedCategories.value.map((catId) => ({
        post_id: post.value.id,
        category_id: catId,
      }));
      const { error: insertCatsError } = await supabase
        .from("post_categories")
        .insert(newLinks);
      if (insertCatsError) throw insertCatsError;
    }

    // 3. Изображения
    const keepIds = existingImages.value.map((img) => img.id);

    if (keepIds.length > 0) {
      // Удаляем изображения, которых нет в keepIds
      await supabase
        .from("post_images")
        .delete()
        .eq("post_id", post.value.id)
        .not("id", "in", `(${keepIds.join(",")})`);
    } else {
      // Если keepIds пуст, удаляем все изображения поста
      await supabase.from("post_images").delete().eq("post_id", post.value.id);
    }

    // Загружаем новые изображения
    const newUrls: string[] = [];
    for (const file of selectedFiles.value) {
      const uploadResult = await uploadFile(
        "posts",
        file,
        post.value.id.toString(),
        { upsert: false, optimize: true },
      );
      newUrls.push(getPublicUrl("posts", uploadResult.path));
    }
    if (newUrls.length) {
      const imageRecords = newUrls.map((url, idx) => ({
        post_id: post.value.id,
        url,
        sort_order: existingImages.value.length + idx,
      }));
      const { error: insertImagesError } = await supabase
        .from("post_images")
        .insert(imageRecords);
      if (insertImagesError) throw insertImagesError;
    }

    await navigateTo(`/post/${post.value.id}`);
  } catch (e: any) {
    console.error("Ошибка сохранения:", e);
    alert("Ошибка при сохранении: " + e.message);
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  router.back();
}

// Очистка превью при размонтировании
onUnmounted(() => {
  newImagePreviews.value.forEach((url) => URL.revokeObjectURL(url));
});
</script>
