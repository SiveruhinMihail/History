<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div
      v-if="loading"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Загрузка...
    </div>
    <div
      v-else-if="!profile"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Пользователь не найден
    </div>
    <div v-else>
      <!-- Шапка профиля -->
      <div class="flex items-start gap-6 mb-6">
        <img
          :src="getAvatarUrl(profile?.avatar, 96)"
          class="w-24 h-24 rounded-full object-cover border border-primary/20 dark:border-gray-700"
          alt=""
          loading="lazy"
        />
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-4 mb-2">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ profile?.use || profile?.username }}
            </h1>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm',
                {
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200':
                    status === 'Новичок',
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300':
                    status === 'Ученик',
                  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300':
                    status === 'Знаток',
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300':
                    status === 'Эксперт',
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300':
                    status === 'Мастер',
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300':
                    status === 'Гуру',
                  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300':
                    status === 'Легенда',
                },
              ]"
            >
              {{ status }}
            </span>

            <!-- Роли -->
            <span
              v-if="profile?.role === 'admin'"
              class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm"
            >
              Админ
            </span>
            <span
              v-else-if="profile?.role === 'moderator'"
              class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm"
            >
              Модератор
            </span>
          </div>

          <div
            class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400"
          >
            <span>⭐ {{ profile?.rating || 0 }}</span>
            <span>•</span>
            <span>Зарегистрирован: {{ formatDate(profile?.created_at) }}</span>
            <button
              v-if="isAuthenticated && !isOwner"
              :disabled="hasReportedUser"
              class="flex items-center gap-1 hover:text-primary disabled:opacity-50 dark:hover:text-accent-400"
              :title="
                hasReportedUser
                  ? 'Вы уже отправили жалобу'
                  : 'Пожаловаться на пользователя'
              "
              @click="openReportModal"
            >
              <FlagIcon
                :class="[
                  hasReportedUser
                    ? 'text-primary fill-primary dark:text-accent-400 dark:fill-accent-400'
                    : 'text-gray-400 dark:text-gray-500',
                ]"
                class="w-5 h-5"
              />
            </button>
          </div>

          <!-- Топ сообщества (только верифицированные) -->
          <div
            v-if="topCommunities.length"
            class="flex flex-wrap items-center gap-2 mt-3"
          >
            <span class="text-sm text-gray-500 dark:text-gray-400"
              >Топ сообщества:</span
            >
            <NuxtLink
              v-for="comm in topCommunities"
              :key="comm.id"
              :to="`/communities/${comm.id}`"
              class="flex items-center gap-1 text-xs bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent-400 px-2 py-0.5 rounded-full hover:bg-accent/20 dark:hover:bg-accent/30 transition"
            >
              <span>{{ comm.name }}</span>
              <CheckBadgeIcon class="w-3 h-3" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Вкладки -->
      <ProfileTabs
        :key="profile?.id"
        :active-tab="activeTab"
        @update:activeTab="activeTab = $event"
      />

      <div class="mt-6">
        <!-- О себе -->
        <div v-if="activeTab === 'about'">
          <div
            v-if="profile?.description"
            class="prose max-w-none dark:prose-invert"
            v-html="renderedDescription"
          />
          <p v-else class="text-gray-500 dark:text-gray-400">Нет описания.</p>
        </div>

        <!-- Посты -->
        <div v-if="activeTab === 'posts' && profile">
          <UserPosts :user-id="profile?.id" :is-owner="isOwner" />
        </div>

        <!-- Избранное -->
        <div v-if="activeTab === 'favorites'">
          <div
            v-if="favoritesLoading"
            class="text-center py-4 text-gray-500 dark:text-gray-400"
          >
            Загрузка...
          </div>
          <div
            v-else-if="favorites.length === 0"
            class="text-center py-4 text-gray-500 dark:text-gray-400"
          >
            У пользователя нет избранных постов.
          </div>
          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <PostCard
              v-for="post in favorites"
              :key="post.id"
              :post="post"
              @like="() => handleLike(post)"
              @favorite="() => handleFavorite(post)"
            />
          </div>
        </div>

        <!-- Сообщества -->
        <div v-if="activeTab === 'communities'">
          <div
            class="flex gap-4 mb-4 border-b border-primary/10 dark:border-gray-700"
          >
            <button
              @click="communitySubTab = 'admin'"
              :class="[
                'pb-2 text-sm font-medium transition-colors',
                communitySubTab === 'admin'
                  ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
              ]"
            >
              Администрируемые
            </button>
            <button
              @click="communitySubTab = 'member'"
              :class="[
                'pb-2 text-sm font-medium transition-colors',
                communitySubTab === 'member'
                  ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
              ]"
            >
              Участие
            </button>
          </div>

          <div
            v-if="communitiesLoading"
            class="text-center py-4 text-gray-500 dark:text-gray-400"
          >
            Загрузка...
          </div>
          <div v-else>
            <div v-if="communitySubTab === 'admin'">
              <div
                v-if="adminCommunities.length === 0"
                class="text-center py-4 text-gray-500 dark:text-gray-400"
              >
                Вы не администрируете ни одного сообщества.
              </div>
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <CommunityCard
                  v-for="community in adminCommunities"
                  :key="community.id"
                  :community="community"
                />
              </div>
            </div>
            <div v-if="communitySubTab === 'member'">
              <div
                v-if="memberCommunities.length === 0"
                class="text-center py-4 text-gray-500 dark:text-gray-400"
              >
                Вы не состоите ни в одном сообществе.
              </div>
              <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <CommunityCard
                  v-for="community in memberCommunities"
                  :key="community.id"
                  :community="community"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Активность -->
        <div v-if="activeTab === 'activity'">
          <div
            class="flex gap-4 mb-4 border-b border-primary/10 dark:border-gray-700"
          >
            <button
              @click="activeSubTab = 'overall'"
              :class="[
                'pb-2 text-sm font-medium transition-colors',
                activeSubTab === 'overall'
                  ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
              ]"
            >
              Общая
            </button>
            <button
              @click="activeSubTab = 'communities'"
              :class="[
                'pb-2 text-sm font-medium transition-colors',
                activeSubTab === 'communities'
                  ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
              ]"
            >
              Мои сообщества
            </button>
          </div>

          <div v-if="activeSubTab === 'overall'">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div
                class="bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-gray-800 dark:text-white">
                  {{ stats.postsCount }}
                </div>
                <div class="text-sm text-primary dark:text-accent-400">
                  Постов
                </div>
              </div>
              <div
                class="bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-gray-800 dark:text-white">
                  {{ stats.commentsCount }}
                </div>
                <div class="text-sm text-primary dark:text-accent-400">
                  Комментариев
                </div>
              </div>
              <div
                class="bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-gray-800 dark:text-white">
                  {{ stats.totalLikesReceived }}
                </div>
                <div class="text-sm text-primary dark:text-accent-400">
                  Лайков получено
                </div>
              </div>
              <div
                class="bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg p-4 text-center"
              >
                <div class="text-2xl font-bold text-gray-800 dark:text-white">
                  {{ stats.totalLikesGiven }}
                </div>
                <div class="text-sm text-primary dark:text-accent-400">
                  Лайков отдано
                </div>
              </div>
            </div>
            <div
              class="bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg p-4"
            >
              <h3
                class="text-lg font-semibold mb-4 text-gray-800 dark:text-white"
              >
                Активность за последние 30 дней
              </h3>
              <div class="h-48 sm:h-64">
                <canvas ref="chartCanvas"></canvas>
              </div>
            </div>
          </div>

          <div v-if="activeSubTab === 'communities'">
            <div
              v-if="communitiesLoading"
              class="text-center py-4 text-gray-500 dark:text-gray-400"
            >
              Загрузка...
            </div>
            <div
              v-else-if="adminCommunities.length === 0"
              class="text-center py-4 text-gray-500 dark:text-gray-400"
            >
              Вы не администрируете ни одного сообщества.
            </div>
            <div v-else class="space-y-6">
              <div
                v-for="community in adminCommunities"
                :key="community.id"
                class="border border-primary/10 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
              >
                <div class="flex items-center gap-3 mb-3">
                  <img
                    :src="community.avatar || 'https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg'"
                    class="w-10 h-10 rounded-full object-cover"
                    alt=""
                    loading="lazy"
                  />
                  <div class="flex-1">
                    <NuxtLink
                      :to="`/communities/${community.id}`"
                      class="font-medium text-gray-800 dark:text-white hover:text-accent dark:hover:text-accent-400"
                    >
                      {{ community.name }}
                    </NuxtLink>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      Администратор
                    </div>
                  </div>
                  <div
                    class="text-sm text-primary dark:text-accent-400 font-medium"
                  >
                    {{ community.rating }} ⭐
                  </div>
                </div>
                <div class="h-32 mt-2">
                  <CommunityRatingChart :community="community" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ReportModal
      v-if="profile"
      :is-open="reportModalOpen"
      target-type="user"
      :target-id="profile.id"
      @close="reportModalOpen = false"
      @submitted="handleReportSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from "vue";
