<script setup lang="ts">
import type { Database } from "~/types/supabase";
definePageMeta({
  layout: "auth",
});

const submitted = ref(false);
const formErrors = ref<{ general?: string }>({});
const supabase = useSupabaseClient<Database>();

const submitHandler = async (data?: {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
}) => {
  if (!data?.email || !data?.password || !data?.name || !data?.phone) return;

  try {
    formErrors.value = {};

    // 1. Проверка уникальности номера телефона
    const { data: existingPhone } = await supabase
      .from("user")
      .select("id")
      .eq("phone", data.phone)
      .maybeSingle();
    if (existingPhone) {
      formErrors.value.general = "Этот номер телефона уже зарегистрирован";
      return;
    }

    // 2. Регистрация в Supabase Auth
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

    // 3. Создание профиля в таблице user
    const { error: profileError } = await supabase.from("user").insert({
      auth_uid: authData.user.id,
      username: data.name.toLowerCase().replace(/\s+/g, "_").substring(0, 50),
      use: data.name.substring(0, 100),
      email: data.email,
      phone: data.phone,
      status: "active",
      rating: 0,
      created_at: new Date().toISOString(),
    } as any);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // В случае ошибки создания профиля, желательно удалить пользователя из auth
      // (но это сложно, можно просто показать ошибку)
      formErrors.value.general = "Ошибка создания профиля. Попробуйте позже.";
      return;
    }

    submitted.value = true;

    if (!authData.session) {
      formErrors.value.general =
        "Пожалуйста, подтвердите ваш email. Мы отправили вам письмо.";
    } else {
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
    <div class="w-1/2 h-full overflow-hidden">
      <img
        src="https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/auth.png"
        alt="Registration background"
        class="w-full h-full object-cover"
      />
    </div>
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
            type="tel"
            name="phone"
            label="Телефон"
            placeholder="+7 (999) 123-45-67"
            validation="required|matches:/^[0-9+() -]+$/"
            :validation-messages="{
              required: 'Пожалуйста, введите номер телефона.',
              matches: 'Некорректный формат номера.',
            }"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
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
