<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">Жалобы</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else-if="reports.length === 0">Нет новых жалоб</div>
    <div v-else>
      <div v-for="r in reports" :key="r.id" class="border p-4 mb-4 rounded">
        <p><strong>Тип:</strong> {{ r.target_type }}</p>
        <p><strong>ID цели:</strong> {{ r.target_id }}</p>
        <p><strong>Причина:</strong> {{ r.reason }}</p>
        <p><strong>От:</strong> {{ r.reporter?.username }}</p>
        <div class="flex gap-2 mt-2">
          <button
            @click="markResolved(r.id)"
            class="bg-green-600 text-white px-3 py-1 rounded"
          >
            ✓ Рассмотрено
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const { isModerator, isAdmin } = useAuth();

definePageMeta({
  composable: "auth",
});

const reports = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  if (!isModerator.value && !isAdmin.value) {
    return navigateTo("/");
  }
  const { data } = await supabase
    .from("reports")
    .select("*, reporter:user!reporter_id(username)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  reports.value = data || [];
  loading.value = false;
});

const markResolved = async (id: number) => {
  await supabase.from("reports").update({ status: "resolved" }).eq("id", id);
  reports.value = reports.value.filter((r) => r.id !== id);
};
</script>
