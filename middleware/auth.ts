export default defineNuxtRouteMiddleware((to) => {
  const { user, isAuthenticated, clearAuth, hasPermission } = useAuth()
  const requiredPermission = to.meta.permission as string | string[] | undefined
  const publicAuthPages = ['/auth/login', '/auth/register']
  const isCustomerUser = computed(() => {
    if (user.value?.isSuperUser) return false
    return user.value?.roles?.some((role) => role.name?.toLowerCase() === 'customer') ?? false
  })

  if (publicAuthPages.includes(to.path)) {
    if (isAuthenticated.value) {
      return navigateTo(isCustomerUser.value ? '/' : '/admin/dashboard')
    }

    return
  }

  if (!isAuthenticated.value) {
    clearAuth()
    return navigateTo('/auth/login')
  }

  if (isCustomerUser.value && to.path.startsWith('/admin')) {
    return navigateTo('/')
  }

  if (!hasPermission(requiredPermission)) {
    if (to.path !== '/admin/dashboard') {
      return navigateTo('/admin/dashboard')
    }

    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to access this page.'
    }))
  }
})
