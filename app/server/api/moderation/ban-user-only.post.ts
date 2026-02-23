// server/api/moderation/ban-user.post.ts
import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const { userId } = await readBody(event);

    if (!userId) {
      throw createError({ statusCode: 400, message: "Missing userId" });
    }

    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const runtimeConfig = useRuntimeConfig();
    if (!runtimeConfig.serviceKey) {
      console.error("[ban-user] Service key missing");
      throw createError({
        statusCode: 500,
        message: "Server configuration error",
      });
    }

    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    // Проверяем, существует ли пользователь с таким ID
    const { data: targetUser, error: fetchError } = await serviceSupabase
      .from("user")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("[ban-user] Fetch error:", fetchError);
      throw createError({ statusCode: 500, message: fetchError.message });
    }

    if (!targetUser) {
      throw createError({ statusCode: 404, message: "User not found" });
    }

    // Обновляем поле is_banned
    const { error: updateError } = await serviceSupabase
      .from("user")
      .update({ is_banned: true })
      .eq("id", userId);

    if (updateError) {
      console.error("[ban-user] Update error:", updateError);
      throw createError({ statusCode: 500, message: updateError.message });
    }

    return { success: true };
  } catch (err) {
    console.error("[ban-user] Unhandled error:", err);
    if (typeof err === "object" && err !== null && "statusCode" in err) {
      throw err;
    }
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
});
