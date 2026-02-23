<script setup lang="ts">
definePageMeta({
  layout: "auth",
});
const { signIn } = useAuth();
const supabase = useSupabaseClient();
const submitted = ref(false);
const formErrors = ref<{ general?: string }>({});

const submitHandler = async (data?: { email: string; password: string }) => {
  if (!data?.email || !data?.password) return;

  try {
    formErrors.value = {};
    await signIn(data.email, data.password);

    // После входа проверяем, не забанен ли пользователь
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("is_banned")
        .eq("auth_uid", user.id)
        .maybeSingle();

      if (userError || userData?.is_banned) {
        await supabase.auth.signOut();
        formErrors.value.general = "Ваш аккаунт заблокирован. Вход невозможен.";
        return;
      }
    }

    submitted.value = true;
    await navigateTo("/");
  } catch (error: any) {
    console.error("Login error:", error);

    if (error.message.includes("Invalid login credentials")) {
      formErrors.value.general = "Неверный email или пароль";
    } else if (error.message.includes("Email not confirmed")) {
      formErrors.value.general = "Пожалуйста, подтвердите ваш email";
    } else {
      formErrors.value.general = error.message || "Ошибка авторизации";
    }
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
        alt="Background"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="w-1/2 h-full flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <FormKit
          id="login-form"
          type="form"
          :form-class="submitted ? 'hide' : 'show'"
          submit-label="Войти"
          :actions="false"
          incomplete-message="Введите данные"
          @submit="submitHandler"
        >
          <h1 class="font-bold text-4xl mb-8">Вход</h1>

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
            validation="required"
            :validation-messages="{ required: 'Пожалуйста, введите пароль.' }"
            placeholder="Пароль"
            help="Введите пароль"
            label-class="text-lg"
            input-class="text-lg py-2 px-4 w-full"
            suffix-icon="eyeClosed"
            @suffix-icon-click="togglePasswordVisibility"
          />

          <FormKit type="submit">Продолжить ></FormKit>
        </FormKit>

        <div v-if="formErrors.general" class="text-red-500 mt-4">
          {{ formErrors.general }}
        </div>

        <NuxtLink to="/auth/register" class="block mt-4 text-sm">
          Создать аккаунт
        </NuxtLink>

        <div v-if="submitted" class="mt-4">
          <h2 class="text-xl text-green-500">Вход выполнен успешно!</h2>
        </div>
      </div>
    </div>
  </div>
</template>
