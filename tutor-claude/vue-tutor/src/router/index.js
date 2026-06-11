import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '홈' }
  },

  // ===== 1단계: Basic =====
  {
    path: '/basic/template',
    component: () => import('@/tutorials/01_basic/01_TemplateSyntax.vue'),
    meta: { title: '템플릿 문법', level: 'basic' }
  },
  {
    path: '/basic/reactive',
    component: () => import('@/tutorials/01_basic/02_ReactiveData.vue'),
    meta: { title: '반응형 데이터', level: 'basic' }
  },
  {
    path: '/basic/events',
    component: () => import('@/tutorials/01_basic/03_EventHandling.vue'),
    meta: { title: '이벤트 처리', level: 'basic' }
  },
  {
    path: '/basic/conditional',
    component: () => import('@/tutorials/01_basic/04_ConditionalList.vue'),
    meta: { title: '조건부/리스트 렌더링', level: 'basic' }
  },
  {
    path: '/basic/form',
    component: () => import('@/tutorials/01_basic/05_FormBinding.vue'),
    meta: { title: '폼 바인딩 (v-model)', level: 'basic' }
  },
  {
    path: '/basic/component',
    component: () => import('@/tutorials/01_basic/06_Components.vue'),
    meta: { title: '컴포넌트 기초', level: 'basic' }
  },

  // ===== 2단계: Intermediate =====
  {
    path: '/intermediate/composition-api',
    component: () => import('@/tutorials/02_intermediate/01_CompositionAPI.vue'),
    meta: { title: 'Composition API', level: 'intermediate' }
  },
  {
    path: '/intermediate/props-emits',
    component: () => import('@/tutorials/02_intermediate/02_PropsEmits.vue'),
    meta: { title: 'Props & Emits', level: 'intermediate' }
  },
  {
    path: '/intermediate/lifecycle',
    component: () => import('@/tutorials/02_intermediate/03_Lifecycle.vue'),
    meta: { title: '생명주기 훅', level: 'intermediate' }
  },
  {
    path: '/intermediate/slots',
    component: () => import('@/tutorials/02_intermediate/04_Slots.vue'),
    meta: { title: 'Slots', level: 'intermediate' }
  },
  {
    path: '/intermediate/composables',
    component: () => import('@/tutorials/02_intermediate/05_Composables.vue'),
    meta: { title: 'Composables', level: 'intermediate' }
  },
  {
    path: '/intermediate/router',
    component: () => import('@/tutorials/02_intermediate/06_VueRouter.vue'),
    meta: { title: 'Vue Router', level: 'intermediate' }
  },
  {
    path: '/intermediate/pinia',
    component: () => import('@/tutorials/02_intermediate/07_Pinia.vue'),
    meta: { title: 'Pinia 상태관리', level: 'intermediate' }
  },

  // ===== 3단계: Advanced =====
  {
    path: '/advanced/directives',
    component: () => import('@/tutorials/03_advanced/01_CustomDirectives.vue'),
    meta: { title: '커스텀 디렉티브', level: 'advanced' }
  },
  {
    path: '/advanced/teleport',
    component: () => import('@/tutorials/03_advanced/02_TeleportKeepAlive.vue'),
    meta: { title: 'Teleport & KeepAlive', level: 'advanced' }
  },
  {
    path: '/advanced/async',
    component: () => import('@/tutorials/03_advanced/03_AsyncComponents.vue'),
    meta: { title: 'Async & Suspense', level: 'advanced' }
  },
  {
    path: '/advanced/performance',
    component: () => import('@/tutorials/03_advanced/04_Performance.vue'),
    meta: { title: '성능 최적화', level: 'advanced' }
  },
  {
    path: '/advanced/patterns',
    component: () => import('@/tutorials/03_advanced/05_Patterns.vue'),
    meta: { title: '실무 패턴', level: 'advanced' }
  },

  // ===== 4단계: 실전 프로젝트 =====
  {
    path: '/project',
    component: () => import('@/tutorials/04_realworld/TodoApp.vue'),
    meta: { title: '실전 Todo 앱', level: 'project' }
  },

  // Vue Router 중첩 라우팅 예시용
  {
    path: '/router-demo',
    component: () => import('@/tutorials/02_intermediate/06_VueRouter.vue'),
    children: [
      { path: 'about', component: () => import('@/views/HomeView.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 네비게이션 가드 예시 (Advanced에서 자세히 다룸)
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'Vue 튜토리얼'} | Vue 3 완전 정복`
  next()
})

export default router
