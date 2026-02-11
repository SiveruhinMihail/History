export const useProtectedAction = () => {
  const { isAuthenticated, userId } = useAuth()
  const router = useRouter()
  const route = useRoute()

  const requireAuth = async (action: () => Promise<void> | void) => {
    if (!isAuthenticated.value) {
      const returnUrl = encodeURIComponent(route.fullPath)
      const confirmed = confirm(
        'Для выполнения этого действия необходимо авторизоваться. Перейти на страницу входа?'
      )
      if (confirmed) {
        await router.push(`/auth/login?returnUrl=${returnUrl}`)
      }
      return
    }

    await action()
  }


  const getCurrentUserId = (): number | null => {
    return userId.value ?? null
  }

  const isAuthor = (authorId: number): boolean => {
    return userId.value === authorId
  }

  return {
    requireAuth,
    getCurrentUserId,
    isAuthor,
  }
}