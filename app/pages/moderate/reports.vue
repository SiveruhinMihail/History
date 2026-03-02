<!-- pages/moderate/reports.vue -->
<template>
  <div class="container mx-auto px-4 py-6 max-w-6xl">
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Жалобы</h1>
      <div class="relative w-full sm:w-64">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Поиск по причине или имени..."
          class="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-primary/30 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
          @input="debouncedSearch"
        />
        <MagnifyingGlassIcon
          class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/50 dark:text-gray-500"
        />
      </div>
    </div>

    <!-- Вкладки с типами -->
    <div class="border-b border-primary/10 dark:border-gray-700 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="filterType = tab.value"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors relative',
          filterType === tab.value
            ? 'text-accent border-b-2 border-accent'
            : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
        ]"
        :title="`Показать ${tab.label.toLowerCase()}`"
      >
        {{ tab.label }}
        <span
          v-if="tab.count"
          class="absolute -top-1 -right-2 text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full"
          >{{ tab.count }}</span
        >
      </button>
    </div>

    <!-- Состояние загрузки -->
    <div
      v-if="loading"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Загрузка...
    </div>

    <!-- Нет жалоб -->
    <div
      v-else-if="filteredReports.length === 0"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Нет жалоб
    </div>

    <!-- Список жалоб -->
    <div v-else class="space-y-4">
      <div
        v-for="r in filteredReports"
        :key="r.id"
        class="bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition"
      >
        <div class="flex flex-col lg:flex-row justify-between gap-4">
          <!-- Левая часть: информация о жалобе -->
          <div class="flex-1 space-y-2">
            <div class="flex items-center gap-2 text-sm">
              <span
                class="bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-400 px-2 py-0.5 rounded"
                >{{ getTargetTypeLabel(r.target_type) }}</span
              >
              <span class="text-gray-500 dark:text-gray-400"
                >ID: {{ r.target_id }}</span
              >
            </div>

            <!-- Ссылка на объект жалобы -->
            <div class="text-gray-800 dark:text-gray-200">
              <!-- Пост -->
              <template v-if="r.target_type === 'post' && r.targetData">
                <NuxtLink
                  :to="`/post/${r.target_id}`"
                  class="font-medium hover:text-accent dark:hover:text-accent-400"
                  :title="`Перейти к посту: ${r.targetData.title}`"
                >
                  {{ r.targetData.title }}
                </NuxtLink>
              </template>
              <!-- Комментарий -->
              <template v-else-if="r.target_type === 'comment' && r.targetData">
                <NuxtLink
                  :to="`/post/${r.targetData.post_id}#comment-${r.target_id}`"
                  class="font-medium hover:text-accent dark:hover:text-accent-400"
                  :title="`Перейти к комментарию`"
                >
                  {{ r.targetData.text }}
                </NuxtLink>
              </template>
              <!-- Пользователь -->
              <template v-else-if="r.target_type === 'user' && r.targetData">
                <NuxtLink
                  :to="`/profile/${r.targetData.auth_uid}`"
                  class="font-medium hover:text-accent dark:hover:text-accent-400"
                  :title="`Профиль пользователя`"
                >
                  {{ r.targetData.use || r.targetData.username }}
                </NuxtLink>
              </template>
              <!-- Сообщество -->
              <template
                v-else-if="r.target_type === 'community' && r.targetData"
              >
                <NuxtLink
                  :to="`/communities/${r.target_id}`"
                  class="font-medium hover:text-accent dark:hover:text-accent-400 flex items-center gap-1"
                  :title="`Перейти к сообществу`"
                >
                  <img
                    :src="r.targetData.avatar || defaultAvatar"
                    class="w-5 h-5 rounded-full object-cover"
                    alt=""
                    @error="handleImageError"
                    loading="lazy"
                  />
                  {{ r.targetData.name }}
                </NuxtLink>
              </template>
              <div v-else class="text-gray-400 dark:text-gray-500 italic">
                (объект удалён)
              </div>
            </div>

            <!-- Причина -->
            <p class="text-gray-600 dark:text-gray-300">
              <span class="font-medium">Причина:</span> {{ r.reason }}
            </p>

            <!-- Информация об отправителе жалобы -->
            <div
              class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="font-medium">Отправитель:</span>
              <NuxtLink
                v-if="r.reporter"
                :to="`/profile/${r.reporter.auth_uid}`"
                class="flex items-center gap-1 hover:text-accent dark:hover:text-accent-400"
                :title="`Профиль отправителя`"
              >
                <img
                  :src="r.reporter.avatar || defaultAvatar"
                  class="w-5 h-5 rounded-full object-cover"
                  alt=""
                  @error="handleImageError"
                  loading="lazy"
                />
                <span>{{ r.reporter.use || r.reporter.username }}</span>
              </NuxtLink>
              <span v-else class="text-gray-400 dark:text-gray-500"
                >(удалён)</span
              >
            </div>

            <!-- Информация об авторе (если есть и это не жалоба на пользователя) -->
            <div
              v-if="r.author && r.target_type !== 'user'"
              class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="font-medium">Автор:</span>
              <NuxtLink
                :to="`/profile/${r.author.auth_uid}`"
                class="flex items-center gap-1 hover:text-accent dark:hover:text-accent-400"
                :title="`Профиль автора`"
              >
                <img
                  :src="r.author.avatar || defaultAvatar"
                  class="w-5 h-5 rounded-full object-cover"
                  alt=""
                  @error="handleImageError"
                  loading="lazy"
                />
                <span>{{ r.author.use || r.author.username }}</span>
              </NuxtLink>
              <span
                v-if="r.authorBanned"
                class="text-orange-600 dark:text-orange-400 ml-2 text-xs"
                >(забанен)</span
              >
            </div>
          </div>

          <!-- Правая часть: панель действий -->
          <div class="flex flex-col gap-2 min-w-[200px]">
            <!-- Группа: Действия с контентом -->
            <p
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1"
            >
              Действия с контентом
            </p>
            <!-- Удалить контент (если это пост/комментарий/сообщество) -->
            <button
              v-if="
                ['post', 'comment', 'community'].includes(
                  r.target_type as string,
                )
              "
              @click="deleteContent(r)"
              :disabled="r.processing"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 w-full text-left flex items-center gap-2"
              :title="`Удалить ${getTargetTypeLabel(r.target_type).toLowerCase()}`"
            >
              <TrashIcon class="w-5 h-5" />
              <span>Удалить {{ getTargetTypeLabel(r.target_type) }}</span>
            </button>

            <!-- Разделитель -->
            <div
              class="border-t border-primary/10 dark:border-gray-700 my-2"
            ></div>

            <!-- Группа: Действия с пользователем -->
            <p
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1"
            >
              Действия с пользователем
            </p>
            <!-- Бан автора (если автор существует и не забанен) -->
            <button
              v-if="r.author && !r.authorBanned"
              @click="banUserOnly(r.author.id)"
              :disabled="r.processing"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 w-full text-left flex items-center gap-2"
              title="Заблокировать автора"
            >
              <NoSymbolIcon class="w-5 h-5" />
              <span>Забанить автора</span>
            </button>

            <!-- Бан + удалить всё автора (если автор существует) -->
            <button
              v-if="r.author"
              @click="banUserWithContent(r.author.id)"
              :disabled="r.processing"
              class="px-4 py-2 bg-red-800 hover:bg-red-900 dark:bg-red-900 dark:hover:bg-red-800 text-white rounded-lg transition disabled:opacity-50 w-full text-left flex items-center gap-2"
              title="Заблокировать и удалить весь контент автора"
            >
              <TrashIcon class="w-5 h-5" />
              <NoSymbolIcon class="w-5 h-5" />
              <span>Бан + удалить всё</span>
            </button>

            <!-- Бан отправителя жалобы -->
            <button
              v-if="r.reporter && !r.reporterBanned"
              @click="banUserOnly(r.reporter.id)"
              :disabled="r.processing"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 w-full text-left flex items-center gap-2"
              title="Заблокировать отправителя"
            >
              <NoSymbolIcon class="w-5 h-5" />
              <span>Забанить отправителя</span>
            </button>

            <!-- Разделитель -->
            <div
              class="border-t border-primary/10 dark:border-gray-700 my-2"
            ></div>

            <!-- Группа: Решение по жалобе -->
            <p
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1"
            >
              Решение по жалобе
            </p>
            <!-- Отклонить жалобу -->
            <button
              @click="resolve(r.id)"
              :disabled="r.processing"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50 w-full text-left flex items-center gap-2"
              title="Отклонить жалобу (пометить как resolved)"
            >
              <CheckIcon class="w-5 h-5" />
              <span>Отклонить жалобу</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  MagnifyingGlassIcon,
  TrashIcon,
  NoSymbolIcon,
  CheckIcon,
} from "@heroicons/vue/24/outline";
import { useAuth } from "~/composables/useAuth";
import type { Database } from "~/types/supabase";

