import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import { useMainStore } from '../store/mainStore.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/solicitudes', name: 'solicitudes', component: () => import('../views/SolicitudesView.vue') },
    { path: '/historial', name: 'historial', component: () => import('../views/HistorialView.vue') },
    { path: '/calendario', name: 'calendario', component: () => import('../views/CalendarioView.vue') },
    { path: '/usuarios', name: 'usuarios', component: () => import('../views/UsuariosView.vue') },
    { path: '/mapa', name: 'mapa', component: () => import('../views/MapaView.vue') },
    { path: '/portal', name: 'portal', component: () => import('../views/PublicPortalView.vue'), meta: { public: true } },
    { path: '/reportes', name: 'reportes', component: () => import('../views/ReportesView.vue') },
    { path: '/personal', name: 'personal', component: () => import('../views/PersonalView.vue') },
    { path: '/equipos', name: 'equipos', component: () => import('../views/EquiposView.vue') },
    { path: '/configuraciones', name: 'configuraciones', component: () => import('../views/ConfiguracionesView.vue') },
    { path: '/auditoria', name: 'auditoria', component: () => import('../views/AuditoriaView.vue') },
    { path: '/inventario', name: 'inventario', component: () => import('../views/InventarioView.vue') },
    { path: '/acerca', name: 'acerca', component: () => import('../views/AcercaDeView.vue') },
    { path: '/ai-arboricultura', name: 'ai-arboricultura', component: () => import('../views/AIAssistantView.vue') }
  ]
})

router.beforeEach((to, from, next) => {
  const mainStore = useMainStore()
  const user = mainStore.uiState.user

  if (to.meta.public) {
    next()
    return
  }

  if (!user) {
    next()
    return
  }

  const role = user.role
  const path = to.path

  if (role === 'USER') {
    const allowed = ['/', '/solicitudes', '/mapa', '/historial', '/reportes', '/calendario', '/acerca', '/ai-arboricultura']
    if (!allowed.includes(path)) {
      mainStore.showToast('No tiene permisos para acceder a esta sección.', 'error')
      next('/')
      return
    }
  } else if (role === 'ADMIN') {
    const allowed = ['/', '/solicitudes', '/mapa', '/historial', '/reportes', '/calendario', '/personal', '/equipos', '/inventario', '/acerca', '/ai-arboricultura']
    if (!allowed.includes(path)) {
      mainStore.showToast('No tiene permisos para acceder a esta sección.', 'error')
      next('/')
      return
    }
  }

  next()
})

export default router
