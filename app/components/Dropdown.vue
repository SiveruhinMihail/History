<!-- components/Dropdown.vue -->
<script setup lang="ts">
import {
  UserIcon,
  BriefcaseIcon,
  PlusIcon,
  ArrowRightStartOnRectangleIcon,
  PencilIcon,
  FlagIcon,
  Squares2X2Icon,
  CheckBadgeIcon,
} from "@heroicons/vue/24/outline";

const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut();
};

interface DropDown_Props {
  use?: string | null;
  email?: string | null;
  avatar?: string;
  role?: string;
  auth_uid?: string;
}

const data = defineProps<DropDown_Props>();
</script>

<template>
  <div
    class="absolute top-full mt-2 right-0 w-80 z-50 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none dropdown-menu"
    role="menu"
    aria-orientation="vertical"
    aria-labelledby="user-menu-button"
    tabindex="-1"
    @click.stop
  >
    <div class="py-2" role="none">
      <!-- Аватар -->
      <div v-if="avatar" class="flex justify-center pt-2">
        <img
          :src="avatar"
          alt="avatar"
          loading="lazy"
          class="w-16 h-16 rounded-full shadow-md object-cover"
        />
      </div>
      <div v-else class="flex justify-center pt-2">
        <img
          src="https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg"
          alt="default avatar"
          class="w-16 h-16 rounded-full shadow-md object-cover"
          loading="lazy"
        />
      </div>

      <!-- Имя и email -->
      <div class="px-4 pt-3 text-center">
        <p class="text-lg font-medium text-gray-900 dark:text-white truncate">
          {{ use }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
          {{ email }}
        </p>
      </div>

      <!-- Пункты меню -->
      <div class="border-t border-gray-100 dark:border-gray-700 mt-3">
        <!-- Профиль -->
        <NuxtLink
          :to="`/profile/${auth_uid}`"
          class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          role="menuitem"
          tabindex="-1"
        >
          <UserIcon class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
          Профиль
        </NuxtLink>
        <NuxtLink
          :to="`/profile/edit`"
          class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
          tabindex="-1"
        >
          <PencilIcon class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
          Редактировать профиль
        </NuxtLink>

        <!-- Модерация (только admin) -->
        <NuxtLink
          v-if="role === 'admin' || role === 'moderator'"
          to="/moderate"
          class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
          tabindex="-1"
        >
          <Squares2X2Icon
            class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500"
          />
          Панель модерации
        </NuxtLink>
        <NuxtLink
          v-if="role === 'admin' || role === 'moderator'"
          to="/moderate/community-requests"
          class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
        >
          <CheckBadgeIcon
            class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500"
          />
          Заявки сообществ
        </NuxtLink>
        <NuxtLink
          v-if="role === 'admin' || role === 'moderator'"
          to="/moderate/community-name-requests"
          class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
        >
          <PencilIcon class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
          Запросы названий
        </NuxtLink>

        <template v-if="role === 'admin' || role === 'moderator'">
          <NuxtLink
            to="/moderate/posts"
            class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
            role="menuitem"
            tabindex="-1"
          >
            <BriefcaseIcon
              class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500"
            />
            Модерация постов
          </NuxtLink>
          <NuxtLink
            to="/moderate/reports"
            class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
            role="menuitem"
            tabindex="-1"
          >
            <FlagIcon class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
            Жалобы
          </NuxtLink>
        </template>

        <!-- Создать модератора (только admin) -->
        <NuxtLink
          v-if="role === 'admin'"
          to="/moderate/create-moderator"
          class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
          tabindex="-1"
        >
          <PlusIcon class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
          Создать модератора
        </NuxtLink>

        <!-- Выход -->
        <button
          class="flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
          tabindex="-1"
          @click="handleLogout"
        >
          <ArrowRightStartOnRectangleIcon
            class="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500"
          />
          Выход
        </button>
      </div>
    </div>
  </div>
</template>