definePageMeta({
  ssr: false, // отключаем SSR, так как это защищённая зона и не требует SEO
})

const supabase = useSupabaseClient<Database>();
const { isModerator, isAdmin } = useAuth();
const defaultAvatar =
  "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).src = defaultAvatar;
};

type ReportWithDetails = {
  id: number;
  target_type: string | null;
  target_id: number;
  reason: string | null;
  reporter: {
    id: number;
    username: string | null;
    use: string | null;
    avatar: string | null;
    auth_uid: string;
  } | null;
  reporterBanned: boolean;
  status: string | null;
  created_at: string | null;
  processing?: boolean;
  targetData?: any;
  author?: {
    id: number;
    username: string | null;
    use: string | null;
    avatar: string | null;
    auth_uid: string;
  } | null;
  authorBanned: boolean;
};

const reports = ref<ReportWithDetails[]>([]);
const loading = ref(true);
const filterType = ref<"all" | "post" | "comment" | "user" | "community">(
  "all",
);
const searchInput = ref("");
const searchQuery = ref("");

const tabs = computed(() => [
  { label: "Все", value: "all" as const, count: reports.value.length },
  {
    label: "Посты",
    value: "post" as const,
    count: reports.value.filter((r) => r.target_type === "post").length,
  },
  {
    label: "Комментарии",
    value: "comment" as const,
    count: reports.value.filter((r) => r.target_type === "comment").length,
  },
  {
    label: "Пользователи",
    value: "user" as const,
    count: reports.value.filter((r) => r.target_type === "user").length,
  },
  {
    label: "Сообщества",
    value: "community" as const,
    count: reports.value.filter((r) => r.target_type === "community").length,
  },
]);

