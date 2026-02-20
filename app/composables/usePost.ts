import type { Database } from "~/types/supabase";

type Post = Database["public"]["Tables"]["post"]["Row"];

export const usePosts = () => {
  const supabase = useSupabaseClient<Database>();

  const getAllCategories = async () => {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .order("name");
    if (error) throw error;
    return data;
  };
  const getCategoryBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return data;
  };

  const getPostsByCategory = async (
    categoryId: number,
    limit: number = 10,
    offset: number = 0,
  ) => {
    // сначала получаем id постов
    const { data: postLinks, error: linkError } = await supabase
      .from("post_categories")
      .select("post_id")
      .eq("category_id", categoryId)
      .range(offset, offset + limit - 1);

    if (linkError) throw linkError;
    if (!postLinks || postLinks.length === 0) return [];

    const postIds = postLinks.map((link) => link.post_id);

    const { data: posts, error } = await supabase
      .from("post")
      .select(
        `
      *,
      author:user!author_id(*),
      post_images (*),
      comments_count:comments(count)
    `,
      )
      .in("id", postIds)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return posts as (Post & { post_images: any[] })[];
  };

  const getHomeFeed = async (postsPerCategory: number = 12) => {
    const categories = await getAllCategories();
    // Параллельно загружаем посты для всех категорий
    const postsPromises = categories.map((cat) =>
      getPostsByCategory(cat.id, postsPerCategory),
    );
    const allPostsArrays = await Promise.all(postsPromises);
    // Формируем фид, отфильтровывая категории без постов
    const feed = categories
      .map((category, index) => ({
        category,
        posts: allPostsArrays[index],
      }))
      .filter((item) => item.posts && item.posts.length > 0);
    return feed;
  };
  const getRecommendedPosts = async (limit: number = 10) => {
    const { data, error } = await supabase
      .from("post")
      .select(
        `
      *,
      author:user!author_id(*),
      post_images (*),
      comments_count:comments(count),
      likes:like_to_post(count)
    `,
      )
      .order("created_at", { ascending: false }) // временно сортируем по дате
      .limit(limit);
    if (error) throw error;
    return data;
  };
  return {
    getAllCategories,
    getPostsByCategory,
    getHomeFeed,
    getRecommendedPosts,
    getCategoryBySlug,
  };
};
