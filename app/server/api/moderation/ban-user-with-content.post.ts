import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const { userId } = await readBody(event);
    if (!userId)
      throw createError({ statusCode: 400, message: "Missing userId" });

    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

    const runtimeConfig = useRuntimeConfig();
    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    // 1. Удаляем все комментарии пользователя
    const { error: deleteCommentsError } = await serviceSupabase
      .from("comments")
      .delete()
      .eq("user_id", userId);

    if (deleteCommentsError)
      throw createError({
        statusCode: 500,
        message: deleteCommentsError.message,
      });

    // 2. Удаляем все посты пользователя
    const { error: deletePostsError } = await serviceSupabase
      .from("post")
      .delete()
      .eq("author_id", userId);

    if (deletePostsError)
      throw createError({ statusCode: 500, message: deletePostsError.message });

    // 3. Баним пользователя
    const { error: banError } = await serviceSupabase
      .from("user")
      .update({ is_banned: true })
      .eq("id", userId);

    if (banError)
      throw createError({ statusCode: 500, message: banError.message });

    return { success: true };
  } catch (err) {
    console.error("[ban-user-with-content]", err);
    throw err;
  }
});
