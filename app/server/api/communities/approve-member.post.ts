import { serverSupabaseUser, serverSupabaseClient } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { communityId, targetUserId } = body;

  // Получаем текущего пользователя из auth
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // Клиент с правами текущего пользователя (для проверок)
  const supabase = await serverSupabaseClient(event);

  // Находим числовой id текущего пользователя в таблице user
  const { data: currentUser, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();

  if (userError || !currentUser) {
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

  // Создаем клиент с service_role (обходит RLS)
  const runtimeConfig = useRuntimeConfig();
  const serviceSupabase = createClient(
    runtimeConfig.public.supabaseUrl,
    runtimeConfig.serviceKey, // должен быть определён в nuxt.config и .env
  );

  // Выполняем действие – одобряем заявку (меняем роль на member)
  const { error: updateError } = await serviceSupabase
    .from("subscribers")
    .update({ role: "member" })
    .eq("communities_id", communityId)
    .eq("user_id", targetUserId);

  if (updateError) {
    throw createError({ statusCode: 500, message: updateError.message });
  }

  return { success: true };
});
