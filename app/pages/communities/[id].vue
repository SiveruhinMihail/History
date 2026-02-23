<script setup lang="ts">
import { useCommunity } from "~/composables/useCommunity";
import { useAuth } from "~/composables/useAuth";
import MarkdownIt from "markdown-it";

const route = useRoute();
const {
  getCommunity,
  getMembers,
  join,
  approve,
  reject,
  getMessages,
  sendMessage: sendMsg,
} = useCommunity();
const { userId } = useAuth();

const md = new MarkdownIt();

const community = ref<any>(null);
const admins = ref<any[]>([]);
const members = ref<any[]>([]);
const pendingMembers = ref<any[]>([]);
const userRole = ref<string | null>(null);
const loading = ref(true);
const tab = ref("about");
const messages = ref<any[]>([]);
const newMessage = ref("");
const chatContainer = ref<HTMLElement | null>(null);

// Вычисляемые свойства
const isMember = computed(
  () => userRole.value === "admin" || userRole.value === "member",
);
const canEdit = computed(() => {
  return (
    userId.value === community.value?.owner_id || userRole.value === "admin"
  );
});

// Загрузка всех данных
const loadData = async () => {
  const communityId = Number(route.params.id);
  if (isNaN(communityId)) return;

  try {
    // Загружаем сообщество
    const comm = await getCommunity(communityId);
    // Добавляем отрендеренное описание
    community.value = {
      ...comm,
      renderedDescription: comm.description ? md.render(comm.description) : "",
    };

    // Загружаем участников
    const allMembers = await getMembers(communityId);
    admins.value = allMembers.filter((m) => m.role === "admin");
    members.value = allMembers.filter((m) => m.role === "member");
    pendingMembers.value = allMembers.filter((m) => m.role === "pending");

    // Определяем роль текущего пользователя
    const currentUser = allMembers.find((m) => m.user_id === userId.value);
    userRole.value = currentUser?.role || null;

    // Если участник, загружаем сообщения чата
    if (isMember.value) {
      messages.value = await getMessages(communityId);
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// Вступление в сообщество
const joinCommunity = async () => {
  try {
    await join(Number(route.params.id));
    await loadData();
  } catch (e) {
    console.error("joinCommunity error:", e);
    alert("Ошибка при вступлении: " + (e || "неизвестная ошибка"));
  }
};

// Одобрение заявки
const approveMember = async (targetUserId: number) => {
  try {
    await approve(Number(route.params.id), targetUserId);
    await loadData();
  } catch (e) {
    console.error(e);
    alert("Ошибка при одобрении");
  }
};

// Отклонение заявки
const rejectMember = async (targetUserId: number) => {
  try {
    await reject(Number(route.params.id), targetUserId);
    await loadData();
  } catch (e) {
    console.error(e);
    alert("Ошибка при отклонении");
  }
};

// Отправка сообщения
const sendMessage = async () => {
  if (!newMessage.value.trim() || !isMember.value) return;
  try {
    const msg = await sendMsg(Number(route.params.id), newMessage.value);
    messages.value.push(msg);
    newMessage.value = "";
    // Прокрутка вниз
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

// Форматирование даты
function formatDate(date: string) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Загрузка при монтировании
onMounted(loadData);
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <!-- Состояние загрузки -->
    <div v-if="loading" class="text-center py-10">Загрузка...</div>
    <div v-else-if="!community" class="text-center py-10 text-gray-500">
      Сообщество не найдено
    </div>
    <div v-else>
      <!-- Шапка сообщества -->
      <div class="flex items-start gap-4 mb-6">
        <img
          :src="community.avatar || '/default-community.png'"
          class="w-20 h-20 rounded-full object-cover"
        />
        <div class="flex-1">
          <h1 class="text-3xl font-bold">{{ community.name }}</h1>
          <div class="flex gap-2 mt-2">
            <span class="bg-gray-200 px-2 py-1 rounded text-sm">
              Рейтинг: {{ community.rating }}
            </span>
            <span
              v-if="community.patent"
              class="bg-yellow-200 px-2 py-1 rounded text-sm"
            >
              Проверенное
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Кнопка редактирования для владельца или админа -->
          <NuxtLink
            v-if="canEdit"
            :to="`/communities/edit/${community.id}`"
            class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Редактировать
          </NuxtLink>

          <!-- Статус заявки, если она в ожидании -->
          <div v-if="userRole === 'pending'" class="text-gray-500">
            Заявка отправлена
          </div>

          <!-- Кнопка вступления, если пользователь не участник и не админ -->
          <button
            v-if="!isMember && userRole !== 'pending'"
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            @click="joinCommunity"
          >
            Вступить
          </button>
        </div>
      </div>

      <!-- Вкладки -->
      <div class="border-b mb-4">
        <button
          :class="[
            'px-4 py-2',
            tab === 'about' ? 'border-b-2 border-blue-600' : '',
          ]"
          @click="tab = 'about'"
        >
          О сообществе
        </button>
        <button
          :class="[
            'px-4 py-2',
            tab === 'members' ? 'border-b-2 border-blue-600' : '',
          ]"
          @click="tab = 'members'"
        >
          Участники
        </button>
        <button
          v-if="userRole === 'admin'"
          :class="[
            'px-4 py-2',
            tab === 'requests' ? 'border-b-2 border-blue-600' : '',
          ]"
          @click="tab = 'requests'"
        >
          Заявки
        </button>
        <button
          v-if="isMember"
          :class="[
            'px-4 py-2',
            tab === 'chat' ? 'border-b-2 border-blue-600' : '',
          ]"
          @click="tab = 'chat'"
        >
          Чат
        </button>
      </div>

      <!-- Вкладка "О сообществе" (описание в Markdown) -->
      <div v-if="tab === 'about'">
        <div
          v-if="community.renderedDescription"
          class="prose max-w-none"
          v-html="community.renderedDescription"
        />
        <p v-else class="text-gray-500">Нет описания.</p>
      </div>

      <!-- Вкладка "Участники" -->
      <div v-if="tab === 'members'">
        <h3 class="font-semibold mb-2">Администраторы</h3>
        <div
          v-for="m in admins"
          :key="m.user.id"
          class="flex items-center gap-3 mb-2 p-2 border rounded hover:bg-gray-50"
        >
          <img
            :src="m.user.avatar || '/default-avatar.png'"
            class="w-8 h-8 rounded-full object-cover"
          />
          <NuxtLink
            :to="`/profile/${m.user.auth_uid}`"
            class="flex-1 hover:text-blue-600"
          >
            <div class="font-medium">{{ m.user.use || m.user.username }}</div>
            <div class="text-xs text-gray-500">@{{ m.user.username }}</div>
          </NuxtLink>
        </div>

        <h3 class="font-semibold mt-4 mb-2">Участники</h3>
        <div
          v-for="m in members"
          :key="m.user.id"
          class="flex items-center gap-3 mb-2 p-2 border rounded hover:bg-gray-50"
        >
          <img
            :src="m.user.avatar || '/default-avatar.png'"
            class="w-8 h-8 rounded-full object-cover"
          />
          <NuxtLink
            :to="`/profile/${m.user.auth_uid}`"
            class="flex-1 hover:text-blue-600"
          >
            <div class="font-medium">{{ m.user.use || m.user.username }}</div>
            <div class="text-xs text-gray-500">@{{ m.user.username }}</div>
          </NuxtLink>
        </div>

        <!-- Заявки на вступление (видны только админам) -->
      </div>

      <!-- Вкладка "Заявки" (только для админов) -->
      <div v-if="tab === 'requests' && userRole === 'admin'">
        <h3 class="font-semibold mb-2">Заявки на вступление</h3>
        <div v-if="pendingMembers.length === 0" class="text-gray-500">
          Нет новых заявок.
        </div>
        <div
          v-for="m in pendingMembers"
          :key="m.user.id"
          class="flex items-center gap-3 mb-2 p-2 border rounded"
        >
          <img
            :src="m.user.avatar || '/default-avatar.png'"
            class="w-8 h-8 rounded-full object-cover"
          />
          <NuxtLink
            :to="`/profile/${m.user.auth_uid}`"
            class="flex-1 hover:text-blue-600"
          >
            <div class="font-medium">{{ m.user.use || m.user.username }}</div>
            <div class="text-xs text-gray-500">@{{ m.user.username }}</div>
          </NuxtLink>
          <button
            class="text-green-600 hover:text-green-800"
            title="Одобрить"
            @click="approveMember(m.user.id)"
          >
            ✓
          </button>
          <button
            class="text-red-600 hover:text-red-800"
            title="Отклонить"
            @click="rejectMember(m.user.id)"
          >
            ✗
          </button>
        </div>
      </div>

      <!-- Вкладка "Чат" (доступна только участникам) -->
      <div v-if="tab === 'chat' && isMember">
        <div ref="chatContainer" class="h-96 overflow-y-auto border p-2 mb-2">
          <div v-for="msg in messages" :key="msg.id" class="mb-2">
            <span class="font-semibold">{{ msg.user.username }}:</span>
            {{ msg.text }}
            <span class="text-xs text-gray-400 ml-2">{{
              formatDate(msg.created_at)
            }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newMessage"
            class="flex-1 border p-2 rounded"
            placeholder="Сообщение..."
            @keyup.enter="sendMessage"
          />
          <button
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            @click="sendMessage"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  max-width: 100%;
}
</style>
