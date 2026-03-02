<template>
  <div class="container mx-auto px-4 py-6 max-w-6xl">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Модерация постов
      </h1>
      <NuxtLink
        to="/moderate"
        class="text-primary hover:text-accent dark:text-primary-400 dark:hover:text-accent-400 flex items-center gap-1"
        title="Вернуться в панель модерации"
      >
        <ArrowLeftIcon class="w-5 h-5" />
        <span>Назад в панель</span>
      </NuxtLink>
    </div>

    <div
      v-if="loading"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Загрузка...
    </div>

    <div
      v-else-if="pendingPosts.length === 0"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Нет постов на модерацию
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="post in pendingPosts"
        :key="post.id"
        class="bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition"
      >
        <div class="flex flex-col md:flex-row justify-between gap-4">
          <div class="flex-1">
            <!-- Заголовок поста (ссылка) -->
            <NuxtLink
              :to="`/post/${post.id}`"
              class="text-xl font-semibold text-gray-800 dark:text-gray-200 hover:text-accent dark:hover:text-accent-400 mb-2 block"
              title="Перейти к посту"
            >
              {{ post.title }}
            </NuxtLink>

            <!-- Краткое описание -->
            <p class="text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
              {{ post.description }}
            </p>

            <!-- Информация об авторе -->
            <div
              class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="font-medium">Автор:</span>
              <NuxtLink
                v-if="post.author"
                :to="`/profile/${post.author.auth_uid}`"
                class="flex items-center gap-1 hover:text-accent dark:hover:text-accent-400"
                :title="`Профиль ${post.author.use || post.author.username}`"
              >
                <img
                  :src="post.author.avatar || defaultAvatar"
                  class="w-5 h-5 rounded-full object-cover"
                  alt=""
                  @error="handleImageError"
                  loading="lazy"
                />
                <span>{{ post.author.use || post.author.username }}</span>
              </NuxtLink>
              <span v-else class="text-gray-400 dark:text-gray-500"
                >(удалён)</span
              >

              <!-- Кнопка жалобы на автора -->
              <button
                v-if="post.author"
                @click="openReportModal(post.author.id)"
                class="ml-2 p-1 text-gray-400 hover:text-primary dark:text-gray-500 dark:hover:text-accent-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Пожаловаться на автора"
              >
                <FlagIcon class="w-4 h-4" />
              </button>

              <span class="text-gray-300 dark:text-gray-600 mx-1">•</span>
              <span>{{ formatDate(post.created_at) }}</span>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="flex gap-2 items-start">
            <button
              @click="approve(post.id)"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition shadow-sm"
              title="Одобрить пост"
            >
              Одобрить
            </button>

            <!-- Если режим отклонения для этого поста активен -->
            <div v-if="rejectingId === post.id" class="flex flex-col gap-2">
              <textarea
                v-model="rejectReason"
                rows="2"
                class="w-64 px-3 py-2 bg-white dark:bg-gray-700 border border-primary/20 dark:border-gray-600 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none text-sm text-gray-900 dark:text-gray-100"
                placeholder="Причина отклонения..."
                :title="
                  rejectReason
                    ? 'Укажите причину'
                    : 'Причина отклонения (необязательно)'
                "
              ></textarea>
              <div class="flex gap-2">
                <button
                  @click="confirmReject(post.id)"
                  class="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg text-sm"
                  title="Подтвердить отклонение"
                >
                  Подтвердить
                </button>
                <button
                  @click="cancelReject"
                  class="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm"
                  title="Отмена"
                >
                  Отмена
                </button>
              </div>
            </div>

            <!-- Обычная кнопка "Отклонить" -->
            <button
              v-else
              @click="startReject(post.id)"
              class="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950 rounded-lg transition"
              title="Отклонить пост"
            >
              Отклонить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка жалобы -->
    <ReportModal
      v-if="reportTarget"
      :is-open="true"
      :target-type="reportTarget.type"
      :target-id="reportTarget.id"
      @close="reportTarget = null"
      @submitted="handleReportSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { FlagIcon, ArrowLeftIcon } from "@heroicons/vue/24/outline";
import { useAuth } from "~/composables/useAuth";
import ReportModal from "~/components/ReportModal.vue";

definePageMeta({
  ssr: false, // отключаем SSR, так как это защищённая зона и не требует SEO
})

const supabase = useSupabaseClient();
const { isModerator, isAdmin } = useAuth();

const defaultAvatar =
  "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";

const pendingPosts = ref<any[]>([]);
const loading = ref(true);

// Состояние для отклонения
const rejectingId = ref<number | null>(null);
const rejectReason = ref("");

// Для жалобы
const reportTarget = ref<{ type: "user"; id: number } | null>(null);

function openReportModal(userId: number) {
  reportTarget.value = { type: "user", id: userId };
}

function handleReportSubmitted() {
  reportTarget.value = null;
}

function handleImageError(e: Event) {
  (e.target as HTMLImageElement).src = defaultAvatar;
}

async function loadPosts() {
  if (!isModerator.value && !isAdmin.value) return navigateTo("/");
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("post")
      .select(
        `
        id,
        title,
        description,
        created_at,
        moderation_status,
        author:author_id (
          id,
          use,
          username,
          avatar,
          auth_uid
        )
      `,
      )
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    pendingPosts.value = data || [];
  } catch (e) {
    console.error("Error loading pending posts:", e);
  } finally {
    loading.value = false;
  }
}

const approve = async (id: number) => {
  try {
    await $fetch("/api/moderation/approve-post", {
      method: "POST",
      body: { postId: id },
    });
    pendingPosts.value = pendingPosts.value.filter((p) => p.id !== id);
  } catch (e) {
    console.error(e);
    alert("Ошибка при одобрении");
  }
};

const startReject = (id: number) => {
  rejectingId.value = id;
  rejectReason.value = "";
};

const cancelReject = () => {
  rejectingId.value = null;
  rejectReason.value = "";
};

const confirmReject = async (id: number) => {
  try {
    await $fetch("/api/moderation/reject-post", {
      method: "POST",
      body: { postId: id, reason: rejectReason.value },
    });
    pendingPosts.value = pendingPosts.value.filter((p) => p.id !== id);
    cancelReject();
  } catch (e) {
    console.error(e);
    alert("Ошибка при отклонении");
  }
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

onMounted(loadPosts);
</script>
