import type { Database } from "~/types/supabase";

export const useFavorites = () => {
  const supabase = useSupabaseClient<Database>();
  const { userId } = useAuth();

  const toggleFavorite = async (postId: number) => {
    if (!userId.value) throw new Error("Not authenticated");
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId.value)
      .eq("post_id", postId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId.value, post_id: postId });
      if (error) throw error;
      return true;
    }
  };

  const isFavorite = async (postId: number): Promise<boolean> => {
    if (!userId.value) return false;
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId.value)
      .eq("post_id", postId)
      .maybeSingle();
    return !!data;
  };

  // Получение избранных постов конкретного пользователя (для профиля)
  const getUserFavorites = async (targetUserId: number) => {
    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
        post_id,
        post:post!inner(
          *,
          post_images(*),
          likes:like_to_post(count),
          comments_count:comments(count)
        )
      `,
      )
      .eq("user_id", targetUserId);
    if (error) throw error;
    return data.map((item) => ({
      ...item.post,
      isFavorited: true, // для этого пользователя они избранные
    }));
  };

  return {
    toggleFavorite,
    isFavorite,
    getUserFavorites,
  };
};