import MarkdownIt from "markdown-it";
import Chart from "chart.js/auto";
import { CheckBadgeIcon, FlagIcon } from "@heroicons/vue/24/outline";
import ReportModal from "~/components/ReportModal.vue";
import UserPosts from "~/components/UserPosts.vue";
import ProfileTabs from "~/components/ProfileTabs.vue";
import PostCard from "~/components/PostCard.vue";
import CommunityCard from "~/components/CommunityCard.vue";
import CommunityRatingChart from "~/components/CommunityRatingChart.vue";
import { useReactionState } from "~/composables/useReactionState";
import { useFavorites } from "~/composables/useFavorites";
import { getAvatarUrl } from "~/utils/image";

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const { getUserFavorites, getUserStats, getUserActivityChart } = useUser();
const { getUserCommunities, getUserTopCommunities } = useCommunity();
const { userId: currentUserId, isAuthenticated } = useAuth();
const { toggleLike: globalToggleLike, toggleFavorite: globalToggleFavorite } =
  useReactionState();
const {
  toggleFavorite,
  isFavorite,
  getUserFavorites: getFavorites,
} = useFavorites();

// ==================== Основные данные ====================
const loading = ref(true);
const profile = ref<any>(null);
const activeTab = ref((route.query.tab as string) || "about");
const activeSubTab = ref<"overall" | "communities">("overall");
const communitySubTab = ref<"admin" | "member">("admin");

