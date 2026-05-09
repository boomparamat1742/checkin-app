export default defineNuxtRouteMiddleware(() => {
  if (process.client) {
    const admin = localStorage.getItem('admin')

    if (!admin) {
      return navigateTo('/admin/login')
    }
  }
})