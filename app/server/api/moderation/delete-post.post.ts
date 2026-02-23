import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const { postId } = await readBody(event);

    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401 });

    const runtimeConfig = useRuntimeConfig();
    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    const { error } = await serviceSupabase
      .from("post")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Delete error:", error);
      throw createError({ statusCode: 500, message: error.message });
    }

    return { success: true };
  } catch (err) {
    console.error("Unhandled:", err);
    throw err;
  }
});
