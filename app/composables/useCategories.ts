// composables/useCategories.ts
export const useCategories = () => {
  const categories = useState<any[]>("categories", () => []);

  const loadCategories = async () => {
    if (categories.value.length) return categories.value;
    const { data } = await useSupabaseClient()
      .from("category")
      .select("id, name, slug")
      .order("name");
    categories.value = data || [];
    return categories.value;
  };

  return {
    categories: readonly(categories),
    loadCategories,
  };
};