// Флаг загрузки профиля для предотвращения гонок
const isLoadingProfile = ref(false);

// ==================== Избранное ====================
const favorites = ref<any[]>([]);
const favoritesLoading = ref(false);

// ==================== Сообщества ====================
const userCommunities = ref<any[]>([]);
const communitiesLoading = ref(false);
const adminCommunities = computed(() =>
  userCommunities.value.filter((c) => c.role === "admin"),
);
const memberCommunities = computed(() =>
  userCommunities.value.filter((c) => c.role === "member"),
);

// ==================== Топ сообщества ====================
const topCommunities = ref<any[]>([]);
const topCommunitiesLoading = ref(false);

// ==================== Статистика и общий график ====================
const stats = ref({
  postsCount: 0,
  commentsCount: 0,
  totalLikesReceived: 0,
  totalLikesGiven: 0,
});
const chartData = ref<{
  labels: string[];
  likes: number[];
  comments: number[];
}>({
  labels: [],
  likes: [],
  comments: [],
});
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

// ==================== Жалоба на пользователя ====================
const hasReportedUser = ref(false);
const reportModalOpen = ref(false);

// ==================== Вычисляемые поля ====================
const md = new MarkdownIt();
const renderedDescription = computed(() =>
  profile.value?.description ? md.render(profile.value.description) : "",
);
const level = computed(
  () => Math.floor(Math.sqrt(profile.value?.rating || 0)) + 1,
);
const status = computed(() => {
  const rating = profile.value?.rating || 0;
  if (rating < 100) return "Новичок";
  if (rating < 500) return "Ученик";
  if (rating < 1000) return "Знаток";
  if (rating < 5000) return "Эксперт";
  if (rating < 10000) return "Мастер";
  if (rating < 50000) return "Гуру";
  return "Легенда";
});
const isOwner = computed(() => currentUserId.value === profile.value?.id);

