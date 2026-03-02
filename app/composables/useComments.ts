// composables/useComments.ts
import type { Database } from "~/types/supabase";

export const useComments = () => {
  const supabase = useSupabaseClient<Database>();

  const getCommentsForPost = async (postId: number) => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:user_id(*),
        replies:comments!parent_id(*)
      `,
      )
      .eq("post_id", postId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  };

  return { getCommentsForPost };
};
