// server/api/moderation/delete-comment.post.ts
import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const { commentId } = await readBody(event);

    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401 });

    const runtimeConfig = useRuntimeConfig();
    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    const { error } = await serviceSupabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("[delete-comment] Delete error:", error);
      throw createError({ statusCode: 500, message: error.message });
    }

    return { success: true };
  } catch (err) {
    console.error("Unhandled:", err);
    throw err;
  }
});
