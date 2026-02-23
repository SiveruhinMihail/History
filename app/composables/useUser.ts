import type { Database } from "~/types/supabase";

export const useUser = () => {
  const supabase = useSupabaseClient<Database>();

  // Получить профиль по UUID (auth_uid)
  const getUserProfile = async (authUid: string) => {
    // Сначала получаем числовой id пользователя
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("id")
      .eq("auth_uid", authUid)
      .single();
    if (userError) throw userError;
    const userId = userData.id;

    // Теперь получаем полные данные с постами и комментариями
    const { data, error } = await supabase
      .from("user")
      .select(
        `
        *,
        posts:post!author_id(id, title, created_at, likes:like_to_post(count)),
        comments:comment!user_id(id, created_at, likes:like_to_comment(count))
      `,
      )
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  };

  const updateProfile = async (authUid: string, updates: any) => {
    const { data, error } = await supabase
      .from("user")
      .update(updates)
      .eq("auth_uid", authUid)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const checkUsernameUnique = async (
    username: string,
    excludeAuthUid?: string,
  ) => {
    let query = supabase
      .from("user")
      .select("auth_uid")
      .eq("username", username);
    if (excludeAuthUid) {
      query = query.neq("auth_uid", excludeAuthUid);
    }
    const { data } = await query;
    return data?.length === 0;
  };

  const getUserFavorites = async (userId: number) => {
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
      .eq("user_id", userId);
    if (error) throw error;
    return data.map((item) => ({ ...item.post, isFavorited: true }));
  };
  const getUserActivityByDay = async (userUuid: string, days = 30) => {
    const supabase = useSupabaseClient();

    // Найдем числовой id пользователя по uuid
    const { data: user } = await supabase
      .from("user")
      .select("id")
      .eq("auth_uid", userUuid)
      .single();
    if (!user) throw new Error("User not found");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const start = startDate.toISOString();
    const end = endDate.toISOString();

    // Лайки к постам, полученные пользователем (как автор поста)
    const { data: likesReceived } = await supabase
      .from("like_to_post")
      .select("created_at")
      .gte("created_at", start)
      .lte("created_at", end)
      .eq("post.author_id", user.id); // нужно через join, но в RPC проще

    // Лайки к комментариям, полученные пользователем

    // Комментарии, оставленные пользователем
    const { data: comments } = await supabase
      .from("comments")
      .select("created_at")
      .gte("created_at", start)
      .lte("created_at", end)
      .eq("user_id", user.id);

    // Посты, созданные пользователем (если нужно отслеживать активность постинга)

    // Агрегируем по дням
    const dates = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
    }

    const likesReceivedCount = dates.map(
      (date) =>
        likesReceived?.filter((item) => item.created_at?.split("T")[0] === date)
          .length || 0,
    );
    const commentsCount = dates.map(
      (date) =>
        comments?.filter((item) => item.created_at?.split("T")[0] === date)
          .length || 0,
    );
    // можно добавить и другие метрики

    return { dates, likesReceivedCount, commentsCount };
  };

  // composables/useUser.ts (дополнение)
  const getUserActivityStats = async (userUuid: string) => {
    // Сначала найдём числовой id пользователя
    const { data: userData } = await supabase
      .from("user")
      .select("id")
      .eq("auth_uid", userUuid)
      .single();

    if (!userData) throw new Error("User not found");
    const userId = userData.id;

    const { count: postsCount } = await supabase
      .from("post")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);

    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { data: posts } = await supabase
      .from("post")
      .select("id, likes:like_to_post(count)")
      .eq("author_id", userId);
    const totalLikesReceived =
      posts?.reduce((acc, p) => acc + (p.likes?.[0]?.count || 0), 0) || 0;

    // Лайки, отданные пользователем (на посты и комментарии)
    const { count: likesGivenOnPosts } = await supabase
      .from("like_to_post")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: likesGivenOnComments } = await supabase
      .from("like_to_comment")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const totalLikesGiven =
      (likesGivenOnPosts || 0) + (likesGivenOnComments || 0);

    return {
      postsCount: postsCount || 0,
      commentsCount: commentsCount || 0,
      totalLikesReceived,
      totalLikesGiven,
    };
  };
  const getUserStats = async (userId: number) => {
    const { count: postsCount } = await supabase
      .from("post")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);

    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Полученные лайки (лайки на посты пользователя)
    const { data: posts } = await supabase
      .from("post")
      .select("id")
      .eq("author_id", userId);
    const postIds = posts?.map((p) => p.id) || [];
    let totalLikesReceived = 0;
    if (postIds.length > 0) {
      const { count } = await supabase
        .from("like_to_post")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);
      totalLikesReceived = count || 0;
    }

    // Отданные лайки (лайки пользователя на чужие посты)
    const { count: totalLikesGiven } = await supabase
      .from("like_to_post")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      postsCount: postsCount || 0,
      commentsCount: commentsCount || 0,
      totalLikesReceived,
      totalLikesGiven: totalLikesGiven || 0,
    };
  };
  // composables/useUser.ts
  // composables/useUser.ts
  const getUserActivityChart = async (userId: number) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString();

    // Получаем комментарии пользователя за последние 30 дней (игнорируем null created_at)
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate)
      .not("created_at", "is", null); // исключаем null

    if (commentsError) throw commentsError;

    // Получаем лайки, полученные на посты пользователя
    const { data: posts } = await supabase
      .from("post")
      .select("id")
      .eq("author_id", userId);
    const postIds = posts?.map((p) => p.id) || [];

    let likesData: { created_at: string | null }[] = [];
    if (postIds.length > 0) {
      const { data: likes, error: likesError } = await supabase
        .from("like_to_post")
        .select("created_at")
        .in("post_id", postIds)
        .gte("created_at", startDate)
        .not("created_at", "is", null);
      if (likesError) throw likesError;
      likesData = likes || [];
    }

    // Фильтруем null (хотя мы уже исключили в запросе, но для надёжности)
    const validComments = (comments || []).filter(
      (c) => c.created_at !== null,
    ) as { created_at: string }[];
    const validLikes = likesData.filter((l) => l.created_at !== null);

    // Группируем по дням
    const labels: string[] = [];
    const likesCount: number[] = [];
    const commentsCount: number[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0); // начало дня
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      labels.push(dateStr as string);

      const dayStart = date.toISOString();
      const dayEnd = new Date(date.getTime() + 86400000).toISOString();

      const likesDay = validLikes.filter((l) => {
        const d = new Date(l.created_at as string);
        return d >= new Date(dayStart) && d < new Date(dayEnd);
      }).length;
      const commentsDay = validComments.filter((c) => {
        const d = new Date(c.created_at);
        return d >= new Date(dayStart) && d < new Date(dayEnd);
      }).length;

      likesCount.push(likesDay);
      commentsCount.push(commentsDay);
    }

    return { labels, likes: likesCount, comments: commentsCount };
  };
  return {
    getUserProfile,
    updateProfile,
    checkUsernameUnique,
    getUserFavorites,
    getUserActivityStats,
    getUserActivityByDay,
    getUserStats,
    getUserActivityChart,
  };
};
