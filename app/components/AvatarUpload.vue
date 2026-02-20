<!-- components/AvatarUpload.vue -->
<script setup lang="ts">
const { profile } = useAuth();
const { uploadAvatar } = useStorage();

const uploading = ref(false);
const showCropper = ref(false);
const selectedFile = ref<File | null>(null);
const imageUrl = ref<string | null>(null);
let cropper: Cropper | null = null; // используется глобальный тип

const fileInput = ref<HTMLInputElement | null>(null);
const imageElement = ref<HTMLImageElement | null>(null);

function triggerFileSelect() {
  fileInput.value?.click();
}

async function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  selectedFile.value = file;
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = URL.createObjectURL(file);
  showCropper.value = true;

  (event.target as HTMLInputElement).value = "";

  await nextTick();

  if (window.Cropper && imageElement.value) {
    if (cropper) cropper.destroy();
    cropper = new window.Cropper(imageElement.value, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: "move",
      cropBoxMovable: true,
      cropBoxResizable: true,
      background: false,
    });
  } else {
    console.error("Cropper.js не загрузился");
  }
}

function cancelCrop() {
  showCropper.value = false;
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = null;
  }
}

async function saveCrop() {
  if (!cropper) return;

  const canvas = cropper.getCroppedCanvas({
    width: 400,
    height: 400,
    fillColor: "#fff",
    imageSmoothingQuality: "high",
  });

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b: Blob | null) => {
        if (b) resolve(b);
      },
      "image/webp",
      0.9,
    );
  });

  const croppedFile = new File(
    [blob],
    (selectedFile.value?.name?.replace(/\.[^/.]+$/, "") || "avatar") + ".webp",
    { type: "image/webp" },
  );

  // Закрываем модалку и чистим временные данные
  showCropper.value = false;
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = null;
  }
  cropper.destroy();
  cropper = null;

  uploading.value = true;
  try {
    await uploadAvatar(croppedFile);
    // profile?.avatar обновится автоматически через useAuth
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Ошибка загрузки аватарки");
  } finally {
    uploading.value = false;
  }
}

onUnmounted(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  if (cropper) cropper.destroy();
});
</script>

<template>
  <div class="avatar-uploader">
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @change="onFileSelected"
      hidden
    />

    <div class="avatar-container" @click="triggerFileSelect">
      <img
        :src="
          profile?.avatar ||
          'https://phlyzwfqtpddvgrprngo.supabase.co/storage/v1/object/public/avatars/default.jpg'
        "
        class="avatar"
        alt="Avatar"
      />
      <div v-if="!uploading" class="avatar-overlay">
        <span class="plus-icon">+</span>
      </div>
      <div v-if="uploading" class="loading-overlay">
        <span>Загрузка...</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCropper" class="cropper-modal">
        <div class="cropper-content">
          <h3>Обрежьте изображение</h3>
          <div class="cropper-container">
            <img
              v-if="imageUrl"
              ref="imageElement"
              :src="imageUrl"
              alt="Обрезка"
              style="max-width: 100%"
            />
          </div>
          <div class="cropper-actions">
            <button @click="cancelCrop">Отмена</button>
            <button @click="saveCrop">Сохранить</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}
.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.2s;
}
.avatar-container:hover .avatar {
  filter: brightness(0.7);
}
.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.avatar-container:hover .avatar-overlay {
  opacity: 1;
}
.plus-icon {
  color: white;
  font-size: 3rem;
  font-weight: bold;
  line-height: 1;
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
  font-size: 1rem;
}

.cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 1;
}
.cropper-content {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}
.cropper-container {
  width: 500px;
  height: 500px;
  max-width: 80vw;
  max-height: 80vh;
  margin: 1rem 0;
}
.cropper-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
.cropper-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.cropper-actions button:first-child {
  background: #ccc;
}
.cropper-actions button:last-child {
  background: #3b82f6;
  color: white;
}
</style>
