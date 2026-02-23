<script setup lang="ts">
import MarkdownIt from "markdown-it";
import Chart from "chart.js/auto";
import { FlagIcon } from "@heroicons/vue/24/outline";
import ReportModal from "~/components/ReportModal.vue";
import UserPosts from "~/components/UserPosts.vue";
import ProfileTabs from "~/components/ProfileTabs.vue";
import PostCard from "~/components/PostCard.vue";

const route = useRoute();
const supabase = useSupabaseClient();
const { getUserFavorites, getUserStats, getUserActivityChart } = useUser();
const { toggleFavorite } = useFavorites();
const { userId: currentUserId, isAuthenticated } = useAuth();

const loading = ref(true);
const profile = ref<any>(null);
const activeTab = ref("about");
const favorites = ref<any[]>([]);
const favoritesLoading = ref(false);
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

// Жалоба на пользователя
const hasReportedUser = ref(false);
const reportModalOpen = ref(false);

const md = new MarkdownIt();
const renderedDescription = computed(() => {
  return profile.value?.description ? md.render(profile.value.description) : "";
});

const level = computed(() => {
  const rating = profile.value?.rating || 0;
  return Math.floor(Math.sqrt(rating)) + 1;
});

const isOwner = computed(() => currentUserId.value === profile.value?.id);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Обогащение избранных постов информацией о лайках текущего пользователя
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

async function loadProfile() {
  const authUid = route.params.id as string;
  if (!authUid) {
    loading.value = false;
    return;
  }

  try {
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("*")
      .eq("auth_uid", authUid)
      .single();

    if (userError || !userData) {
      console.error("User not found:", userError);
      profile.value = null;
      loading.value = false;
      return;
    }

    profile.value = userData;
    await checkReportedUser();

    const [userStats, chart] = await Promise.all([
      getUserStats(userData.id),
      getUserActivityChart(userData.id),
    ]);

    stats.value = userStats;
    chartData.value = chart;

    if (activeTab.value === "favorites") {
      await loadFavorites(userData.id);
    }
  } catch (e) {
    console.error("Error loading profile:", e);
  } finally {
    loading.value = false;
  }
}

async function loadFavorites(userId: number) {
  favoritesLoading.value = true;
  try {
    const data = await getUserFavorites(userId);
    const enriched = await enrichFavoritesWithLikes(data);
    favorites.value = enriched;
  } catch (e) {
    console.error("Error loading favorites:", e);
    favorites.value = [];
  } finally {
    favoritesLoading.value = false;
  }
}

async function handleLike(post: any) {
  if (!isAuthenticated.value || !currentUserId.value) return;
  try {
    if (post.isLiked) {
      await supabase
        .from("like_to_post")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId.value);
      if (post.likes && post.likes[0]) {
        post.likes[0].count -= 1;
      }
    } else {
      await supabase
        .from("like_to_post")
        .insert({ post_id: post.id, user_id: currentUserId.value });
      if (post.likes && post.likes[0]) {
        post.likes[0].count += 1;
      } else {
        post.likes = [{ count: 1 }];
      }
    }
    post.isLiked = !post.isLiked;
    const index = favorites.value.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      favorites.value[index] = { ...post };
    }
  } catch (e) {
    console.error("Error toggling like:", e);
  }
}

async function handleFavorite(post: any) {
  if (!isAuthenticated.value || !currentUserId.value) return;
  try {
    const newState = await toggleFavorite(post.id);
    post.isFavorited = newState;
    if (!newState) {
      favorites.value = favorites.value.filter((p) => p.id !== post.id);
    } else {
      const index = favorites.value.findIndex((p) => p.id === post.id);
      if (index !== -1) {
        favorites.value[index] = { ...post };
      }
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
  if (!chartCanvas.value) return;
  if (chartData.value.labels.length === 0) return;
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels: chartData.value.labels,
      datasets: [
        {
          label: "Лайки полученные",
          data: chartData.value.likes,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
        },
        {
          label: "Комментарии",
          data: chartData.value.comments,
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 7,
            maxRotation: 0,
          },
        },
      },
    },
  });
}

