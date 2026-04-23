export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  const config = useRuntimeConfig()

  if (to.path === '/login') {
    if (loggedIn.value) {
      return navigateTo('/')
    }
    return
  }

  if (config.public.desktopMode) {
    return
  }

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
