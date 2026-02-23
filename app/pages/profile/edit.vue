<script setup lang="ts">
import MarkdownIt from "markdown-it";
import AvatarUpload from "~/components/AvatarUpload.vue";

definePageMeta({
  composable: "auth",
});

const { updateProfile, checkUsernameUnique } = useUser();
const { userId, loadProfile } = useAuth();
const router = useRouter();
const supabase = useSupabaseClient();

const profile = ref<any>(null);
const form = ref({
  username: "",
  use: "",
  description: "",
});
const usernameError = ref("");
const submitting = ref(false);
const loading = ref(true);

const md = new MarkdownIt();
const renderedPreview = computed(() => md.render(form.value.description || ""));

// Загружаем текущий профиль
const loadEditProfile = async () => {
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

// Проверка уникальности username
const validateUsername = async () => {
  if (!form.value.username) {
    usernameError.value = "Имя пользователя обязательно";
    return false;
  }
  if (form.value.username === profile.value?.username) {
    usernameError.value = "";
    return true;
  }
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

async function handleSubmit() {
  if (!userId.value || !profile.value) return;

  const isValid = await validateUsername();
  if (!isValid) return;

  submitting.value = true;

  try {
    const updates: any = {
      username: form.value.username,
      use: form.value.use || null,
      description: form.value.description || null,
    };

    await updateProfile(profile.value.auth_uid, updates);
    await loadProfile(true);
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

onMounted(loadEditProfile);
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">Редактировать профиль</h1>

    <form @submit.prevent="handleSubmit">
      <!-- Аватар -->
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Аватар</label>
        <AvatarUpload />
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
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
          @click="cancel"
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
