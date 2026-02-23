<!-- components/Header.vue -->
<script setup lang="ts">
import type { Database } from "~/types/supabase";
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  BriefcaseIcon,
  PlusIcon,
  FolderIcon,
  ArrowRightStartOnRectangleIcon,
  PencilIcon,
  FlagIcon,
} from "@heroicons/vue/24/outline";
type UserRow = Database["public"]["Tables"]["user"]["Row"];
const { isAuthenticated, signOut } = useAuth();

const props = defineProps<{
  profile: UserRow | null;
  isLoading: boolean;
}>();

const isOpen = ref(false); // дропдаун профиля (десктоп)
const isMobileMenuOpen = ref(false); // бургер-меню (мобильные)
const avatarButtonRef = ref<HTMLElement | null>(null);

// Закрытие дропдауна при клике вне
const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value) return;
  const target = event.target as Node;
  const isAvatarClick = avatarButtonRef.value?.contains(target);
  if (
    !isAvatarClick &&
    !(target instanceof Element && target.closest(".dropdown-menu"))
  ) {
    closeDropdown();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeDropdown();
    isMobileMenuOpen.value = false;
  }
};

const handleLogout = async () => {
  await signOut();
  closeDropdown();
  isMobileMenuOpen.value = false;
  navigateTo("/");
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});

watch(
  () => props.profile?.id,
  () => {
    closeDropdown();
    closeMobileMenu();
  },
);

const avatarUrl = computed(() => {
  if (props.profile?.avatar) {
    return props.profile?.avatar;
  }
  return "https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg";
});

const dropdownUser = computed(() => ({
  auth_uid: props.profile?.auth_uid,
  use: props.profile?.use,
  email: props.profile?.email,
  avatar: avatarUrl.value,
  role: props.profile?.role || "user",
}));
</script>

