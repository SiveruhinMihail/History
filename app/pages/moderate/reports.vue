<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

const { isModerator, isAdmin } = useAuth();
const supabase = useSupabaseClient();

// Тип для отчёта с дополнительными полями
type ReportWithDetails = {
  // поля из таблицы reports
  id: number;
  created_at: string | null;
  reason: string | null;
  reporter_id: number | null;
  status: string | null;
  target_id: number;
  target_type: string | null;
  reporter: { username: string | null } | null;
  // дополнительные поля
  processing: boolean;
  targetData?: any;
  authorId?: number;
  authorExists?: boolean;
  authorBanned?: boolean;
};

const reports = ref<ReportWithDetails[]>([]);
const loading = ref(true);

async function loadReports() {
  if (!isModerator.value && !isAdmin.value) return navigateTo("/");
  loading.value = true;
  try {
    const { data: reportsData, error } = await supabase
      .from("reports")
      .select("*, reporter:user!reporter_id(username)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const enriched: ReportWithDetails[] = await Promise.all(
      (reportsData || []).map(async (r) => {
        // Базовый объект
        const report: ReportWithDetails = {
          ...r,
          processing: false,
          targetData: null,
          authorId: undefined,
          authorExists: false,
          authorBanned: false,
        };

        // Загружаем данные цели
        if (r.target_type === "post") {
          const { data: post } = await supabase
            .from("post")
            .select("id, title, description, author_id")
            .eq("id", r.target_id)
            .maybeSingle();
          report.targetData = post;
          report.authorId = post?.author_id as number;
        } else if (r.target_type === "comment") {
          const { data: comment } = await supabase
            .from("comments")
            .select("id, text, user_id")
            .eq("id", r.target_id)
            .maybeSingle();
          report.targetData = comment;
          report.authorId = comment?.user_id as number;
        } else if (r.target_type === "user") {
          const { data: user } = await supabase
            .from("user")
            .select("id, username, use, is_banned")
            .eq("id", r.target_id)
            .maybeSingle();
          report.targetData = user;
          report.authorId = user?.id; // для пользователя автор - он сам
        }

        // Проверяем статус автора
        if (report.authorId) {
          const { data: author } = await supabase
            .from("user")
            .select("id, is_banned")
            .eq("id", report.authorId)
            .maybeSingle();
          report.authorExists = !!author;
          report.authorBanned = author?.is_banned || false;
        } else {
          report.authorExists = false;
          report.authorBanned = false;
        }

        return report;
      }),
    );
    reports.value = enriched;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadReports);

async function deleteContent(report: ReportWithDetails) {
  report.processing = true;
  try {
    if (report.target_type === "post") {
      await $fetch("/api/moderation/delete-post", {
        method: "POST",
        body: { postId: report.target_id },
      });
    } else if (report.target_type === "comment") {
      await $fetch("/api/moderation/delete-comment", {
        method: "POST",
        body: { commentId: report.target_id },
      });
    } else if (report.target_type === "user") {
      alert("Для пользователя используйте кнопки бана");
      return;
    }
    await $fetch("/api/moderation/resolve-report", {
      method: "POST",
      body: { reportId: report.id, status: "resolved" },
    });
    reports.value = reports.value.filter((r) => r.id !== report.id);
  } catch (e) {
    console.error(e);
    alert("Ошибка при удалении");
  } finally {
    report.processing = false;
  }
}

async function banUserOnly(report: ReportWithDetails) {
  if (!report.authorId) return;
  report.processing = true;
  try {
    await $fetch("/api/moderation/ban-user-only", {
      method: "POST",
      body: { userId: report.authorId },
    });
    await $fetch("/api/moderation/resolve-report", {
      method: "POST",
      body: { reportId: report.id, status: "resolved" },
    });
    reports.value = reports.value.filter((r) => r.id !== report.id);
  } catch (e) {
    console.error(e);
    alert("Ошибка при бане");
  } finally {
    report.processing = false;
  }
}

async function banUserWithContent(report: ReportWithDetails) {
  if (!report.authorId) return;
  report.processing = true;
  try {
    await $fetch("/api/moderation/ban-user-with-content", {
      method: "POST",
      body: { userId: report.authorId },
    });
    await $fetch("/api/moderation/resolve-report", {
      method: "POST",
      body: { reportId: report.id, status: "resolved" },
    });
    reports.value = reports.value.filter((r) => r.id !== report.id);
  } catch (e) {
    console.error(e);
    alert("Ошибка при бане с удалением");
  } finally {
    report.processing = false;
  }
}

async function resolve(reportId: number) {
  const report = reports.value.find((r) => r.id === reportId);
  if (!report) return;
  report.processing = true;
  try {
    await $fetch("/api/moderation/resolve-report", {
      method: "POST",
      body: { reportId, status: "resolved" },
    });
    reports.value = reports.value.filter((r) => r.id !== reportId);
  } catch (e) {
    console.error(e);
    alert("Ошибка");
  } finally {
    if (report) report.processing = false;
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold mb-6">Жалобы</h1>
    <div v-if="loading">Загрузка...</div>
    <div v-else-if="reports.length === 0">Нет новых жалоб</div>
    <div v-else>
      <div v-for="r in reports" :key="r.id" class="border p-4 mb-4 rounded">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <p><strong>Тип:</strong> {{ r.target_type }}</p>
            <p><strong>ID цели:</strong> {{ r.target_id }}</p>
            <p v-if="r.targetData">
              <strong>Содержимое:</strong>
              <span v-if="r.target_type === 'post'">
                Пост: {{ r.targetData.title }} ({{ r.targetData.description }})
              </span>
              <span v-else-if="r.target_type === 'comment'">
                Комментарий: {{ r.targetData.text }}
              </span>
              <span v-else-if="r.target_type === 'user'">
                Пользователь: {{ r.targetData.use || r.targetData.username }}
              </span>
            </p>
            <p><strong>Причина:</strong> {{ r.reason }}</p>
            <p><strong>От:</strong> {{ r.reporter?.username }}</p>

            <!-- Информация об авторе (если это не жалоба на пользователя) -->
            <div v-if="r.authorId && r.target_type !== 'user'" class="mt-2">
              <p>
                <strong>Автор:</strong>
                <span v-if="!r.authorExists" class="text-red-600"
                  >(удалён)</span
                >
                <span v-else-if="r.authorBanned" class="text-orange-600"
                  >(забанен)</span
                >
                <span v-else class="text-green-600">активен</span>
              </p>
            </div>
          </div>

          <div class="flex gap-2">
            <!-- Удалить контент (пост/комментарий) -->
            <button
              class="bg-red-600 text-white px-3 py-1 rounded"
              :disabled="r.processing"
              @click="deleteContent(r)"
            >
              Удалить {{ r.target_type }}
            </button>

            <!-- Кнопки для бана автора (только если есть authorId) -->
            <template v-if="r.authorId">
              <button
                class="bg-orange-600 text-white px-3 py-1 rounded"
                :disabled="r.processing || !r.authorExists || r.authorBanned"
                title="Забанить без удаления контента"
                @click="banUserOnly(r)"
              >
                Только бан
              </button>
              <button
                class="bg-red-800 text-white px-3 py-1 rounded"
                :disabled="r.processing || !r.authorExists || r.authorBanned"
                title="Забанить и удалить все посты/комментарии"
                @click="banUserWithContent(r)"
              >
                Бан + удалить контент
              </button>
            </template>

            <!-- Отклонить жалобу -->
            <button
              class="bg-green-600 text-white px-3 py-1 rounded"
              :disabled="r.processing"
              @click="resolve(r.id)"
            >
              Отклонить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
