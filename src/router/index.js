import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AuthGoogleCallback from '../views/AuthGoogleCallback.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ProductCatalogView from '../views/ProductCatalogView.vue'
import ProductDetailView from '../views/ProductDetailView.vue'
import SupplierProductCreateView from '../views/SupplierProductCreateView.vue'
import SupplierProductEditView from '../views/SupplierProductEditView.vue'
import SupplierDashboardView from '../views/SupplierDashboardView.vue'
import CartView from '../views/CartView.vue'
import CustomerOrdersView from '../views/CustomerOrdersView.vue'
import InvitationsView from '../views/InvitationsView.vue'
import PublicInvitationView from '../views/PublicInvitationView.vue'
import ProfileView from '../views/ProfileView.vue'
import ConfirmEmailView from '../views/ConfirmEmailView.vue'
import { loadSession } from '../lib/session'

async function resolveSession() {
  return loadSession()
}

function createProfileGuard(tipoPerfil, destino) {
  return async (to) => {
    const { user, error } = await resolveSession()

    if (error) {
      return { name: 'login', query: { erroConexao: '1', redirect: to.fullPath } }
    }

    if (!user) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (user.tipo_perfil !== tipoPerfil) {
      return { name: 'vitrine', query: { aviso: destino } }
    }

    return true
  }
}

const requireSupplier = createProfileGuard('fornecedor', 'fornecedor')
const requireCustomer = createProfileGuard('cliente', 'carrinho')
const requireAuthenticated = async (to) => {
  const { user, error } = await resolveSession()
  if (error) return { name: 'login', query: { erroConexao: '1', redirect: to.fullPath } }
  if (!user) return { name: 'login', query: { redirect: to.fullPath } }
  return true
}

const requireCompleteCustomer = async (to) => {
  const { user, error } = await resolveSession()
  if (error) return { name: 'login', query: { erroConexao: '1', redirect: to.fullPath } }
  if (!user) return { name: 'login', query: { redirect: to.fullPath } }
  if (user.tipo_perfil !== 'cliente') return { name: 'vitrine', query: { aviso: 'carrinho' } }
  if (!user.perfil_completo) return { name: 'perfil', query: { completar: '1', redirect: to.fullPath } }
  return true
}

const requireCompleteSupplier = async (to) => {
  const { user, error } = await resolveSession()
  if (error) return { name: 'login', query: { erroConexao: '1', redirect: to.fullPath } }
  if (!user) return { path: '/login/fornecedor', query: { redirect: to.fullPath } }
  if (user.tipo_perfil !== 'fornecedor') return { name: 'vitrine', query: { aviso: 'fornecedor' } }
  if (!user.perfil_completo) return { name: 'perfil', query: { completar: '1', redirect: to.fullPath } }
  return true
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView, meta: { chrome: false } },
    { path: '/login/:tipo_perfil(cliente|fornecedor)', component: LoginView, meta: { chrome: false } },
    { path: '/cadastro', name: 'cadastro', component: RegisterView, meta: { chrome: false } },
    { path: '/cadastro/:tipo_perfil(cliente|fornecedor)', component: RegisterView, meta: { chrome: false } },
    {
      path: '/auth/google/callback',
      name: 'auth-google-callback',
      component: AuthGoogleCallback,
      meta: { chrome: false },
    },
    { path: '/recuperar-senha', name: 'recuperar-senha', component: ForgotPasswordView, meta: { chrome: false } },
    { path: '/redefinir-senha', name: 'redefinir-senha', component: ResetPasswordView, meta: { chrome: false } },
    { path: '/confirmar-email', name: 'confirmar-email', component: ConfirmEmailView, meta: { chrome: false } },
    { path: '/vitrine', name: 'vitrine', component: ProductCatalogView },
    { path: '/produto/:id', name: 'produto-detalhe', component: ProductDetailView },
    { path: '/perfil', name: 'perfil', component: ProfileView, beforeEnter: requireAuthenticated },
    { path: '/carrinho', name: 'carrinho', component: CartView },
    { path: '/orcamentos', name: 'meus-orcamentos', component: CustomerOrdersView, beforeEnter: requireCustomer },
    { path: '/convites', name: 'convites', component: InvitationsView, beforeEnter: requireCustomer },
    {
      path: '/convite/:slug',
      name: 'convite-publico',
      component: PublicInvitationView,
      meta: { chrome: false },
    },
    {
      path: '/fornecedor/painel',
      name: 'fornecedor-painel',
      component: SupplierDashboardView,
      beforeEnter: requireSupplier,
    },
    {
      path: '/fornecedor/produtos/novo',
      name: 'produto-novo',
      component: SupplierProductCreateView,
      beforeEnter: requireCompleteSupplier,
    },
    {
      path: '/fornecedor/produtos/:id/editar',
      name: 'produto-editar',
      component: SupplierProductEditView,
      beforeEnter: requireCompleteSupplier,
    },
    {
      path: '/chat',
      name: 'chat',
      component: CustomerOrdersView,
      beforeEnter: async (to) => {
        const { user, error } = await resolveSession()
        if (error || !user) return { name: 'login', query: { redirect: '/chat' } }
        if (user.tipo_perfil === 'fornecedor') return { name: 'fornecedor-painel' }
        if (user.tipo_perfil !== 'cliente') return { name: 'vitrine' }
        return true
      },
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }

    return { top: 0 }
  },
})

export default router
