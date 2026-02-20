import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { communityId, targetUserId } = body;

  // Получаем текущего пользователя
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // Получаем клиент с правами пользователя (не service_role)
  const supabase = await serverSupabaseClient(event);

  // Находим числовой id текущего пользователя в таблице user
  const { data: currentUser } = await supabase
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();

  if (!currentUser) {
    throw createError({ statusCode: 404, message: "User not found" });
  }

  // Проверяем, является ли текущий пользователь админом сообщества
  const { data: adminCheck, error: adminError } = await supabase
    .from("subscribers")
    .select("role")
    .eq("communities_id", communityId)
    .eq("user_id", currentUser.id)
    .single();

  if (adminError || !adminCheck || adminCheck.role !== "admin") {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  // Теперь выполняем действие через service_role клиент (обходит RLS)
  // Для этого нам нужен клиент с сервисной ролью.
  // Его можно получить через useSupabaseClient с service_role ключом.
  // В Nuxt модуле Supabase это делается через $supabase.client.serviceRole или отдельную конфигурацию.
  // Проще всего создать отдельный экземпляр клиента с service_role ключом из runtimeConfig.

  const runtimeConfig = useRuntimeConfig();
  const serviceSupabase = createClient(
    runtimeConfig.public.supabaseUrl,
    runtimeConfig.serviceKey, // добавьте NUXT_SERVICE_KEY в .env
  );

  const { error } = await serviceSupabase
    .from("subscribers")
    .update({ role: "member" })
    .eq("communities_id", communityId)
    .eq("user_id", targetUserId);

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  return { success: true };
});
