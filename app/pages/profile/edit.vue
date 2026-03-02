<template>
  <div class="container mx-auto px-4 py-6 max-w-5xl">
    <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
      Редактировать профиль
    </h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Аватар -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >Аватар</label
        >
        <AvatarUpload />
      </div>

      <!-- Имя пользователя (username) -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Имя пользователя *</label
        >
        <input
          v-model="form.username"
          type="text"
          required
          class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
          :class="{ 'border-red-500 dark:border-red-400': usernameError }"
          @blur="validateUsername"
          placeholder="your_username"
        />
        <p
          v-if="usernameError"
          class="text-xs text-red-500 dark:text-red-400 mt-1"
        >
          {{ usernameError }}
        </p>
        <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Только латиница, цифры и подчёркивание. Уникальное имя.
        </p>
      </div>

      <!-- Отображаемое имя (use) -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Отображаемое имя</label
        >
        <input
          v-model="form.use"
          type="text"
          class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
          placeholder="Имя для отображения"
        />
      </div>

      <!-- Описание (Markdown) с предпросмотром -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Описание (поддерживает Markdown)</label
        >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea
            v-model="form.description"
            rows="8"
            class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition font-mono text-sm resize-y text-gray-900 dark:text-gray-100"
            placeholder="Введите описание в Markdown..."
          ></textarea>
          <div
            class="prose prose-sm max-w-none p-4 bg-gray-50 dark:bg-gray-900 border border-primary/20 dark:border-gray-700 rounded-lg overflow-auto h-[300px] dark:prose-invert"
            v-html="renderedPreview"
          />
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
          :disabled="submitting || !!usernameError"
          class="px-5 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? "Сохранение..." : "Сохранить" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import MarkdownIt from "markdown-it";
import AvatarUpload from "~/components/AvatarUpload.vue";


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

// Загрузка текущего профиля
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
    await navigateTo(`/profile/${profile.value.auth_uid}`);
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
