<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">Создать новый пост</h1>

    <FormKit
      type="form"
      :actions="false"
      @submit="handleSubmit"
      #default="{ value }"
    >
      <FormKit
        type="text"
        name="title"
        label="Заголовок"
        validation="required|length:3,255"
        placeholder="Введите заголовок поста"
      />

      <FormKit
        type="textarea"
        name="description"
        label="Описание"
        validation="required|length:10,1000"
        placeholder="О чём ваш пост?"
        rows="5"
      />

      <!-- Множественная загрузка изображений -->
      <FormKit
        type="file"
        name="images"
        label="Изображения"
        accept="image/*"
        multiple
        help="Вы можете выбрать несколько изображений"
        @change="handleImagesChange"
      />

      <!-- Предпросмотр выбранных изображений -->
      <div v-if="imagePreviews.length" class="mt-2 mb-4 flex flex-wrap gap-2">
        <div
          v-for="(preview, index) in imagePreviews"
          :key="index"
          class="relative"
        >
          <img
            :src="preview"
            class="h-20 w-20 object-cover rounded"
            alt="Preview"
          />
          <button
            type="button"
            @click="removeImage(index)"
            class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      </div>

      <FormKit
        type="select"
        name="categories"
        label="Категории"
        :options="categoryOptions"
        multiple
        validation="required|min:1"
        help="Выберите одну или несколько категорий"
      />

      <div class="flex gap-4 justify-end mt-4">
        <FormKit type="button" @click="cancel" :disabled="submitting">
          Отмена
        </FormKit>
        <FormKit type="submit" :disabled="submitting">
          {{ submitting ? "Сохранение..." : "Создать пост" }}
        </FormKit>
      </div>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/supabase";

const supabase = useSupabaseClient<Database>();
const { userId, isAuthenticated } = useAuth();
const { uploadFile, getPublicUrl } = useStorage();

const submitting = ref(false);
const selectedImages = ref<File[]>([]);
const imagePreviews = ref<string[]>([]);
const categories = ref<any[]>([]);
const categoryOptions = ref<{ label: string; value: number }[]>([]);

// Загружаем категории
onMounted(async () => {
  const { data } = await supabase.from("category").select("*").order("name");
  if (data) {
    categories.value = data;
    categoryOptions.value = data.map((c) => ({
      label: c.name ?? "",
      value: c.id,
    }));
  }
});

// Обработка выбора нескольких изображений
function handleImagesChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    selectedImages.value = [];
    imagePreviews.value = [];
    return;
  }
  // Очищаем предыдущие превью
  imagePreviews.value.forEach(URL.revokeObjectURL);

  const files = Array.from(input.files);
  selectedImages.value = files;
  imagePreviews.value = files.map((file) => URL.createObjectURL(file));
}

// Удаление изображения из списка
function removeImage(index: number) {
  // Отзываем URL
  if (imagePreviews.value[index]) {
    URL.revokeObjectURL(imagePreviews.value[index]);
  }
  selectedImages.value.splice(index, 1);
  imagePreviews.value.splice(index, 1);
}

// Отправка формы
async function handleSubmit(formData: any, node: any) {
  if (!isAuthenticated.value || !userId.value) {
    alert("Необходимо авторизоваться");
    return;
  }

  submitting.value = true;

  try {
    // 1. Создаём пост (пока без изображений)
    const { data: post, error: postError } = await supabase
      .from("post")
      .insert({
        author_id: userId.value,
        title: formData.title,
        description: formData.description,
        status: "published",
        moderation_status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (postError) throw postError;

    // 2. Загружаем изображения (если есть) в папку с ID поста
    const imageUrls: string[] = [];
    if (selectedImages.value.length > 0) {
      for (const file of selectedImages.value) {
        const uploadResult = await uploadFile(
          "posts",
          file,
          post.id.toString(), // папка = ID поста
          {
            upsert: false,
            optimize: true,
          },
        );
        const publicUrl = getPublicUrl("posts", uploadResult.path);
        imageUrls.push(publicUrl);
      }

      // Сохраняем ссылки на изображения в таблицу post_images с порядком
      const imageRecords = imageUrls.map((url, idx) => ({
        post_id: post.id,
        url: url,
        sort_order: idx,
      }));
      const { error: imagesError } = await supabase
        .from("post_images")
        .insert(imageRecords);
      if (imagesError) throw imagesError;
    }

    // 3. Привязываем категории
    const categoryIds = formData.categories as number[];
    const categoryLinks = categoryIds.map((catId) => ({
      post_id: post.id,
      category_id: catId,
    }));
    const { error: linkError } = await supabase
      .from("post_categories")
      .insert(categoryLinks);
    if (linkError) throw linkError;

    // Переходим на страницу созданного поста
    await navigateTo(`/post/${post.id}`);
  } catch (err: any) {
    console.error("Ошибка создания поста:", err);
    alert("Ошибка при создании поста: " + err.message);
    node.setErrors([err.message]);
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  navigateTo("/");
}

// Очистка URL при размонтировании
onUnmounted(() => {
  imagePreviews.value.forEach((url) => URL.revokeObjectURL(url));
});
</script>