const filteredReports = computed(() => {
  let filtered = reports.value;
  if (filterType.value !== "all") {
    filtered = filtered.filter((r) => r.target_type === filterType.value);
  }
  const query = searchQuery.value.toLowerCase();
  if (query) {
    filtered = filtered.filter((r) => {
      const reasonMatch = r.reason?.toLowerCase().includes(query);
      const reporterName =
        r.reporter?.use?.toLowerCase().includes(query) ||
        r.reporter?.username?.toLowerCase().includes(query);
      const authorName =
        r.author?.use?.toLowerCase().includes(query) ||
        r.author?.username?.toLowerCase().includes(query);
      const targetName =
        r.target_type === "community"
          ? r.targetData?.name?.toLowerCase().includes(query)
          : false;
      return reasonMatch || reporterName || authorName || targetName;
    });
  }
  return filtered;
});

function getTargetTypeLabel(type: string | null) {
  switch (type) {
    case "post":
      return "Пост";
    case "comment":
      return "Комментарий";
    case "user":
      return "Пользователь";
    case "community":
      return "Сообщество";
    default:
      return "Объект";
  }
}

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
const debouncedSearch = debounce(() => {
  searchQuery.value = searchInput.value;
}, 300);

async function fetchUser(userId: number): Promise<{
  id: number;
  username: string | null;
  use: string | null;
  avatar: string | null;
  auth_uid: string;
} | null> {
  const { data, error } = await supabase
    .from("user")
    .select("id, username, use, avatar, auth_uid")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    use: data.use,
    avatar: data.avatar,
    auth_uid: data.auth_uid,
  };
}

