<!-- pages/moderate/create-moderator.vue -->
<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
      Назначить модератора
    </h1>

    <!-- Шаг 1: поиск пользователя -->
    <div class="mb-6">
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >Email пользователя</label
      >
      <div class="flex gap-2">
        <input
          v-model="searchEmail"
          type="email"
          class="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
          placeholder="user@example.com"
          @keyup.enter="searchUser"
        />
        <button
          @click="searchUser"
          :disabled="searching"
          class="px-4 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-dark dark:hover:bg-accent text-white rounded-lg transition disabled:opacity-50"
          :title="
            searching ? 'Выполняется поиск...' : 'Найти пользователя по email'
          "
        >
          <span v-if="!searching">Найти</span>
          <span v-else class="flex items-center gap-2">
            <span
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></span>
            Поиск...
          </span>
        </button>
      </div>
    </div>

    <!-- Шаг 2: результат поиска (карточка пользователя) -->
    <div
      v-if="foundUser"
      class="mb-6 p-4 border border-primary/10 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <img
          :src="foundUser.avatar || defaultAvatar"
          class="w-16 h-16 rounded-full object-cover border border-primary/20 dark:border-gray-600"
          alt=""
          loading="lazy"
        />
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {{ foundUser.use || foundUser.username }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ foundUser.email }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Текущая роль:
            <span
              :class="{
                'text-green-600 dark:text-green-400':
                  foundUser.role === 'admin',
                'text-blue-600 dark:text-blue-400':
                  foundUser.role === 'moderator',
                'text-gray-600 dark:text-gray-400': foundUser.role === 'user',
              }"
            >
              {{
                foundUser.role === "admin"
                  ? "Администратор"
                  : foundUser.role === "moderator"
                    ? "Модератор"
                    : "Пользователь"
              }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Сообщение, если пользователь не найден -->
    <div
      v-else-if="searched && !foundUser"
      class="mb-6 text-center text-gray-500 dark:text-gray-400"
    >
      Пользователь с таким email не найден
    </div>

    <!-- Кнопка назначения (активна только если найден подходящий пользователь) -->
    <div
      v-if="foundUser"
      class="flex justify-end gap-3 pt-4 border-t border-primary/10 dark:border-gray-700"
    >
      <button
        type="button"
        @click="cancel"
        class="px-5 py-2 border border-primary/30 dark:border-gray-600 rounded-lg text-primary dark:text-gray-300 hover:bg-primary/5 dark:hover:bg-gray-800 transition"
        title="Отменить и вернуться"
      >
        Отмена
      </button>
      <button
        @click="assignModerator"
        :disabled="assigning || !canAssign"
        class="px-5 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50"
        :title="
          canAssign
            ? 'Назначить пользователя модератором'
            : 'Пользователь уже модератор или администратор'
        "
      >
        {{ assigning ? "Назначение..." : "Назначить модератором" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  ssr: false, // отключаем SSR, так как это защищённая зона и не требует SEO
})

const { isAdmin } = useAuth();
const supabase = useSupabaseClient();
const router = useRouter();
const defaultAvatar =
  "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";

if (!isAdmin.value) {
  navigateTo("/");
}

const searchEmail = ref("");
const searching = ref(false);
const searched = ref(false);
const foundUser = ref<any>(null);
const assigning = ref(false);

const canAssign = computed(() => {
  return (
    foundUser.value &&
    foundUser.value.role !== "admin" &&
    foundUser.value.role !== "moderator"
  );
});

async function searchUser() {
  if (!searchEmail.value) return;
  searching.value = true;
  searched.value = true;
  try {
    const { data, error } = await supabase
      .from("user")
      .select("id, use, username, email, avatar, role")
      .eq("email", searchEmail.value)
      .maybeSingle();
    if (error) throw error;
    foundUser.value = data || null;
  } catch (e) {
    console.error(e);
    alert("Ошибка при поиске пользователя");
    foundUser.value = null;
  } finally {
    searching.value = false;
  }
}

async function assignModerator() {
  if (!foundUser.value) return;
  assigning.value = true;
  try {
    await $fetch("/api/moderation/assign-moderator", {
      method: "POST",
      body: { userId: foundUser.value.id },
    });
    alert("Модератор назначен успешно");
    await navigateTo("/moderate");
  } catch (e: any) {
    console.error(e);
    alert(e.message || "Ошибка");
  } finally {
    assigning.value = false;
  }
}
function cancel() {
  router.back();
}
</script>
