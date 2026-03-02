<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div
      v-if="loading"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Загрузка...
    </div>
    <div
      v-else-if="!community"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      Сообщество не найдено
    </div>
    <div v-else>
      <!-- Шапка сообщества -->
      <div class="flex items-start gap-4 mb-6">
        <img
          :src="community.avatar || defaultAvatar"
          class="w-20 h-20 rounded-full object-cover border border-primary/20 dark:border-gray-700"
          alt=""
          loading="lazy"
        />
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ community.name }}
          </h1>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <CheckBadgeIcon
              v-if="community.patent"
              class="w-6 h-6 text-accent dark:text-accent-400"
              title="Проверенное сообщество"
            />
            <span
              class="bg-primary/10 dark:bg-gray-700 text-primary dark:text-accent-400 px-3 py-1 rounded-full text-sm"
            >
              ⭐ {{ community.rating }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            v-if="canEdit"
            :to="`/communities/edit/${community.id}`"
            class="px-4 py-2 border border-primary/30 dark:border-gray-600 rounded-lg text-primary dark:text-accent-400 hover:bg-primary/5 dark:hover:bg-gray-800 transition"
          >
            Редактировать
          </NuxtLink>
          <div
            v-if="userRole === 'pending'"
            class="px-4 py-2 text-gray-500 dark:text-gray-400"
          >
            Заявка отправлена
          </div>
          <button
            v-if="!isMember && userRole !== 'pending'"
            class="px-4 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition shadow-sm"
            @click="joinCommunity"
          >
            Вступить
          </button>
          <button
            v-if="isAuthenticated && !isOwner"
            @click="openReportModal"
            :disabled="hasReportedCommunity"
            class="px-4 py-2 border border-primary/30 dark:border-gray-600 rounded-lg text-primary dark:text-accent-400 hover:bg-primary/5 dark:hover:bg-gray-800 transition flex items-center gap-2"
            :title="
              hasReportedCommunity
                ? 'Вы уже отправили жалобу'
                : 'Пожаловаться на сообщество'
            "
          >
            <FlagIcon
              :class="[
                hasReportedCommunity
                  ? 'text-primary fill-primary dark:text-accent-400'
                  : '',
              ]"
              class="w-5 h-5"
            />
            <span>Пожаловаться</span>
          </button>
        </div>
      </div>

      <!-- Вкладки -->
      <div class="border-b border-primary/10 dark:border-gray-700 mb-6">
        <button
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors',
            tab === 'about'
              ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
          ]"
          @click="tab = 'about'"
        >
          О сообществе
        </button>
        <button
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors',
            tab === 'members'
              ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
          ]"
          @click="tab = 'members'"
        >
          Участники
        </button>
        <button
          v-if="userRole === 'admin'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors',
            tab === 'requests'
              ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
          ]"
          @click="tab = 'requests'"
        >
          Заявки
        </button>
        <button
          v-if="isMember"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors',
            tab === 'chat'
              ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
          ]"
          @click="tab = 'chat'"
        >
          Чат
        </button>
        <button
          v-if="isMember"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors',
            tab === 'activity'
              ? 'text-accent border-b-2 border-accent dark:text-accent-400 dark:border-accent-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent-400',
          ]"
          @click="tab = 'activity'"
        >
          Активность
        </button>
      </div>

      <!-- Вкладка "О сообществе" -->
      <div v-if="tab === 'about'" class="prose max-w-none dark:prose-invert">
        <div
          v-if="community.renderedDescription"
          v-html="community.renderedDescription"
        />
        <p v-else class="text-gray-500 dark:text-gray-400">Нет описания.</p>
      </div>

      <!-- Вкладка "Участники" -->
      <div v-if="tab === 'members'" class="space-y-6">
        <div>
          <h3 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Администраторы
          </h3>
          <div class="space-y-2">
            <div
              v-for="m in admins"
              :key="m.user.id"
              class="flex items-center gap-3 p-3 border border-primary/10 dark:border-gray-700 rounded-lg hover:bg-primary/5 dark:hover:bg-gray-800 transition"
            >
              <img
                :src="m.user.avatar || defaultAvatar"
                class="w-8 h-8 rounded-full object-cover"
                alt=""
                loading="lazy"
              />
              <NuxtLink
                :to="`/profile/${m.user.auth_uid}`"
                class="flex-1 text-sm text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent-400 transition"
              >
                <div class="font-medium">
                  {{ m.user.use || m.user.username }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  @{{ m.user.username }}
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
        <div>
          <h3 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Участники
          </h3>
          <div class="space-y-2">
            <div
              v-for="m in members"
              :key="m.user.id"
              class="flex items-center gap-3 p-3 border border-primary/10 dark:border-gray-700 rounded-lg hover:bg-primary/5 dark:hover:bg-gray-800 transition"
            >
              <img
                :src="m.user.avatar || defaultAvatar"
                class="w-8 h-8 rounded-full object-cover"
                alt=""
                loading="lazy"
              />
              <NuxtLink
                :to="`/profile/${m.user.auth_uid}`"
                class="flex-1 text-sm text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent-400 transition"
              >
                <div class="font-medium">
                  {{ m.user.use || m.user.username }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  @{{ m.user.username }}
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка "Заявки" (только админ) -->
      <div v-if="tab === 'requests' && userRole === 'admin'" class="space-y-2">
        <h3 class="font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Заявки на вступление
        </h3>
        <div
          v-if="pendingMembers.length === 0"
          class="text-gray-500 dark:text-gray-400"
        >
          Нет новых заявок.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="m in pendingMembers"
            :key="m.user.id"
            class="flex items-center gap-3 p-3 border border-primary/10 dark:border-gray-700 rounded-lg"
          >
            <img
              :src="m.user.avatar || defaultAvatar"
              class="w-8 h-8 rounded-full object-cover"
              alt=""
              loading="lazy"
            />
            <NuxtLink
              :to="`/profile/${m.user.auth_uid}`"
              class="flex-1 text-sm text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent-400 transition"
            >
              <div class="font-medium">{{ m.user.use || m.user.username }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                @{{ m.user.username }}
              </div>
            </NuxtLink>
            <div class="flex gap-1">
              <button
                class="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-full"
                title="Одобрить"
                @click="approveMember(m.user.id)"
              >
                ✓
              </button>
              <button
                class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-full"
                title="Отклонить"
                @click="rejectMember(m.user.id)"
              >
                ✗
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка "Чат" (для участников) -->
      <div v-if="tab === 'chat' && isMember">
        <div
          ref="chatContainer"
          class="h-96 overflow-y-auto border border-primary/10 dark:border-gray-700 rounded-lg p-4 mb-3 bg-white dark:bg-gray-800"
        >
          <div v-for="msg in messages" :key="msg.id" class="mb-2">
            <span class="font-semibold text-gray-800 dark:text-white"
              >{{ msg.user.username }}:</span
            >
            <span class="text-gray-700 dark:text-gray-300">{{ msg.text }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 ml-2">{{
              formatDate(msg.created_at)
            }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newMessage"
            type="text"
            class="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg focus:border-accent focus:ring-1 focus:ring-accent outline-none transition text-gray-900 dark:text-gray-100"
            placeholder="Сообщение..."
            @keyup.enter="sendMessage"
          />
          <button
            class="px-5 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition shadow-sm"
            @click="sendMessage"
          >
            Отправить
          </button>
        </div>
      </div>

      <!-- Вкладка "Активность" (для участников) -->
      <div v-if="tab === 'activity' && isMember" key="activity">
        <div
          v-if="activityLoading"
          class="text-center py-4 text-gray-500 dark:text-gray-400"
        >
          Загрузка...
        </div>
        <div v-else>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div
              class="bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-accent dark:text-accent-400">
                {{ stats.membersCount }}
              </div>
              <div class="text-sm text-primary dark:text-accent-400">
                Участников
              </div>
            </div>
            <div
              class="bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg p-4 text-center"
            >
              <div class="text-2xl font-bold text-accent dark:text-accent-400">
                {{ stats.messagesCount }}
              </div>
              <div class="text-sm text-primary dark:text-accent-400">
                Сообщений в чате
              </div>
            </div>
          </div>
          <!-- График изменения рейтинга за 30 дней -->
          <div
            class="bg-white dark:bg-gray-800 border border-primary/10 dark:border-gray-700 rounded-lg p-4"
          >
            <h3
              class="text-lg font-semibold mb-4 text-gray-800 dark:text-white"
            >
              Изменение рейтинга за последние 30 дней
            </h3>
            <CommunityRatingChart :community="community" />
          </div>
          <div v-if="canRequest" class="mt-2">
            <button
              @click="openVerificationModal"
              class="px-3 py-1 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg text-sm"
            >
              Запросить галочку
            </button>
          </div>
          <div
            v-if="isOwner && community.patent && !hasActiveNameRequest"
            class="mt-4"
          >
            <button
              @click="openNameChangeModal"
              class="px-4 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg transition"
            >
              Запросить смену названия
            </button>
          </div>
          <div
            v-else-if="isOwner && community.patent && hasActiveNameRequest"
            class="mt-4 text-sm text-gray-500 dark:text-gray-400"
          >
            ✓ Заявка на смену названия отправлена
          </div>
          <div
            v-else-if="hasPendingRequest"
            class="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            Заявка на галочку отправлена
          </div>
        </div>
      </div>
    </div>
    <ReportModal
      v-if="reportTarget"
      :is-open="true"
      :target-type="reportTarget.type"
      :target-id="reportTarget.id"
      @close="reportTarget = null"
      @submitted="handleReportSubmitted"
    />
    <Teleport to="body">
      <div
        v-if="nameChangeModalOpen"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Запрос на смену названия
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Введите новое название для сообщества
          </p>
          <input
            v-model="newName"
            type="text"
            class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 rounded-lg mb-4 text-gray-900 dark:text-gray-100"
            placeholder="Новое название"
          />
          <div class="flex justify-end gap-2">
            <button
              @click="nameChangeModalOpen = false"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Отмена
            </button>
            <button
              @click="submitNameChange"
              class="px-4 py-2 bg-accent hover:bg-accent-dark dark:bg-accent-600 dark:hover:bg-accent-700 text-white rounded-lg"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from "vue";
import { useCommunity } from "~/composables/useCommunity";
import { useAuth } from "~/composables/useAuth";
import MarkdownIt from "markdown-it";
import { FlagIcon, CheckBadgeIcon } from "@heroicons/vue/24/outline";
import CommunityRatingChart from "~/components/CommunityRatingChart.vue";
import ReportModal from "~/components/ReportModal.vue";

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

const { userId, isAuthenticated } = useAuth();
const {
  getCommunity,
  getMembers,
  join,
  approve,
  reject,
  getMessages,
  sendMessage: sendMsg,
  canRequestVerification,
  requestVerification,
  hasActiveNameChangeRequest,
  createNameChangeRequest,
} = useCommunity();

const md = new MarkdownIt();
const defaultAvatar =
  "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";

const tab = ref((route.query.tab as string) || "about");
const community = ref<any>(null);
const admins = ref<any[]>([]);
const members = ref<any[]>([]);
const pendingMembers = ref<any[]>([]);
const userRole = ref<string | null>(null);
const loading = ref(true);
const messages = ref<any[]>([]);
const newMessage = ref("");
const chatContainer = ref<HTMLElement | null>(null);

const isOwner = computed(() => userId.value === community.value?.owner_id);
const canRequest = ref(false);
const hasPendingRequest = ref(false);

const hasReportedCommunity = ref(false);
const reportTarget = ref<{ type: "community"; id: number } | null>(null);

const hasActiveNameRequest = ref(false);
const nameChangeModalOpen = ref(false);
const newName = ref("");

async function checkNameRequest() {
  if (!community.value) return;
  const has = await hasActiveNameChangeRequest(community.value.id);
  hasActiveNameRequest.value = has;
}

function openNameChangeModal() {
  newName.value = community.value.name; // предзаполняем текущим
  nameChangeModalOpen.value = true;
}

async function submitNameChange() {
  if (!newName.value.trim()) return;
  try {
    await createNameChangeRequest(community.value.id, newName.value);
    nameChangeModalOpen.value = false;
    await checkNameRequest();
  } catch (e) {
    console.error(e);
    alert("Ошибка при отправке запроса");
  }
}

function openReportModal() {
  if (!community.value) return;
  reportTarget.value = { type: "community", id: community.value.id };
}

function handleReportSubmitted() {
  hasReportedCommunity.value = true;
  reportTarget.value = null;
}

async function checkVerificationStatus() {
  const { data } = await (supabase as any)
    .from("community_verification_requests")
    .select("id")
    .eq("community_id", community.value.id)
    .eq("status", "pending")
    .maybeSingle();
  hasPendingRequest.value = !!data;
  canRequest.value =
    (await canRequestVerification(community.value.id)) &&
    !hasPendingRequest.value;
}

function openVerificationModal() {
  if (
    confirm(
      "После получения галочки название сообщества нельзя будет изменить без повторной модерации. Продолжить?",
    )
  ) {
    requestVerification(community.value.id, community.value.name);
    // обновить статус
  }
}

// Активность
const activityLoading = ref(false);
const stats = ref({ membersCount: 0, messagesCount: 0 });

// Вычисляемые свойства
const isMember = computed(
  () => userRole.value === "admin" || userRole.value === "member",
);
const canEdit = computed(
  () =>
    userId.value === community.value?.owner_id || userRole.value === "admin",
);

// Загрузка данных сообщества
const loadData = async () => {
  const communityId = Number(route.params.id);
  if (isNaN(communityId)) return;
  try {
    const comm = await getCommunity(communityId);
    community.value = {
      ...comm,
      renderedDescription: comm.description ? md.render(comm.description) : "",
    };
    const allMembers = await getMembers(communityId);
    admins.value = allMembers.filter((m) => m.role === "admin");
    members.value = allMembers.filter((m) => m.role === "member");
    pendingMembers.value = allMembers.filter((m) => m.role === "pending");
    const currentUser = allMembers.find((m) => m.user_id === userId.value);
    userRole.value = currentUser?.role || null;
    if (isMember.value) {
      messages.value = await getMessages(communityId);
    }
    await checkVerificationStatus();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// Действия (вступление, одобрение, отклонение, отправка сообщения)
const joinCommunity = async () => {
  try {
    await join(Number(route.params.id));
    await loadData();
  } catch (e) {
    console.error(e);
    alert("Ошибка при вступлении");
  }
};

const approveMember = async (targetUserId: number) => {
  try {
    await approve(Number(route.params.id), targetUserId);
    await loadData();
  } catch (e) {
    console.error(e);
    alert("Ошибка при одобрении");
  }
};

const rejectMember = async (targetUserId: number) => {
  try {
    await reject(Number(route.params.id), targetUserId);
    await loadData();
  } catch (e) {
    console.error(e);
    alert("Ошибка при отклонении");
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !isMember.value) return;
  try {
    const msg = await sendMsg(Number(route.params.id), newMessage.value);
    messages.value.push(msg);
    newMessage.value = "";
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  } catch (e) {
    console.error(e);
    alert("Ошибка при отправке сообщения");
  }
};

// Загрузка статистики активности
async function loadActivity() {
  if (!community.value) return;
  const communityId = Number(route.params.id);
  if (isNaN(communityId)) return;
  activityLoading.value = true;
  try {
    const [membersRes, messagesRes] = await Promise.all([
      supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("communities_id", communityId)
        .in("role", ["member", "admin"]),
      supabase
        .from("community_messages")
        .select("*", { count: "exact", head: true })
        .eq("community_id", communityId),
    ]);
    stats.value = {
      membersCount: membersRes.count || 0,
      messagesCount: messagesRes.count || 0,
    };
  } catch (e) {
    console.error(e);
  } finally {
    activityLoading.value = false;
  }
}

// Форматирование даты
function formatDate(date: string) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Watchers
onMounted(loadData);

watch(tab, async (newTab) => {
  if (newTab === "activity" && isMember.value) {
    await loadActivity(); // загружаем только статистику, график сам подтянет историю
  }
});

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === "string") {
      tab.value = newTab;
    }
  },
);

watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});
</script>
