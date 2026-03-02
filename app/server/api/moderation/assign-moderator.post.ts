// server/api/moderation/assign-moderator.post.ts
import { serverSupabaseUser } from "#supabase/server";
import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  console.log("[assign-moderator] endpoint called");
  try {
    const body = await readBody(event);
    console.log("[assign-moderator] body:", body);
    const { userId } = body;
    if (!userId) {
      throw createError({ statusCode: 400, message: "Missing userId" });
    }

    const user = await serverSupabaseUser(event);
    console.log("[assign-moderator] auth user:", user?.id);
    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const runtimeConfig = useRuntimeConfig();
    console.log(
      "[assign-moderator] supabase URL:",
      runtimeConfig.public.supabaseUrl,
    );
    console.log(
      "[assign-moderator] service key exists:",
      !!runtimeConfig.serviceKey,
    );
    if (!runtimeConfig.serviceKey) {
      throw createError({ statusCode: 500, message: "Service key missing" });
    }

    const serviceSupabase = createClient(
      runtimeConfig.public.supabaseUrl,
      runtimeConfig.serviceKey,
    );

    const { error } = await serviceSupabase
      .from("user")
      .update({ role: "moderator" })
      .eq("id", userId);

    if (error) {
      console.error("[assign-moderator] supabase error:", error);
      throw createError({ statusCode: 500, message: error.message });
    }

    return { success: true };
  } catch (err) {
    console.error("[assign-moderator] unhandled error:", err);
    if (err) throw err;
    throw createError({
      statusCode: 500,
    });
  }
});
