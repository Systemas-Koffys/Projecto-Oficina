import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/solicitudes', name: 'solicitudes', component: () => import('../views/SolicitudesView.vue') },
    { path: '/historial', name: 'historial', component: () => import('../views/HistorialView.vue') },
    { path: '/calendario', name: 'calendario', component: () => import('../views/CalendarioView.vue') },
    { path: '/usuarios', name: 'usuarios', component: () => import('../views/UsuariosView.vue') },
    { path: '/reportes', name: 'reportes', component: () => import('../views/ReportesView.vue') },
    { path: '/personal', name: 'personal', component: () => import('../views/PersonalView.vue') },
    { path: '/equipos', name: 'equipos', component: () => import('../views/EquiposView.vue') },
    { path: '/configuraciones', name: 'configuraciones', component: () => import('../views/ConfiguracionesView.vue') },
    { path: '/acerca', name: 'acerca', component: () => import('../views/AcercaDeView.vue') }
  ]
})
export default router
