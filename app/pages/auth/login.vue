<script setup lang="ts">
const submitted = ref(false);
const formErrors = ref<{ general?: string }>({});
const supabase = useSupabaseClient();

const submitHandler = async (data?: { email: string; password: string }) => {
  if (!data?.email || !data?.password) return;
  
  try {
    formErrors.value = {};
    
    // Вход через Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error) {
      console.error('Login error:', error);
      
      // Обработка разных ошибок Supabase
      if (error.message.includes('Invalid login credentials')) {
        formErrors.value.general = 'Неверный email или пароль';
      } else if (error.message.includes('Email not confirmed')) {
        formErrors.value.general = 'Пожалуйста, подтвердите ваш email';
      } else {
        formErrors.value.general = error.message || 'Ошибка авторизации';
      }
      return;
    }

    submitted.value = true;
    await navigateTo('/');
    
  } catch (error: any) {
    console.error('Unexpected error:', error);
    formErrors.value.general = 'Произошла непредвиденная ошибка';
  }
};

const togglePasswordVisibility = (node: any) => {
  node.props.suffixIcon = node.props.suffixIcon === "eye" ? "eyeClosed" : "eye";
  node.props.type = node.props.type === "password" ? "text" : "password";
};
</script>

<template>
  <div class="flex items-center justify-center h-screen w-screen min-h-screen">
    <div class="w-1/2">
      <img
        src="/favicon.ico"
        class="object-contain"
        style="height: 90vh; width: 90vw"
      />
    </div>
    <div class="flex-grow" style="margin-left: 6vw">
      <FormKit
        id="login-form"
        type="form"
        :form-class="submitted ? 'hide' : 'show'"
        submit-label="Войти"
        :actions="false"
        incomplete-message="Введите данные"
        @submit="submitHandler"
      >
        <h1 class="font-bold" style="font-size: 3.2vw; margin-bottom: 2vw">
          Вход
        </h1>
        
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
          :validation-messages="{
            required: 'Пожалуйста, введите пароль.',
          }"
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
      
      <NuxtLink :to="{ path: '/auth/register' }" class="block mt-4">
        <div style="font-size: 1vw">Создать аккаунт</div>
      </NuxtLink>
      
      <div v-if="submitted" class="mt-4">
        <h2 class="text-xl text-green-500">Вход выполнен успешно!</h2>
      </div>
    </div>
  </div>
</template>