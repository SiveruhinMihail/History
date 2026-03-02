// server/api/moderation/delete-community.post.ts
import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("[delete-community] body:", body);

    const { communityId } = body;
    if (!communityId)
      throw createError({ statusCode: 400, message: "Missing communityId" });

    const user = await serverSupabaseUser(event);
    console.log("[delete-community] auth user:", user?.id);
    if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

    const runtimeConfig = useRuntimeConfig();
    console.log(
      "[delete-community] service key exists:",
      !!runtimeConfig.serviceKey,
    );
    if (!runtimeConfig.serviceKey) {
      throw createError({ statusCode: 500, message: "Service key missing" });
    }

    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    // Пытаемся удалить и получить данные удалённой записи
    const { data, error } = await serviceSupabase
      .from("community")
      .delete()
      .eq("id", communityId)
      .select();

    if (error) {
      console.error("[delete-community] supabase error:", error);
      throw createError({ statusCode: 500, message: error.message });
    }

    console.log("[delete-community] deleted:", data);
    return { success: true };
  } catch (err) {
    console.error("[delete-community] unhandled error:", err);
    if (err) throw err;
    throw createError({
      statusCode: 500,
    });
  }
});
