export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, clearAuth, hasPermission } = useAuth()
  const requiredPermission = to.meta.permission as string | string[] | undefined

  if (to.path === '/auth/login') {
    if (isAuthenticated.value) {
      return navigateTo('/admin/dashboard')
    }

    return
  }

  if (!isAuthenticated.value) {
    clearAuth()
    return navigateTo('/auth/login')
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
