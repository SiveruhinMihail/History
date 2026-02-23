import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  try {
    const { reportId, status = "resolved" } = await readBody(event);

    const user = await serverSupabaseUser(event);
    if (!user) throw createError({ statusCode: 401 });

    const runtimeConfig = useRuntimeConfig();
    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    const { error } = await serviceSupabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);

    if (error) {
      console.error("[resolve-report] Update error:", error);
      throw createError({ statusCode: 500, message: error.message });
    }

    return { success: true };
  } catch (err) {
    console.error("[resolve-report] Unhandled:", err);
    throw err;
  }
});
