import type { Database } from "~/types/supabase";

type Category = Database["public"]["Tables"]["category"]["Row"];
type Post = Database["public"]["Tables"]["post"]["Row"] & {
  post_images?: Database["public"]["Tables"]["post_images"]["Row"][];
  likes?: { count: number }[];
  comments?: { count: number }[];
  categories?: { category: Category }[];
};
type FeedItem = { category: Category; posts: Post[] };

export const usePosts = () => {
  const supabase = useSupabaseClient<Database>();

  const getHomeFeed = async (limit: number = 12) => {
    const { data: categories } = await supabase
      .from("category")
      .select("id, name, slug, created_at");

    if (!categories) return [];

    const feed = await Promise.all(
      categories.map(async (category) => {
        const { data: postIdsData } = await supabase
          .from("post_categories")
          .select("post_id")
          .eq("category_id", category.id);

        if (!postIdsData || postIdsData.length === 0) {
          return { category, posts: [] };
        }

        const postIds = postIdsData.map(p => p.post_id);

        const { data: posts } = await supabase
          .from("post")
          .select(
            `
            *,
            post_images (*),
            likes:like_to_post(count),
            comments:comments(count),
            categories:post_categories(category:category_id(id, name, slug))
          `,
          )
          .in("id", postIds)
          .eq("moderation_status", "approved")
          .order("rating", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(limit);

        return {
          category,
          posts: posts || [],
        };
      }),
    );

    return feed.filter(item => item.posts.length > 0);
  };

  const getRecommendedPosts = async (limit: number = 10) => {
    const { data } = await supabase
      .from("post")
      .select(
        `
        *,
        post_images (*),
        likes:like_to_post(count),
        comments:comments(count),
        categories:post_categories(category:category_id(id, name, slug))
      `,
      )
      .eq("moderation_status", "approved")
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  };

  const getPostsByCategory = async (
    categoryId: number,
    limit: number = 20,
    offset: number = 0,
  ) => {
    const { data: postIdsData } = await supabase
      .from("post_categories")
      .select("post_id")
      .eq("category_id", categoryId);

    if (!postIdsData || postIdsData.length === 0) {
      return [];
    }

    const postIds = postIdsData.map(p => p.post_id);

    const { data } = await supabase
      .from("post")
      .select(
        `
        *,
        post_images (*),
        likes:like_to_post(count),
        comments:comments(count),
        categories:post_categories(category:category_id(id, name, slug))
      `,
      )
      .in("id", postIds)
      .eq("moderation_status", "approved")
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return data || [];
  };

  const getCategoryBySlug = async (slug: string) => {
    const { data } = await supabase
      .from("category")
      .select("*")
      .eq("slug", slug)
      .single();
    return data;
  };

  return {
    getHomeFeed,
    getRecommendedPosts,
    getPostsByCategory,
    getCategoryBySlug,
  };
};