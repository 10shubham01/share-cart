export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  alert(user.value)
  if (!user.value) {
    return navigateTo('/login')
  }
}) 