// ==================== Форматирование даты ====================
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ==================== Загрузка данных ====================
async function loadTopCommunities(userId: number) {
  if (!userId) return;
  topCommunitiesLoading.value = true;
  try {
    const data = await getUserTopCommunities(userId, 3);
    topCommunities.value = data;
  } catch (e) {
    console.error("Error loading top communities:", e);
  } finally {
    topCommunitiesLoading.value = false;
  }
}

async function loadProfile() {
  if (isLoadingProfile.value) return;
  isLoadingProfile.value = true;

  const authUid = route.params.id as string;
  if (!authUid) {
    loading.value = false;
    isLoadingProfile.value = false;
    return;
  }
  loading.value = true;
  profile.value = null;
  userCommunities.value = [];
  favorites.value = [];
  topCommunities.value = [];
  try {
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("*")
      .eq("auth_uid", authUid)
      .single();
    if (userError || !userData) {
      console.error("User not found:", userError);
      loading.value = false;
      return;
    }
    profile.value = userData;
    await checkReportedUser();

    if (profile.value) {
      await loadTopCommunities(profile.value.id);
    }

    const [userStats, chart] = await Promise.all([
      getUserStats(userData.id),
      getUserActivityChart(userData.id),
    ]);
    stats.value = userStats;
    chartData.value = chart;

    if (activeTab.value === "favorites") await loadFavorites(userData.id);
    if (activeTab.value === "communities") await loadCommunities(userData.id);
  } catch (e) {
    console.error("Error loading profile:", e);
  } finally {
    loading.value = false;
    isLoadingProfile.value = false;
  }
}

async function loadFavorites(userId: number) {
  favoritesLoading.value = true;
  try {
    const data = await getUserFavorites(userId);
    favorites.value = await enrichFavoritesWithLikes(data);
  } catch (e) {
    console.error("Error loading favorites:", e);
    favorites.value = [];
  } finally {
    favoritesLoading.value = false;
  }
}

async function loadCommunities(userId: number) {
  if (communitiesLoading.value) return;
  communitiesLoading.value = true;
  try {
    const data = await getUserCommunities(userId);
    userCommunities.value = data;
  } catch (e) {
    console.error("Error loading communities:", e);
    userCommunities.value = [];
  } finally {
    communitiesLoading.value = false;
  }
}

async function checkReportedUser() {
  if (!isAuthenticated.value || !currentUserId.value || !profile.value) return;
  const { data } = await supabase
    .from("reports")
    .select("id")
    .eq("target_type", "user")
    .eq("target_id", profile.value.id)
    .eq("reporter_id", currentUserId.value)
    .maybeSingle();
  hasReportedUser.value = !!data;
}

