<!-- components/ProtectedAction.vue -->
<template>
  <div>
    <slot v-if="isAuthenticated" />
    <div v-else class="protected-action">
      <p>Для выполнения этого действия необходимо авторизоваться</p>
      <button @click="redirectToLogin" class="login-button">Войти</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated } = useAuth();
const router = useRouter();

const redirectToLogin = () => {
  const returnUrl = encodeURIComponent(router.currentRoute.value.fullPath);
  router.push(`/auth/login?returnUrl=${returnUrl}`);
};
</script>

<style scoped>
.protected-action {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  background: #f9f9f9;
}

.login-button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.login-button:hover {
  background: #2563eb;
}
</style>
