export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();

  // Маршруты, которые требуют авторизации
  const protectedRoutes = {
    // Комментарии
    "/posts/:id/comment": true,
    "/api/comments": true,

    // Вступление в сообщества
    "/communities/:id/join": true,
    "/communities/:id/subscribe": true,
    "/communities/:id/unsubscribe": true,

    // Профиль (просмотр своего профиля)
    "/profile": true,
    "/profile/edit": true,
    "/profile/settings": true,

    // Создание контента
    "/posts/create": true,
    "/communities/create": true,
  };

  // Проверяем, является ли текущий маршрут защищенным
  const isProtectedRoute = Object.keys(protectedRoutes).some((route) => {
    const pattern = route.replace(/:\w+/g, "([^/]+)");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(to.path);
  });

  // Если маршрут защищенный и пользователь не авторизован
  if (isProtectedRoute && !user.value) {
    // Сохраняем URL, куда пытался попасть пользователь
    const returnUrl = encodeURIComponent(to.fullPath);

    // Перенаправляем на страницу логина с сообщением
    return navigateTo(
      `/auth/login?returnUrl=${returnUrl}&message=Для выполнения этого действия необходимо авторизоваться`,
    );
  }
});