<template>
  <header
    class="fixed top-0 left-0 w-full bg-white z-40 border-b border-gray-200"
  >
    <div class="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
      <!-- Логотип -->
      <div class="flex items-center">
        <NuxtLink to="/">
          <img
            src="https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/logo.svg"
            class="w-10 h-10 rounded-full shadow-md object-cover cursor-pointer"
            alt="Klio logo"
          />
        </NuxtLink>
      </div>

      <!-- Навигация для авторизованных – только десктоп (без изменений) -->
      <nav
        v-if="isAuthenticated"
        class="hidden md:flex items-center h-full space-x-6"
      >
        <NuxtLink
          to="/"
          class="flex items-center h-full px-1 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-900 hover:text-gray-900 transition"
        >
          Главная
        </NuxtLink>
        <NuxtLink
          to="/categories"
          class="flex items-center h-full px-1 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-900 hover:text-gray-900 transition"
        >
          Каталог
        </NuxtLink>
        <NuxtLink
          to="/communities"
          class="flex items-center h-full px-1 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-900 hover:text-gray-900 transition"
        >
          Сообщества
        </NuxtLink>
        <NuxtLink
          to="/create"
          class="flex items-center h-full px-1 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-900 hover:text-gray-900 transition"
        >
          Создать пост
        </NuxtLink>
        <NuxtLink
          to="/profile/favorites"
          class="flex items-center h-full px-1 text-sm font-medium text-gray-700 border-b-2 border-transparent hover:border-gray-900 hover:text-gray-900 transition"
        >
          Избранное
        </NuxtLink>
      </nav>

      <!-- Правая часть -->
      <div class="flex items-center space-x-3">
        <!-- Состояние загрузки -->
        <div v-if="props.isLoading" class="flex items-center">
          <div class="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <template v-else>
          <!-- === АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ === -->
          <div v-if="isAuthenticated" class="flex items-center">
            <!-- Десктоп: аватарка с дропдауном (без изменений) -->
            <div class="relative hidden md:block">
              <button
                ref="avatarButtonRef"
                class="flex items-center focus:outline-none"
                @click="toggleDropdown"
                @keydown.esc="closeDropdown"
              >
                <img
                  :src="avatarUrl"
                  class="w-10 h-10 rounded-full shadow-md object-cover border-2 border-transparent hover:border-gray-300 transition"
                  alt="User avatar"
                />
              </button>
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <Dropdown
                  v-if="isOpen"
                  :auth_uid="dropdownUser.auth_uid"
                  :use="dropdownUser.use"
                  :email="dropdownUser.email"
                  :avatar="dropdownUser.avatar"
                  :role="dropdownUser.role"
                  class="origin-top-right dropdown-menu"
                  @logout="handleLogout"
                />
              </transition>
            </div>

            <!-- Мобильные: бургер-иконка -->
            <div class="md:hidden">
              <button
                class="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                @click="toggleMobileMenu"
                @keydown.esc="closeMobileMenu"
              >
                <Bars3Icon v-if="!isMobileMenuOpen" class="w-6 h-6" />
                <XMarkIcon v-else class="w-6 h-6" />
              </button>
            </div>
          </div>

          <!-- === НЕАВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ === (без изменений) -->
          <div v-else class="flex items-center space-x-2">
            <NuxtLink
              to="/auth/login"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-slate-50 rounded-lg shadow-sm hover:bg-slate-100 border-2 transition"
              style="border-color: #8699a3"
            >
              Вход
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-blue-50 rounded-lg shadow-sm hover:bg-blue-100 border-2 border-blue-300 transition"
            >
              Регистрация
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>

    <!-- МОБИЛЬНОЕ МЕНЮ (бургер) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen && isAuthenticated"
        class="absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 md:hidden z-50"
      >
        <div class="px-4 py-5 space-y-4">
          <!-- Блок профиля (аватар + имя + email) (без изменений) -->
          <div
            class="flex items-center space-x-3 pb-3 border-b border-gray-100"
          >
            <img
              :src="avatarUrl"
              class="w-12 h-12 rounded-full shadow-md object-cover"
              alt="Avatar"
            />
            <div class="flex-1 truncate">
              <p class="text-base font-medium text-gray-900 truncate">
                {{ dropdownUser.use }}
              </p>
              <p class="text-sm text-gray-500 truncate">
                {{ dropdownUser.email }}
              </p>
            </div>
          </div>

          <!-- Навигационные ссылки (без изменений) -->
          <NuxtLink
            to="/"
            class="block py-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2"
            @click="closeMobileMenu"
          >
            Главная
          </NuxtLink>
          <NuxtLink
            to="/categories"
            class="block py-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2"
            @click="closeMobileMenu"
          >
            Каталог
          </NuxtLink>
          <NuxtLink
            to="/communities"
            class="block py-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2"
            @click="closeMobileMenu"
          >
            Сообщества
          </NuxtLink>
          <NuxtLink
            to="/create"
            class="block py-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2"
            @click="closeMobileMenu"
          >
            Создать пост
          </NuxtLink>
          <NuxtLink
            to="/profile/favorites"
            class="block py-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2"
            @click="closeMobileMenu"
          >
            Избранное
          </NuxtLink>

          <!-- Дополнительные пункты (профиль, редактирование, модерация, выход) -->
          <div class="border-t border-gray-100 pt-3 space-y-1">
            <NuxtLink
              :to="`/profile/${dropdownUser.auth_uid}`"
              class="flex items-center py-2 px-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              @click="closeMobileMenu"
            >
              <UserIcon class="w-5 h-5 mr-3 text-gray-400" />
              Профиль
            </NuxtLink>
            <NuxtLink
              :to="`/profile/edit`"
              class="flex items-center py-2 px-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              @click="closeMobileMenu"
            >
              <PencilIcon class="w-5 h-5 mr-3 text-gray-400" />
              Редактировать профиль
            </NuxtLink>
            <!-- Модерация (для модератора и админа) -->
            <template
              v-if="
                dropdownUser.role === 'admin' ||
                dropdownUser.role === 'moderator'
              "
            >
              <NuxtLink
                to="/moderate/posts"
                class="flex items-center py-2 px-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                @click="closeMobileMenu"
              >
                <BriefcaseIcon class="w-5 h-5 mr-3 text-gray-400" />
                Модерация постов
              </NuxtLink>
              <NuxtLink
                to="/moderate/reports"
                class="flex items-center py-2 px-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                @click="closeMobileMenu"
              >
                <FlagIcon class="w-5 h-5 mr-3 text-gray-400" />
                Жалобы
              </NuxtLink>
            </template>
            <NuxtLink
              v-if="dropdownUser.role === 'admin'"
              to="/register"
              class="flex items-center py-2 px-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              @click="closeMobileMenu"
            >
              <PlusIcon class="w-5 h-5 mr-3 text-gray-400" />
              Создать модератора
            </NuxtLink>

            <button
              class="flex w-full items-center py-2 px-2 text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              @click="handleLogout"
            >
              <ArrowRightStartOnRectangleIcon
                class="w-5 h-5 mr-3 text-gray-400"
              />
              Выход
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>
