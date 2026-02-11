<!-- components/AvatarUpload.vue -->
<script setup lang="ts">
import { useStorage } from "~/composables/useStorage";

const { profile } = useAuth();
const { uploadAvatar, deleteAvatar } = useStorage();
const uploading = ref(false);
const previewUrl = ref<string | null>(null);

async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Превью
  previewUrl.value = URL.createObjectURL(file);

  try {
    uploading.value = true;
    await uploadAvatar(file);
    // Профиль обновится автоматически через updateProfile
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Ошибка загрузки аватарки");
  } finally {
    uploading.value = false;
    // Очищаем input
    (event.target as HTMLInputElement).value = "";
  }
}

async function handleDelete() {
  if (!confirm("Удалить аватарку?")) return;
  try {
    await deleteAvatar();
  } catch (error: any) {
    alert(error.message);
  }
}
</script>

<template>
  <div class="avatar-uploader">
    <div class="avatar-container">
      <img
        :src="
          previewUrl ||
          profile?.avatar ||
          'https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/sign/temp/avatar.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iYjc2OWQ3OC0yMTRlLTQ0N2YtYmYzZS1iMTZhMWMxMjIyMmYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ0ZW1wL2F2YXRhci5qcGciLCJpYXQiOjE3NzA4NDI1NTksImV4cCI6MTgwMjM3ODU1OX0.iUEncpijpFBc86B86RvpNCGCqzJjeqwhOoaeIpc75dg'
        "
        class="avatar"
      />
      <div v-if="uploading" class="loading-overlay">
        <span>Загрузка...</span>
      </div>
    </div>

    <div class="actions">
      <label class="btn upload-btn">
        {{ profile?.avatar ? "Изменить" : "Загрузить" }}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="handleFileChange"
          hidden
        />
      </label>

      <button
        v-if="profile?.avatar"
        class="btn delete-btn"
        @click="handleDelete"
        :disabled="uploading"
      >
        Удалить
      </button>
    </div>
  </div>
</template>

<style scoped>
.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
}
.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
.upload-btn {
  background: #3b82f6;
  color: white;
}
.delete-btn {
  background: #ef4444;
  color: white;
}
</style>
