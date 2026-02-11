<script setup lang="ts">
const { authUid, authUser, profile, isAuthenticated } = useAuth()
console.log('authUser:', authUser.value)
console.log('authUid:', authUid?.value)
console.log('profile:', profile.value)
</script>

<template>
  <div>
    <div v-if="isAuthenticated && profile">
      <h1>{{ profile.use || profile.username }}</h1>
      <AvatarUpload />
      <!-- остальные данные профиля -->
    </div>
  </div>
</template>
<style scoped>
.margin_header {
  padding-top: 5vw;
}
</style>
