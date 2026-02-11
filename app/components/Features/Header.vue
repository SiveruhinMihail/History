<script setup lang="ts">
const { profile, isAuthenticated, isLoading } = useAuth();

const props = defineProps({
  scroll: Boolean,
  cleanmode: Boolean,
});

const clean = ref(props.cleanmode ? false : true);
const isOpen = ref(false);

// Закрытие дропдауна при клике вне
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".modal")) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const avatarUrl = computed(() => {
  if (profile.value?.avatar) {
    return profile.value.avatar; // сохраняется полный публичный URL
  }
  return 'https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg';
});

const dropdownUser = computed(() => ({
  id: profile.value?.id,
  username: profile.value?.username,
  email: profile.value?.email,
  avatar: avatarUrl.value,
  role: profile.value?.role || "user",
}));
</script>

<template>
  <div class="fixed w-full bg-white z-50 border-b">
    <div class="flex static justify-between" style="align-items: center">
      <header
        class="inline-flex justify-between select-none"
        style="padding-left: 1.5vw; padding-top: 1vw; padding-bottom: 1vw"
      >
        <router-link :to="{ path: '/' }">
          <div class="inline-flex items-center">
            <img
              src="/logo_light.png"
              class="cursor-pointer"
              style="height: 2vw; min-height: 10px"
            />
          </div>
        </router-link>
      </header>

      <!-- Навигация для авторизованных -->
      <div v-if="isAuthenticated" class="inline-flex" style="gap: 2vw">
        <div class="header-element">Избранное</div>
        <div class="header-element">Главная</div>
        <div class="header-element">Мои посты</div>
      </div>

      <!-- Состояние загрузки -->
      <div v-if="isLoading" class="flex" style="padding: 1vw">
        <div
          class="flex animate-pulse space-x-4 aspect-square"
          style="height: 3vw"
        >
          <div
            class="rounded-full bg-gray-200 aspect-square"
            style="height: 3vw"
          ></div>
        </div>
      </div>

      <!-- Контент после загрузки -->
      <div v-else>
        <!-- Дропдаун для авторизованного пользователя -->
        <div
          v-if="isAuthenticated"
          class="absolute modal bg-slate-50"
          style="right: 0"
          :class="{ EnterDropRight: isOpen, LeaveDropRight: !isOpen }"
        >
          <div
            v-if="clean"
            class="inline-flex items-center modal place-content-end select-none"
            style="padding-right: 1vw; margin-top: 1vw; width: 21vw"
          >
            <div
              class="justify-center hover:bg-gray-200 rounded-full cursor-pointer"
              style="padding: 1.4vw"
              @click="isOpen = !isOpen"
            >
              <img src="/arrow1.svg" style="width: 1.2vw; height: 1.2vw" />
            </div>
          </div>

          <!-- Компонент Dropdown -->
          <FeaturesDropdown
            v-if="isOpen"
            :id="dropdownUser.id"
            :username="dropdownUser.username"
            :email="dropdownUser.email"
            :avatar="dropdownUser.avatar"
            :role="dropdownUser.role"
            class="modal"
          />
        </div>

        <!-- Аватарка пользователя (клик открывает дропдаун) -->
        <div v-if="isAuthenticated" class="inline-flex">
          <div
            v-if="clean"
            class="inline-flex DropDown items-center cursor-pointer select-none modal"
            style="padding: 1vw"
            @click="isOpen = !isOpen"
          >
            <img
              :src="avatarUrl"
              class="rounded-full shadow-lg"
              style="width: 3vw; height: 3vw"
            />
          </div>
        </div>

        <!-- Блок для неавторизованных: кнопки Вход / Регистрация -->
        <div
          v-if="!isAuthenticated"
          class="content-center grid grid-rows-1 grid-cols-3 gap-2 items-center"
          style="width: 19vw; margin-right: 1vw"
        >
          <NuxtLink :to="{ path: '/auth/login' }">
            <div
              class="items-center rounded-lg text-center shadow-lg"
              style="
                padding-left: 0.8vw;
                padding-right: 0.8vw;
                padding-top: 0.5vw;
                padding-bottom: 0.5vw;
                font-size: 1.1vw;
                background-color: #fff5f5;
                color: #30343f;
                border-width: 2px;
                border-color: #f48a76;
              "
            >
              Вход
            </div>
          </NuxtLink>
          <NuxtLink class="col-span-2" :to="{ path: '/auth/register' }">
            <div
              class="items-center rounded-lg text-center shadow-lg"
              style="
                padding-left: 0.8vw;
                padding-right: 0.8vw;
                padding-top: 0.5vw;
                padding-bottom: 0.5vw;
                font-size: 1.1vw;
                background-color: #f1f6ff;
                color: #30343f;
                border-width: 2px;
                border-color: #90bbcc;
              "
            >
              Регистрация
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.header-element {
  height: max(5vw, 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 80ms linear;
  cursor: pointer;
  font-size: max(1.1vw, 6px);
}
.header-element:hover {
  border-bottom-width: 1px;
  border-color: #7887cc;
  color: #7887cc;
}
.scrolled {
  background-color: pink;
}
.search-box {
  width: fit-content;
  height: fit-content;
  position: relative;
}
.input-search {
  height: 50px;
  width: 50px;
  border-style: none;
  padding: 10px;
  font-size: 18px;
  letter-spacing: 2px;
  outline: none;
  border-radius: 25px;
  transition: all 0.5s ease-in-out;
  background-color: #00a176;
  padding-right: 40px;
  color: #fff;
}
.input-search::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 100;
}
.btn-search {
  width: 50px;
  height: 50px;
  border-style: none;
  font-size: 20px;
  font-weight: bold;
  outline: none;
  cursor: pointer;
  border-radius: 50%;
  position: absolute;
  right: 0px;
  color: #ffffff;
  background-color: transparent;
  pointer-events: painted;
}
.btn-search:focus ~ .input-search {
  width: 300px;
  border-radius: 0px;
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 500ms cubic-bezier(0, 0.11, 0.35, 2);
}
.input-search:focus {
  width: 300px;
  border-radius: 0px;
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 500ms cubic-bezier(0, 0.11, 0.35, 2);
}
h1 {
  font-size: calc(68px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
}
h2 {
  font-size: calc(24px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
}
h3 {
  font-size: calc(8px + (16 + 16 * 0.7) * ((110vw - 320px) / 1280));
}
h4 {
  font-size: calc((5 + 4 * 0.7) * ((110vw - 320px) / 1280) + 2px);
  align-content: center;
}
h5 {
  font-size: calc((6 + 4 * 0.7) * ((110vw - 320px) / 1280) + 3px);
  align-content: center;
}
p {
  font-size: calc((10 + 4 * 0.7) * ((110vw - 320px) / 1280) + 5px);
  align-content: center;
}
h6 {
  font-size: calc((14 + 4 * 0.7) * ((110vw - 320px) / 1280) + 6px);
  align-content: center;
}
</style>
