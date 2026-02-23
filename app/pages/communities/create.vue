<script setup lang="ts">
const supabase = useSupabaseClient();
const { userId } = useAuth();
const { uploadFile, getPublicUrl } = useStorage();
const router = useRouter();

const form = ref({ name: "", description: "" });
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);
const submitting = ref(false);
const canCreate = ref(true);

// Проверка лимита сообществ
const checkLimit = async () => {
  if (!userId.value) return false;
  const { count } = await supabase
    .from("community")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId.value);
  return (count || 0) < 5;
};

onMounted(async () => {
  canCreate.value = await checkLimit();
  if (!canCreate.value) {
    alert("Вы можете создать не более 5 сообществ");
  }
});

function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

async function handleSubmit() {
  if (!userId.value) {
    alert("Необходимо авторизоваться");
    return;
  }
  if (!(await checkLimit())) {
    alert("Вы достигли лимита на создание сообществ (максимум 5)");
    return;
  }

  submitting.value = true;
  try {
    // Создаём сообщество
    const { data: newComm, error } = await supabase
      .from("community")
      .insert({
        name: form.value.name,
        description: form.value.description,
        owner_id: userId.value,
        rating: 0,
        patent: false,
      })
      .select()
      .single();
    if (error) throw error;

    // Загружаем аватар, если выбран
    if (avatarFile.value) {
      const uploadResult = await uploadFile(
        "community-avatars",
        avatarFile.value,
        newComm.id.toString(),
        { upsert: true, optimize: true },
      );
      const publicUrl = getPublicUrl("community-avatars", uploadResult.path);
      await supabase
        .from("community")
        .update({ avatar: publicUrl })
        .eq("id", newComm.id);
      newComm.avatar = publicUrl;
    }

    // Добавляем создателя как админа
    const { error: subError } = await supabase.from("subscribers").insert({
      communities_id: newComm.id,
      user_id: userId.value,
      role: "admin",
    });
    if (subError) throw subError;

    await navigateTo(`/communities/${newComm.id}`);
  } catch (e) {
    console.error(e);
    alert("Ошибка при создании сообщества: " + (e as any).message);
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  router.back();
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">Создать сообщество</h1>
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Название</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full border rounded p-2"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Описание</label>
        <textarea
          v-model="form.description"
          rows="4"
          required
          class="w-full border rounded p-2"
        ></textarea>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Аватар сообщества</label>
        <input
          type="file"
          accept="image/*"
          class="w-full border rounded p-2"
          @change="handleAvatarChange"
        />
        <div v-if="avatarPreview" class="mt-2">
          <img :src="avatarPreview" class="h-20 w-20 object-cover rounded" />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
          @click="cancel"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="submitting || !canCreate"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitting ? "Создание..." : "Создать" }}
        </button>
      </div>
    </form>
  </div>
</template>
