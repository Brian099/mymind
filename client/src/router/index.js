import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DashboardView from '../views/DashboardView.vue';
import EditorView from '../views/EditorView.vue';
import ShareView from '../views/ShareView.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { guestOnly: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/mindmap/:id',
    name: 'Editor',
    component: EditorView,
    meta: { requiresAuth: true }
  },
  {
    path: '/share/:shareId',
    name: 'Share',
    component: ShareView,
    meta: { public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem('mindmap_token');

  if (to.meta.requiresAuth) {
    if (!token) {
      return next('/login');
    }
  } else if (to.meta.guestOnly) {
    if (token) {
      return next('/dashboard');
    }
  }
  next();
});

export default router;
