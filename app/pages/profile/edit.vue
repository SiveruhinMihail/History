<!-- pages/profile/edit.vue -->
<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">Редактировать профиль</h1>

    <form @submit.prevent="handleSubmit">
      <!-- Аватар -->
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Аватар</label>
        <div class="flex items-center gap-4">
          <img
            :src="avatarPreview || profile?.avatar || '/default-avatar.png'"
            class="w-20 h-20 rounded-full object-cover"
          />
          <input
            type="file"
            accept="image/*"
            @change="handleAvatarChange"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      <!-- Имя пользователя (username) -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Имя пользователя *</label>
        <input
          v-model="form.username"
          type="text"
          required
          class="w-full border rounded p-2"
          :class="{ 'border-red-500': usernameError }"
          @blur="validateUsername"
        />
        <p v-if="usernameError" class="text-red-500 text-xs mt-1">
          {{ usernameError }}
        </p>
        <p v-else class="text-gray-500 text-xs mt-1">
          Только латиница, цифры и подчёркивание. Уникальное имя.
        </p>
      </div>

      <!-- Отображаемое имя (use) -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Отображаемое имя</label>
        <input
          v-model="form.use"
          type="text"
          class="w-full border rounded p-2"
        />
      </div>

      <!-- Описание (Markdown) -->
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1"
          >Описание (поддерживает Markdown)</label
        >
        <div class="grid grid-cols-2 gap-4">
          <textarea
            v-model="form.description"
            rows="8"
            class="w-full border rounded p-2 font-mono text-sm"
            placeholder="Введите описание в Markdown..."
          ></textarea>
          <div
            class="prose prose-sm max-w-none border rounded p-2 overflow-auto"
          >
            <div v-html="renderedPreview"></div>
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-2">
        <button
          type="button"
          @click="cancel"
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="submitting || !!usernameError"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitting ? "Сохранение..." : "Сохранить" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useUser } from "~/composables/useUser";
import { useAuth } from "~/composables/useAuth";
import { useStorage } from "~/composables/useStorage";
import MarkdownIt from "markdown-it";

definePageMeta({
  composable: "auth",
});

const { userId } = useAuth(); // числовой id
const { updateProfile, checkUsernameUnique } = useUser();
const { uploadFile, getPublicUrl } = useStorage();
const router = useRouter();
const supabase = useSupabaseClient();

const profile = ref<any>(null);
const form = ref({
  username: "",
  use: "",
  description: "",
});
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);
const usernameError = ref("");
const submitting = ref(false);
const loading = ref(true);

const md = new MarkdownIt();
const renderedPreview = computed(() => md.render(form.value.description || ""));

// Загружаем текущий профиль
const loadProfile = async () => {
  if (!userId.value) return;
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", userId.value)
    .single();
  if (error || !data) {
    return navigateTo("/profile");
  }
  profile.value = data;
  form.value.username = data.username as string;
  form.value.use = data.use || "";
  form.value.description = data.description || "";
  loading.value = false;
};

// Проверка уникальности username (исключаем текущего пользователя по auth_uid)
const validateUsername = async () => {
  if (!form.value.username) {
    usernameError.value = "Имя пользователя обязательно";
    return false;
  }
  if (form.value.username === profile.value?.username) {
    usernameError.value = "";
    return true;
  }
  // checkUsernameUnique принимает (username, excludeAuthUid?) - строку
  const isUnique = await checkUsernameUnique(
    form.value.username,
    profile.value?.auth_uid,
  );
  if (!isUnique) {
    usernameError.value = "Это имя уже занято";
    return false;
  }
  usernameError.value = "";
  return true;
};

// Обработка выбора аватара
function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

async function handleSubmit() {
  if (!userId.value || !profile.value) return;

  const isValid = await validateUsername();
  if (!isValid) return;

  submitting.value = true;

  try {
    // Обновляем поля профиля
    const updates: any = {
      username: form.value.username,
      use: form.value.use || null,
      description: form.value.description || null,
    };

    // Если загружен новый аватар
    if (avatarFile.value) {
      const uploadResult = await uploadFile(
        "avatars",
        avatarFile.value,
        userId.value.toString(),
        { upsert: true, optimize: true },
      );
      updates.avatar = getPublicUrl("avatars", uploadResult.path);
    }

    // updateProfile принимает authUid (строку)
    await updateProfile(profile.value.auth_uid, updates);

    await navigateTo("/profile");
  } catch (e: any) {
    console.error(e);
    alert("Ошибка при сохранении: " + e.message);
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  router.back();
}

onMounted(loadProfile);
</script>
