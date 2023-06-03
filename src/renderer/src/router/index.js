import { createRouter, createWebHashHistory } from 'vue-router'
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    redirect: 'Notes',
    children: [
      {
        path: '/Notes',
        name: 'Notes',
        component: () => import('../views/Notes.vue')
      },
      {
        path: '/toDo',
        name: 'toDo',
        component: () => import('../views/toDo.vue')
      },
      {
        path: '/setting',
        name: 'setting',
        component: () => import('../views/setting.vue')
      }
    ]
  },

  {
    path: '/Pop',
    name: 'Pop',
    component: () => import('../views/Pop.vue')
  },
  {
    path: '/Screenshot',
    name: 'Screenshot',
    component: () => import('../views/Screenshot.vue')
  }
]
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
