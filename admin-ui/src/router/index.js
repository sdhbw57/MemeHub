import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'images',
        name: 'Images',
        component: () => import('@/views/Images.vue'),
        meta: { title: '图片管理' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'tag-rules',
        name: 'TagRules',
        component: () => import('@/views/TagRules.vue'),
        meta: { title: '标签规则' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: 'admins',
        name: 'Admins',
        component: () => import('@/views/Admins.vue'),
        meta: { title: '管理员', requiresSuperAdmin: true }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/Logs.vue'),
        meta: { title: '操作日志' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const token = localStorage.getItem('admin_token');

  if (to.meta.requiresAuth !== false && !token) {
    next('/login');
    return;
  }

  if (to.path === '/login' && token) {
    next('/');
    return;
  }

  if (to.meta.requiresSuperAdmin && userStore.user?.role !== 'super_admin') {
    next('/dashboard');
    return;
  }

  next();
});

export default router;
