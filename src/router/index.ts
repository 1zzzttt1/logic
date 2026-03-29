import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('../views/KnowledgeView.vue')
    },
    {
      path: '/articles',
      name: 'articles',
      component: () => import('../views/ArticlesView.vue')
    },
    {
      path: '/articles/:id',
      name: 'article-detail',
      component: () => import('../views/ArticleDetailView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router