// middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuth();
  const user = useSupabaseUser();

  // Маршруты, доступные без авторизации
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/",
    "/about",
    "/privacy",
    "/terms",
  ];

  // Если пользователь не авторизован и пытается попасть на защищенный маршрут
  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo("/auth/login");
  }

  // Если пользователь авторизован и пытается попасть на страницы авторизации
  if (user.value && to.path.startsWith("/auth")) {
    return navigateTo("/");
  }
});
