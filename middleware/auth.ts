export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value && to.path !== '/login' && to.path !== '/auth/callback') {
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo('/groceries')
  }
}) 