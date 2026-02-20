<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <h1 class="text-3xl font-bold mb-6">Редактировать сообщество</h1>
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
        <label class="block text-sm font-medium mb-1"
          >Описание (поддерживает Markdown)</label
        >
        <div class="flex gap-2">
          <textarea
            v-model="form.description"
            rows="8"
            class="w-full border rounded p-2 font-mono text-sm"
          ></textarea>
          <div
            class="w-full border rounded p-2 prose max-w-none"
            v-html="renderedPreview"
          ></div>
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Аватар сообщества</label>
        <input
          type="file"
          accept="image/*"
          @change="handleAvatarChange"
          class="w-full border rounded p-2"
        />
        <div v-if="avatarPreview" class="mt-2">
          <img :src="avatarPreview" class="h-20 w-20 object-cover rounded" />
        </div>
        <div v-else-if="community?.avatar" class="mt-2">
          <img :src="community.avatar" class="h-20 w-20 object-cover rounded" />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          @click="cancel"
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ submitting ? "Сохранение..." : "Сохранить" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { userId } = useAuth();
const { getCommunity, updateCommunity } = useCommunity(); // добавим updateCommunity
const { uploadFile, getPublicUrl } = useStorage();
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

const community = ref<any>(null);
const form = ref({ name: "", description: "" });
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(null);
const submitting = ref(false);
const loading = ref(true);

const renderedPreview = computed(() => md.render(form.value.description || ""));

const loadCommunity = async () => {
  const id = Number(route.params.id);
  if (isNaN(id)) return;
  try {
    community.value = await getCommunity(id);
    // Проверка прав: только владелец или админ могут редактировать
    const isOwner = community.value.owner_id === userId.value;
    const isAdmin = await checkIfAdmin(id, userId.value as number); // нужно реализовать проверку
    if (!isOwner && !isAdmin) {
      alert("У вас нет прав на редактирование этого сообщества");
      router.back();
      return;
    }
    form.value.name = community.value.name;
    form.value.description = community.value.description || "";
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const checkIfAdmin = async (communityId: number, uid: number) => {
  const supabase = useSupabaseClient();
  const { data } = await supabase
    .from("subscribers")
    .select("role")
    .eq("communities_id", communityId)
    .eq("user_id", uid)
    .single();
  return data?.role === "admin";
};

function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

async function handleSubmit() {
  if (!community.value) return;
  submitting.value = true;
  try {
    const updates: any = {
      name: form.value.name,
      description: form.value.description,
    };
    if (avatarFile.value) {
      const uploadResult = await uploadFile(
        "community-avatars",
        avatarFile.value,
        community.value.id.toString(),
        { upsert: true, optimize: true },
      );
      updates.avatar = getPublicUrl("community-avatars", uploadResult.path);
    }
    await updateCommunity(community.value.id, updates);
    await navigateTo(`/communities/${community.value.id}`);
  } catch (e) {
    console.error(e);
    alert("Ошибка при сохранении");
  } finally {
    submitting.value = false;
  }
}

function cancel() {
  router.back();
}

onMounted(loadCommunity);
</script>
