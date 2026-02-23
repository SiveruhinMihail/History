import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = Number(query.id);
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const supabase = await serverSupabaseClient(event);
  const { data, error } = await supabase
    .from("post")
    .select("id, title, description, author_id")
    .eq("id", id)
    .single();

  if (error) throw createError({ statusCode: 404, message: "Post not found" });
  return { data };
});