// ==================== Обогащение избранного лайками ====================
async function enrichFavoritesWithLikes(posts: any[]) {
  if (!isAuthenticated.value || !currentUserId.value || !posts.length)
    return posts;
  const postIds = posts.map((p) => p.id);
  const { data: likes, error } = await supabase
    .from("like_to_post")
    .select("post_id")
    .eq("user_id", currentUserId.value)
    .in("post_id", postIds);
  if (error) {
    console.error("Error fetching likes:", error);
    return posts.map((post) => ({ ...post, isLiked: false }));
  }
  const likedSet = new Set(likes?.map((l) => l.post_id) || []);
  return posts.map((post) => ({
    ...post,
    isLiked: likedSet.has(post.id),
    isFavorited: true,
  }));
}

// ==================== Обработка действий ====================
async function handleLike(post: any) {
  if (!isAuthenticated.value || !currentUserId.value) return;
  try {
    await globalToggleLike(post.id);
  } catch (e) {
    console.error("Error toggling like:", e);
  }
}

async function handleFavorite(post: any) {
  if (!isAuthenticated.value || !currentUserId.value) return;
  try {
    await globalToggleFavorite(post.id);
    // Если убрали из избранного, удаляем из списка
    if (!(await isFavorite(post.id))) {
      favorites.value = favorites.value.filter((p) => p.id !== post.id);
    }
  } catch (e) {
    console.error("Error toggling favorite:", e);
  }
}

function openReportModal() {
  reportModalOpen.value = true;
}
function handleReportSubmitted() {
  hasReportedUser.value = true;
  reportModalOpen.value = false;
}

function renderChart() {
  if (!chartCanvas.value || chartData.value.labels.length === 0) return;
  if (chartInstance) chartInstance.destroy();
  const isDark = document.documentElement.classList.contains("dark");
  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels: chartData.value.labels,
      datasets: [
        {
          label: "Лайки полученные",
          data: chartData.value.likes,
          borderColor: "#3498db",
          backgroundColor: "rgba(52,152,219,0.1)",
          tension: 0.1,
        },
        {
          label: "Комментарии",
          data: chartData.value.comments,
          borderColor: "#8699a3",
          backgroundColor: "rgba(134,153,163,0.1)",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: isDark ? "#374151" : "#e5e7eb" },
          ticks: { color: isDark ? "#9ca3af" : "#6b7280" },
        },
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 7,
            color: isDark ? "#9ca3af" : "#6b7280",
          },
          grid: { color: isDark ? "#374151" : "#e5e7eb" },
        },
      },
      plugins: {
        legend: { labels: { color: isDark ? "#e5e7eb" : "#1f2937" } },
      },
    },
  });
}

// ==================== Watchers ====================
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId !== oldId) {
      await loadProfile();
    }
  },
  { immediate: true },
);

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === "string") {
      activeTab.value = newTab;
    }
  },
);

watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});

watch(activeTab, async (newTab) => {
  if (!profile.value) return;
  if (newTab === "favorites" && favorites.value.length === 0) {
    await loadFavorites(profile.value.id);
  }
  if (newTab === "communities" && userCommunities.value.length === 0) {
    await loadCommunities(profile.value.id);
  }
  if (newTab === "activity") {
    nextTick(() => renderChart());
    if (
      activeSubTab.value === "communities" &&
      profile.value &&
      userCommunities.value.length === 0
    ) {
      await loadCommunities(profile.value.id);
    }
  }
});

watch(activeSubTab, async (newSub) => {
  if (!profile.value) return;
  if (newSub === "communities" && userCommunities.value.length === 0) {
    await loadCommunities(profile.value.id);
  }
  if (newSub === "overall" && activeTab.value === "activity") {
    nextTick(() => renderChart());
  }
});

watch(
  chartData,
  () => {
    if (activeTab.value === "activity") {
      nextTick(() => renderChart());
    }
  },
  { deep: true },
);

// Следим за изменением темы для перерисовки графика
const colorMode = useColorMode();
watch(
  () => colorMode.value,
  () => {
    if (activeTab.value === "activity" && activeSubTab.value === "overall") {
      nextTick(() => renderChart());
    }
  },
);

// ==================== Очистка ====================
onUnmounted(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>
