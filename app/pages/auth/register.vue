<script setup lang="ts">
definePageMeta({
  layout: "auth",
});
import type { Database } from "~/types/supabase";

const submitted = ref(false);
const formErrors = ref<{ general?: string }>({});
const supabase = useSupabaseClient<Database>();

const submitHandler = async (data?: {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
}) => {
  if (!data?.email || !data?.password || !data?.name) return;

  try {
    formErrors.value = {};

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.name,
        },
      },
    });

    if (signUpError) {
      console.error("Sign up error:", signUpError);

      if (signUpError.message.includes("User already registered")) {
        formErrors.value.general = "Пользователь с таким email уже существует";
      } else {
        formErrors.value.general = signUpError.message || "Ошибка регистрации";
      }
      return;
    }

    if (!authData.user) {
      formErrors.value.general = "Ошибка создания пользователя";
      return;
    }

    // 2. Создаем запись в таблице user
    const { error: profileError } = await supabase.from("user").insert({
      auth_uid: authData.user.id, // ← UUID из аутентификации
      username: data.name.toLowerCase().replace(/\s+/g, "_").substring(0, 50),
      use: data.name.substring(0, 100), // ← твое поле "use"
      email: data.email,
      status: "active",
      rating: 0,
      created_at: new Date().toISOString(),
    } as any); // ← временно используем any, пока TypeScript не поймет типы

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw profileError;
    }

    submitted.value = true;

    // Если email требует подтверждения
    if (!authData.session) {
      formErrors.value.general =
        "Пожалуйста, подтвердите ваш email. Мы отправили вам письмо.";
    } else {
      // Если email подтвержден автоматически, переходим на главную
      await navigateTo("/");
    }
  } catch (error: any) {
    console.error("Unexpected error:", error);
    formErrors.value.general = "Произошла непредвиденная ошибка";
  }
};

const togglePasswordVisibility = (node: any) => {
  node.props.suffixIcon = node.props.suffixIcon === "eye" ? "eyeClosed" : "eye";
  node.props.type = node.props.type === "password" ? "text" : "password";
};
</script>

<template>
  <div class="flex h-screen w-screen">
    <!-- Левая половина с изображением на всю высоту -->
    <div class="w-1/2 h-full overflow-hidden">
      <img
        src="https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/auth.png"
        alt="Registration background"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Правая половина с центрированной формой -->
    <div class="w-1/2 h-full flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <FormKit
          id="registration-form"
          type="form"
          :form-class="submitted ? 'hide' : 'show'"
          submit-label="Зарегистрироваться"
          :actions="false"
          incomplete-message="Введите данные"
          @submit="submitHandler"
        >
          <h1 class="font-bold text-4xl mb-8">Регистрация!</h1>

          <FormKit
            type="text"
            name="name"
            label="Имя"
            placeholder="Ваше имя"
            validation="required"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
            :validation-messages="{ required: 'Пожалуйста, введите ваше имя.' }"
          />

          <FormKit
            type="email"
            name="email"
            label="Email"
            placeholder="user@example.com"
            help="Введите вашу почту"
            validation="required|email"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
            :validation-messages="{
              required: 'Пожалуйста, введите ваш email.',
              email: 'Пожалуйста, введите корректный email адрес.',
            }"
          />

          <FormKit
            type="password"
            name="password"
            label="Пароль"
            validation="required|length:6"
            :validation-messages="{
              required: 'Пожалуйста, введите пароль.',
              length: 'Пароль должен содержать не менее 6 символов.',
            }"
            placeholder="Пароль"
            help="Введите пароль"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
            suffix-icon="eyeClosed"
            @suffix-icon-click="togglePasswordVisibility"
          />

          <FormKit
            type="password"
            name="password_confirm"
            label="Подтвердите пароль"
            placeholder="Подтвердите пароль"
            validation="required|confirm"
            :validation-messages="{
              required: 'Пожалуйста, подтвердите пароль.',
              confirm: 'Пароли не совпадают.',
            }"
            help="Подтвердите пароль"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
            suffix-icon="eyeClosed"
            @suffix-icon-click="togglePasswordVisibility"
          />

          <FormKit type="submit" class="mt-5">Продолжить ></FormKit>
        </FormKit>

        <div v-if="formErrors.general" class="text-red-500 mt-4">
          {{ formErrors.general }}
        </div>

        <NuxtLink to="/auth/login" class="block mt-4 text-sm">
          Уже есть аккаунт
        </NuxtLink>

        <div v-if="submitted && !formErrors.general" class="mt-4">
          <h2 class="text-xl text-green-500">Регистрация прошла успешно!</h2>
        </div>
      </div>
    </div>
  </div>
</template>
