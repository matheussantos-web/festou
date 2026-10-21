import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ProductCatalogView from '../views/ProductCatalogView.vue'
import SupplierProductCreateView from '../views/SupplierProductCreateView.vue'
import CartView from '../views/CartView.vue'
import { api } from '../lib/api'

async function requireSupplier(to) {
  try {
    const { user } = await api('/auth/me')

    if (!user) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (user.tipo_perfil !== 'fornecedor') {
      return { name: 'vitrine', query: { aviso: 'fornecedor' } }
    }

    return true
  } catch {
    return { name: 'login', query: { configurarNeon: '1' } }
  }
}

async function requireCustomer(to) {
  try {
    const { user } = await api('/auth/me')

    if (!user) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (user.tipo_perfil !== 'cliente') {
      return { name: 'vitrine', query: { aviso: 'carrinho' } }
    }

    return true
  } catch {
    return { name: 'login', query: { configurarNeon: '1' } }
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/cadastro', name: 'cadastro', component: RegisterView },
    { path: '/vitrine', name: 'vitrine', component: ProductCatalogView },
    { path: '/carrinho', name: 'carrinho', component: CartView, beforeEnter: requireCustomer },
    {
      path: '/fornecedor/produtos/novo',
      name: 'produto-novo',
      component: SupplierProductCreateView,
      beforeEnter: requireSupplier,
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

export default router