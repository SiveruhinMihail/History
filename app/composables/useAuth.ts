// composables/useAuth.ts
import type { Database } from "~/types/supabase";

// Типы из сгенерированной схемы
type UserRow = Database["public"]["Tables"]["user"]["Row"];
type UserInsert = Database["public"]["Tables"]["user"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["user"]["Update"];

export const useAuth = () => {
  const supabase = useSupabaseClient<Database>();
  const authUser = useSupabaseUser();

  const profile = useState<UserRow | null>("auth-profile", () => null);
  const isLoading = useState("auth-loading", () => true);
  const loaded = useState("auth-loaded", () => false);

  // --- Загрузка профиля ---
  const loadProfile = async (force = false) => {
    if (loaded.value && !force) return profile.value;

    isLoading.value = true;

    // Нет пользователя – сбрасываем профиль
    if (!authUser.value) {
      profile.value = null;
      isLoading.value = false;
      loaded.value = true;
      return null;
    }

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("auth_uid", authUser.value.sub)
      .maybeSingle();

    if (error) {
      console.error("Ошибка загрузки профиля:", error);
      profile.value = null;
    } else {
      profile.value = data;
    }
    isLoading.value = false;
    loaded.value = true;
    return profile.value;
  };
  if (import.meta.client && !loaded.value) {
    loadProfile();
  }

  // --- Генерация уникального username ---
  const generateUniqueUsername = async (base: string): Promise<string> => {
    const normalized = base
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const { data } = await supabase
      .from("user")
      .select("username")
      .eq("username", normalized)
      .maybeSingle();

    if (!data) return normalized;

    for (let i = 0; i < 10; i++) {
      const candidate = `${normalized}_${Math.floor(Math.random() * 10000)}`;
      const { data: existing } = await supabase
        .from("user")
        .select("username")
        .eq("username", candidate)
        .maybeSingle();
      if (!existing) return candidate;
    }
    return `${normalized}_${Date.now()}`;
  };

  // --- Регистрация ---
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Пользователь не создан");

    const username = await generateUniqueUsername(displayName);

    // ✅ TS теперь знает все поля!
    const newUser: UserInsert = {
      auth_uid: authData.user.id,
      username,
      use: displayName,
      email,
      status: "active",
      rating: 0,
      role: "user",
      created_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase.from("user").insert(newUser);

    if (profileError) {
      console.error("Ошибка создания профиля:", profileError);
      throw new Error("Не удалось создать профиль");
    }
    while (!authUser.value) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await loadProfile(true);
    return authData;
  };

  // --- Вход ---
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    while (!authUser.value) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await loadProfile(true);
    return data;
  };

  // --- Выход ---
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Очищаем локальное состояние
    profile.value = null;
    isLoading.value = false;
    loaded.value = false;

    // Редирект на главную
    await navigateTo("/");
  };

  // --- Обновление профиля ---
  const updateProfile = async (updates: UserUpdate) => {
    if (!profile.value) throw new Error("Профиль не загружен");

    // Проверка уникальности username при смене
    if (updates.username && updates.username !== profile.value.username) {
      const { data: existing } = await supabase
        .from("user")
        .select("username")
        .eq("username", updates.username)
        .maybeSingle();
      if (existing) throw new Error("Этот никнейм уже занят");
    }

    const { data, error } = await supabase
      .from("user")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.value.id)
      .select()
      .single();

    if (error) throw error;
    profile.value = data;
    return profile.value;
  };

  // --- Синхронный геттер ---
  const getCurrentProfile = () => profile.value;
  // --- Реактивные вычисления ---
  const isAuthenticated = computed(() => !!authUser.value && !!profile.value);
  const userId = computed(() => profile.value?.id);
  const authUid = computed(() => authUser.value?.sub);
  const username = computed(() => profile.value?.username);
  const displayName = computed(() => profile.value?.use);
  const userRole = computed(() => profile.value?.role || "guest");
  const isModerator = computed(() => profile.value?.role === "moderator");
  const isAdmin = computed(() => profile.value?.role === "admin");

  return {
    authUser,
    authUid,
    profile,
    isLoading,
    isAuthenticated,
    userId,
    username,
    displayName,
    userRole,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
    loadProfile, // метод для ручной загрузки
    generateUniqueUsername,
    getCurrentProfile,
    isModerator,
  };
};
