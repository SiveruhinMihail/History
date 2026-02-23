import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const { postId } = await readBody(event);
    if (!postId)
      throw createError({ statusCode: 400, message: "Missing postId" });

    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401, message: "Unauthorized" });

    const runtimeConfig = useRuntimeConfig();
    if (!runtimeConfig.serviceKey) {
      throw createError({
        statusCode: 500,
        message: "Server configuration error",
      });
    }

    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    const { error } = await serviceSupabase
      .from("post")
      .update({ moderation_status: "rejected" })
      .eq("id", postId);

    if (error) throw createError({ statusCode: 500, message: error.message });

    return { success: true };
  } catch (err) {
    console.error("[reject-post]", err);
    throw err;
  }
});
