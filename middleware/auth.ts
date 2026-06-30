export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('auth_token')

  if (to.path === '/auth/login') {
    if (token.value) {
      return navigateTo('/admin/dashboard')
    }

    return
  }

  if (!token.value) {
    return navigateTo('/auth/login')
  }
})
