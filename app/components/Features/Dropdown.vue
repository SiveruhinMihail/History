<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
const handleLogout = () => {
  localStorage.clear();
  router.push("/login");
};

interface DropDown_Props {
  username?: string | null;
  email?: string | null;
  avatar?: string;
  role?: string;
  id?: number;
}

const data = defineProps<DropDown_Props>();
</script>
<template>
  <div
    class="absolute right-0 z-10 origin-top-right select-none focus:outline-none bg-slate-50"
    role="menu"
    aria-orientation="vertical"
    aria-labelledby="menu-button"
    tabindex="-1"
    style="width: 21vw"
  >
    <div role="none" style="padding-top: 0.3vw">
      <a
        v-if="data.avatar"
        id="menu-item-0"
        href="#"
        class="select-none flex justify-center cursor-default"
        role="menuitem"
        tabindex="-1"
        ><img
          :src="data.avatar"
          class="rounded-full shadow-lg"
          style="width: 5.2vw; height: 5.2vw"
        />
      </a>
      <a
        v-if="!data.avatar"
        id="menu-item-0"
        href="#"
        class="select-none flex justify-center cursor-default"
        role="menuitem"
        tabindex="-1"
        ><img
          src="https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/sign/avatars/default.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iYjc2OWQ3OC0yMTRlLTQ0N2YtYmYzZS1iMTZhMWMxMjIyMmYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhdmF0YXJzL2RlZmF1bHQuanBnIiwiaWF0IjoxNzcwODQzNDM2LCJleHAiOjE4MDIzNzk0MzZ9.LE2vF49x_hNlvW2LBEwlDA9k6NM0ylk_QDovitRVyu0"
          class="rounded-full shadow-lg"
          style="width: 5.2vw"
        />
      </a>
      <a
        id="menu-item-0"
        href="#"
        class="block select-none cursor-default name text-center"
        style="padding-top: 0.8vw; font-size: 1.5vw"
        role="menuitem"
        tabindex="-1"
        >{{ data.username }}</a
      >
      <a
        id="menu-item-0"
        href="#"
        class="block text-gray-400 select-none cursor-default text-center"
        style="padding-bottom: 1.5vw; font-size: 1.1vw"
        role="menuitem"
        tabindex="-1"
        >{{ data.email }}</a
      >
      <hr class="DropDownHr" />
      <hr class="DropDownHr" />
      <router-link :to="{ path: '/profile', query: { id: data.id } }">
        <a
          id="menu-item-0"
          href="#"
          class="block DropDownElement select-none"
          style="
            padding-left: 1.15vw;
            padding-top: 0.8vw;
            padding-bottom: 0.8vw;
            font-size: 1.15vw;
          "
          role="menuitem"
          tabindex="-1"
          ><div class="inline-flex items-center">
            <img
              src="/1.png"
              style="width: 0.8vw; height: 1.1vw; margin-right: 0.8vw"
            />Профиль
          </div>
        </a></router-link
      >
      <router-link :to="{ path: '/moder', query: { id: data.id } }">
        <a
          v-if="data.role === 'admin'"
          id="menu-item-1"
          href="#"
          class="block DropDownElement"
          style="
            padding-left: 1.05vw;
            padding-top: 0.8vw;
            padding-bottom: 0.8vw;
            font-size: 1.15vw;
          "
          role="menuitem"
          tabindex="-1"
          ><div class="inline-flex items-center">
            <img
              src="/1.png"
              style="width: 1.1vw; height: 1.1vw; margin-right: 0.6vw"
            />Модерация
          </div></a
        ></router-link
      >
      <router-link :to="{ path: '/register' }">
        <a
          v-if="data.role === 'admin'"
          id="menu-item-1"
          href="#"
          class="block DropDownElement"
          style="
            padding-left: 1.05vw;
            padding-top: 0.8vw;
            padding-bottom: 0.8vw;
            font-size: 1.15vw;
          "
          role="menuitem"
          tabindex="-1"
          ><div class="inline-flex items-center">
            <img
              src="/1.png"
              style="width: 1.1vw; height: 1.1vw; margin-right: 0.6vw"
            />Создать модератора
          </div></a
        ></router-link
      >
      <router-link :to="{ path: '/my_routes', query: { id: data.id } }">
        <a
          id="menu-item-1"
          href="#"
          class="block DropDownElement"
          style="
            padding-left: 1.05vw;
            padding-top: 0.8vw;
            padding-bottom: 0.8vw;
            font-size: 1.15vw;
          "
          role="menuitem"
          tabindex="-1"
          ><div class="inline-flex items-center">
            <img
              src="/1.png"
              style="width: 1.1vw; height: 1.1vw; margin-right: 0.6vw"
            />Мои проекты
          </div></a
        ></router-link
      >
      <button
        id="menu-item-3"
        type="submit"
        style="
          padding-left: 1.14vw;
          padding-top: 0.8vw;
          padding-bottom: 0.8vw;
          font-size: 1.15vw;
        "
        class="block w-full text-left exit DropDownElement"
        role="menuitem"
        tabindex="-1"
        @click="handleLogout"
      >
        <div class="inline-flex items-center">
          <img
            src="/1.png"
            style="width: 1vw; height: 1.1vw; margin-right: 0.6vw"
          />Выход
        </div>
      </button>
    </div>
  </div>
</template>
