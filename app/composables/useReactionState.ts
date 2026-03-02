// composables/useReactionState.ts
interface LikeState {
  count: number;
  liked: boolean;
}

import type { Database } from "~/types/supabase";


export const useReactionState = () => {
  const supabase = useSupabaseClient<Database>();
  const { userId } = useAuth();

  const likedPosts = useState<Map<number, LikeState>>(
    "liked-posts",
    () => new Map(),
  );
  const favoritedPosts = useState<Set<number>>(
    "favorited-posts",
    () => new Set(),
  );

  const initPostReactions = (
    postId: number,
    isLiked: boolean,
    likeCount: number,
    isFavorited: boolean,
  ) => {
    const newLiked = new Map(likedPosts.value);
    newLiked.set(postId, { count: likeCount, liked: isLiked });
    likedPosts.value = newLiked;

    const newFav = new Set(favoritedPosts.value);
    if (isFavorited) {
      newFav.add(postId);
    } else {
      newFav.delete(postId);
    }
    favoritedPosts.value = newFav;
  };

  const getLikeState = (postId: number): LikeState => {
    return likedPosts.value.get(postId) || { count: 0, liked: false };
  };

  const isFavorited = (postId: number): boolean => {
    return favoritedPosts.value.has(postId);
  };

  const toggleLike = async (postId: number) => {
    if (!userId.value) return;
    const current = getLikeState(postId);
    const newLiked = !current.liked;
    const newCount = current.count + (newLiked ? 1 : -1);

    // Создаём новый Map для реактивности
    const newMap = new Map(likedPosts.value);
    newMap.set(postId, { count: newCount, liked: newLiked });
    likedPosts.value = newMap;

    try {
      if (newLiked) {
        await supabase
          .from("like_to_post")
          .insert({ post_id: postId, user_id: userId.value });
      } else {
        await supabase
          .from("like_to_post")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId.value);
      }
    } catch (e) {
      // Откат
      const rollbackMap = new Map(likedPosts.value);
      rollbackMap.set(postId, { count: current.count, liked: current.liked });
      likedPosts.value = rollbackMap;
      throw e;
    }
  };

  const toggleFavorite = async (postId: number) => {
    if (!userId.value) return;
    const wasFavorited = isFavorited(postId);
    const newFav = new Set(favoritedPosts.value);
    if (wasFavorited) {
      newFav.delete(postId);
    } else {
      newFav.add(postId);
    }
    favoritedPosts.value = newFav;

    try {
      if (wasFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId.value);
      } else {
        await supabase
          .from("favorites")
          .insert({ post_id: postId, user_id: userId.value });
      }
    } catch (e) {
      // Откат
      const rollbackFav = new Set(favoritedPosts.value);
      if (wasFavorited) {
        rollbackFav.add(postId);
      } else {
        rollbackFav.delete(postId);
      }
      favoritedPosts.value = rollbackFav;
      throw e;
    }
  };

  return {
    initPostReactions,
    getLikeState,
    isFavorited,
    toggleLike,
    toggleFavorite,
  };
};