watch(activeTab, (newTab) => {
  if (newTab === "favorites" && profile.value && favorites.value.length === 0) {
    loadFavorites(profile.value.id);
  }
  if (newTab === "activity") {
    nextTick(() => {
      renderChart();
    });
  }
});

watch(
  chartData,
  () => {
    if (activeTab.value === "activity") {
      nextTick(renderChart);
    }
  },
  { deep: true },
);

onMounted(loadProfile);
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div v-if="loading" class="text-center py-10">Загрузка...</div>
    <div v-else-if="!profile" class="text-center py-10 text-gray-500">
      Пользователь не найден
    </div>
    <div v-else>
      <!-- Шапка профиля -->
      <div class="flex items-start gap-6 mb-6">
        <img
          :src="profile.avatar || '/default-avatar.png'"
          class="w-24 h-24 rounded-full object-cover"
        />
        <div class="flex-1">
          <div class="flex items-center gap-4 mb-2">
            <h1 class="text-3xl font-bold">
              {{ profile.use || profile.username }}
            </h1>
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              Уровень {{ level }}
            </span>
            <span
              v-if="profile.role === 'admin'"
              class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm"
            >
              Админ
            </span>
            <span
              v-else-if="profile.role === 'moderator'"
              class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm"
            >
              Модератор
            </span>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span>Рейтинг: {{ profile.rating || 0 }}</span>
            <span>•</span>
            <span>Зарегистрирован: {{ formatDate(profile.created_at) }}</span>
            <!-- Кнопка жалобы, если это не текущий пользователь -->
            <button
              v-if="isAuthenticated && !isOwner"
              :disabled="hasReportedUser"
              class="flex items-center gap-1 hover:text-yellow-500 disabled:opacity-50"
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
                    ? 'text-red-500 fill-red-500'
                    : 'text-gray-400',
                ]"
                class="w-5 h-5"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Вкладки -->
      <ProfileTabs
        :active-tab="activeTab"
        @update:active-tab="activeTab = $event"
      />

      <div class="mt-6">
        <!-- Вкладка "О себе" -->
        <div v-if="activeTab === 'about'">
          <div
            v-if="profile.description"
            class="prose max-w-none"
            v-html="renderedDescription"
          />
          <p v-else class="text-gray-500">Нет описания.</p>
        </div>

        <!-- Вкладка "Посты" -->
        <div v-if="activeTab === 'posts'">
          <UserPosts :user-id="profile.id" :is-owner="isOwner" />
        </div>

        <!-- Вкладка "Избранное" -->
        <div v-if="activeTab === 'favorites'">
          <div v-if="favoritesLoading" class="text-center py-4">
            Загрузка...
          </div>
          <div
            v-else-if="favorites.length === 0"
            class="text-center py-4 text-gray-500"
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

        <!-- Вкладка "Активность" -->
        <div v-if="activeTab === 'activity'">
          <!-- Карточки статистики -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-4 rounded shadow text-center">
              <div class="text-2xl font-bold">{{ stats.postsCount }}</div>
              <div class="text-sm text-gray-500">Постов</div>
            </div>
            <div class="bg-white p-4 rounded shadow text-center">
              <div class="text-2xl font-bold">{{ stats.commentsCount }}</div>
              <div class="text-sm text-gray-500">Комментариев</div>
            </div>
            <div class="bg-white p-4 rounded shadow text-center">
              <div class="text-2xl font-bold">
                {{ stats.totalLikesReceived }}
              </div>
              <div class="text-sm text-gray-500">Лайков получено</div>
            </div>
            <div class="bg-white p-4 rounded shadow text-center">
              <div class="text-2xl font-bold">{{ stats.totalLikesGiven }}</div>
              <div class="text-sm text-gray-500">Лайков отдано</div>
            </div>
          </div>

          <!-- График активности -->
          <div class="bg-white p-4 rounded shadow">
            <h3 class="text-lg font-semibold mb-4">
              Активность за последние 30 дней
            </h3>
            <div class="h-64">
              <canvas ref="chartCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модалка жалобы на пользователя -->
    <ReportModal
      :is-open="reportModalOpen"
      target-type="user"
      :target-id="profile?.id"
      @close="reportModalOpen = false"
      @submitted="handleReportSubmitted"
    />
  </div>
</template>
