<script setup lang="ts">
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
  <div class="flex items-center justify-center h-screen w-screen">
    <div style="width: 50vw">
      <img
        src="/favicon.ico"
        class="object-cover place-self-center"
        style="height: 2vw"
      />
    </div>
    <div class="flex-grow ml-20">
      <FormKit
        id="registration-form"
        type="form"
        :form-class="submitted ? 'hide' : 'show'"
        submit-label="Зарегистрироваться"
        :actions="false"
        incomplete-message="Введите данные"
        @submit="submitHandler"
      >
        <h1 class="font-bold" style="font-size: 3.2vw; margin-bottom: 2vw">
          Регистрация!
        </h1>

        <div class="mb-5">
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
        </div>

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

        <div class="double">
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
        </div>

        <div class="mt-5 text-left">
          <FormKit type="submit">Продолжить ></FormKit>
        </div>
      </FormKit>

      <div v-if="formErrors.general" class="text-red-500 mb-4">
        {{ formErrors.general }}
      </div>

      <NuxtLink :to="{ path: '/auth/login' }" class="block mt-4">
        <div style="font-size: 1vw">Уже есть аккаунт</div>
      </NuxtLink>

      <div v-if="submitted && !formErrors.general" class="mt-4">
        <h2 class="text-xl text-green-500">Регистрация прошла успешно!</h2>
      </div>
    </div>
  </div>
</template>