async function loadReports() {
  if (!isModerator.value && !isAdmin.value) return navigateTo("/");
  loading.value = true;
  try {
    const { data: reportsData, error } = await supabase
      .from("reports")
      .select(
        "*, reporter:user!reporter_id(id, username, use, avatar, auth_uid, is_banned)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all(
      (reportsData || []).map(async (r) => {
        const report: ReportWithDetails = {
          id: r.id,
          target_type: r.target_type,
          target_id: r.target_id,
          reason: r.reason,
          reporter: r.reporter
            ? {
                id: r.reporter.id,
                username: r.reporter.username,
                use: r.reporter.use,
                avatar: r.reporter.avatar,
                auth_uid: r.reporter.auth_uid,
              }
            : null,
          reporterBanned: r.reporter?.is_banned || false,
          status: r.status,
          created_at: r.created_at,
          processing: false,
          targetData: null,
          author: null,
          authorBanned: false,
        };

        if (r.target_type === "post") {
          const { data: post } = await supabase
            .from("post")
            .select("id, title, author_id")
            .eq("id", r.target_id)
            .maybeSingle();
          report.targetData = post;
          if (post?.author_id) {
            const author = await fetchUser(post.author_id);
            report.author = author;
            const { data: authorData } = await supabase
              .from("user")
              .select("is_banned")
              .eq("id", post.author_id)
              .maybeSingle();
            report.authorBanned = authorData?.is_banned || false;
          }
        } else if (r.target_type === "comment") {
          const { data: comment } = await supabase
            .from("comments")
            .select("id, text, user_id, post_id")
            .eq("id", r.target_id)
            .maybeSingle();
          report.targetData = comment;
          if (comment?.user_id) {
            const author = await fetchUser(comment.user_id);
            report.author = author;
            const { data: authorData } = await supabase
              .from("user")
              .select("is_banned")
              .eq("id", comment.user_id)
              .maybeSingle();
            report.authorBanned = authorData?.is_banned || false;
          }
        } else if (r.target_type === "user") {
          const { data: user } = await supabase
            .from("user")
            .select("id, use, username, auth_uid")
            .eq("id", r.target_id)
            .maybeSingle();
          report.targetData = user;
          if (user) {
            report.author = {
              id: user.id,
              username: user.username,
              use: user.use,
              avatar: null,
              auth_uid: user.auth_uid,
            };
            const { data: authorData } = await supabase
              .from("user")
              .select("is_banned")
              .eq("id", r.target_id)
              .maybeSingle();
            report.authorBanned = authorData?.is_banned || false;
          }
        } else if (r.target_type === "community") {
          const { data: community } = await supabase
            .from("community")
            .select("id, name, avatar, owner_id")
            .eq("id", r.target_id)
            .maybeSingle();
          report.targetData = community;
          if (community?.owner_id) {
            const author = await fetchUser(community.owner_id);
            report.author = author;
            const { data: authorData } = await supabase
              .from("user")
              .select("is_banned")
              .eq("id", community.owner_id)
              .maybeSingle();
            report.authorBanned = authorData?.is_banned || false;
          }
        }
        return report;
      }),
    );
    reports.value = enriched;
  } catch (e) {
    console.error("Error loading reports:", e);
  } finally {
    loading.value = false;
  }
}

async function deleteContent(report: ReportWithDetails) {
  report.processing = true;
  try {
    if (report.target_type === "post") {
      await $fetch("/api/moderation/delete-post", {
        method: "POST",
        body: { postId: report.target_id },
      });
    } else if (report.target_type === "comment") {
      await $fetch("/api/moderation/delete-comment", {
        method: "POST",
        body: { commentId: report.target_id },
      });
    } else if (report.target_type === "community") {
      await $fetch("/api/moderation/delete-community", {
        method: "POST",
        body: { communityId: report.target_id },
      });
    } else {
      alert("Для этого типа используйте другие кнопки");
      return;
    }
    await $fetch("/api/moderation/resolve-report", {
      method: "POST",
      body: { reportId: report.id, status: "resolved" },
    });
    reports.value = reports.value.filter((r) => r.id !== report.id);
  } catch (e) {
    console.error(e);
    alert("Ошибка при удалении");
  } finally {
    report.processing = false;
  }
}

async function banUserOnly(userId: number) {
  try {
    await $fetch("/api/moderation/ban-user-only", {
      method: "POST",
      body: { userId },
    });
    await loadReports();
  } catch (e) {
    console.error(e);
    alert("Ошибка при бане");
  }
}

async function banUserWithContent(userId: number) {
  try {
    await $fetch("/api/moderation/ban-user-with-content", {
      method: "POST",
      body: { userId },
    });
    await loadReports();
  } catch (e) {
    console.error(e);
    alert("Ошибка при бане с удалением");
  }
}

async function resolve(reportId: number) {
  const report = reports.value.find((r) => r.id === reportId);
  if (!report) return;
  report.processing = true;
  try {
    await $fetch("/api/moderation/resolve-report", {
      method: "POST",
      body: { reportId, status: "resolved" },
    });
    reports.value = reports.value.filter((r) => r.id !== reportId);
  } catch (e) {
    console.error(e);
    alert("Ошибка");
  } finally {
    if (report) report.processing = false;
  }
}

onMounted(loadReports);
</script>
