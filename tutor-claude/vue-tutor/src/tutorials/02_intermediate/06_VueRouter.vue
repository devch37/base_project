<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-intermediate">Intermediate · 06</div>
      <h1>🗺️ Vue Router</h1>
      <p>Vue 공식 라우터 — SPA(Single Page Application)의 페이지 네비게이션을 관리합니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ 기본 라우터 설정</h2>
      <div class="code-block">{{ routerSetupCode }}</div>
    </div>

    <div class="section-card">
      <h2>2️⃣ 라우터 사용 — RouterLink vs useRouter</h2>
      <div class="demo-box">
        <h4>🎮 프로그래밍 방식 네비게이션</h4>
        <div class="btn-group">
          <button class="btn btn-primary" @click="goHome">홈으로</button>
          <button class="btn btn-secondary" @click="goToBasic">첫 번째 강의로</button>
          <button class="btn btn-secondary" @click="goBack">뒤로가기</button>
          <button class="btn btn-secondary" @click="goForward">앞으로가기</button>
        </div>
        <div class="result-box" style="margin-top:12px">
          현재 경로: <strong>{{ currentRoute.path }}</strong><br>
          현재 이름: <strong>{{ currentRoute.name || '(없음)' }}</strong>
        </div>
      </div>
      <div class="code-block">{{ routerUsageCode }}</div>
    </div>

    <div class="section-card">
      <h2>3️⃣ 동적 라우트 (Params & Query)</h2>
      <div class="demo-box">
        <h4>🎮 URL 파라미터 & 쿼리</h4>
        <div class="form-group">
          <label class="form-label">사용자 ID (Params)</label>
          <input class="form-input" v-model.number="userId" type="number" />
        </div>
        <div class="form-group">
          <label class="form-label">검색어 (Query)</label>
          <input class="form-input" v-model="searchQuery" />
        </div>
        <div class="result-box">
          params URL: /users/<strong>{{ userId }}</strong><br>
          query URL: /search?q=<strong>{{ searchQuery }}</strong>&page=<strong>1</strong>
        </div>
      </div>
      <div class="code-block">{{ paramsCode }}</div>
    </div>

    <div class="section-card">
      <h2>4️⃣ 네비게이션 가드 ⭐ 실무 핵심</h2>
      <div class="code-block">{{ guardCode }}</div>
      <div class="info">
        🔑 네비게이션 가드 활용:<br>
        - <strong>beforeEach</strong>: 인증 확인 (로그인 안 했으면 /login으로 리다이렉트)<br>
        - <strong>beforeEnter</strong>: 특정 라우트에만 적용되는 가드<br>
        - <strong>onBeforeRouteLeave</strong>: 페이지 이탈 시 "저장하지 않고 나가시겠습니까?" 확인
      </div>
    </div>

    <div class="section-card">
      <h2>5️⃣ useRoute vs useRouter</h2>
      <div class="code-block">{{ routeVsRouterCode }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route)
const userId = ref(1)
const searchQuery = ref('Vue')

const goHome = () => router.push('/')
const goToBasic = () => router.push('/basic/template')
const goBack = () => router.back()
const goForward = () => router.forward()

const routerSetupCode = `// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: HomeView },

  // 동적 라우트 (id 파라미터)
  { path: '/users/:id', component: UserView },

  // 이름 있는 라우트
  { path: '/posts/:id', name: 'post-detail', component: PostView },

  // 중첩 라우트
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [
      { path: '',        component: DashboardHome },
      { path: 'profile', component: DashboardProfile },
    ]
  },

  // 404
  { path: '/:pathMatch(.*)*', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),  // HTML5 History 모드
  routes
})

export default router`

const routerUsageCode = `<template>
  <!-- RouterLink: 선언적 네비게이션 -->
  <RouterLink to="/">홈</RouterLink>
  <RouterLink :to="'/users/' + userId">유저 프로필</RouterLink>
  <RouterLink :to="{ name: 'post-detail', params: { id: 1 } }">포스트</RouterLink>

  <!-- active-class: 현재 경로와 매칭 시 클래스 자동 추가 -->
  <RouterLink to="/" active-class="active">홈</RouterLink>
  <RouterLink to="/about" exact-active-class="exact-active">About</RouterLink>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

// 프로그래밍 방식 네비게이션
router.push('/')                        // 경로로 이동
router.push({ path: '/users/1' })       // 객체로
router.push({ name: 'user', params: { id: 1 } })  // 이름으로
router.push({ path: '/search', query: { q: 'vue' } })  // 쿼리
router.replace('/login')                // 히스토리 교체
router.back()                           // 뒤로
router.forward()                        // 앞으로
router.go(-2)                           // 2단계 뒤로
<\/script>`

const paramsCode = `// router/index.js
{ path: '/users/:id', component: UserView }

// UserView.vue — params 접근
import { useRoute } from 'vue-router'
const route = useRoute()
const userId = route.params.id  // '/users/42' → '42'

// 쿼리 파라미터
// URL: /search?q=vue&page=2
const searchQuery = route.query.q     // 'vue'
const page        = route.query.page  // '2'

// params 변경 감지
watch(() => route.params.id, (newId) => {
  fetchUser(newId)  // id가 바뀔 때마다 다시 요청
})`

const guardCode = `// 전역 가드: 모든 라우트 이동 전에 실행
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 인증 필요한 페이지인데 로그인 안 함 → 로그인으로
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()  // 통과
  }
})

// 라우트별 가드 (routes 설정에서)
{
  path: '/admin',
  component: AdminView,
  beforeEnter: (to, from) => {
    if (!isAdmin()) return { path: '/403' }
  }
}

// 컴포넌트 내 가드
import { onBeforeRouteLeave } from 'vue-router'

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const ok = confirm('저장하지 않고 나가시겠습니까?')
    if (!ok) return false  // 이동 취소
  }
})`

const routeVsRouterCode = `import { useRoute, useRouter } from 'vue-router'

// useRoute: 현재 라우트 정보 읽기 (읽기 전용)
const route = useRoute()
route.path          // '/users/42'
route.params.id     // '42'
route.query.search  // 'vue'
route.name          // 'user-detail'
route.meta          // { requiresAuth: true }
route.fullPath      // '/users/42?tab=info'

// useRouter: 네비게이션 (이동)
const router = useRouter()
router.push('/home')
router.replace('/login')
router.back()

// 비유:
// route  = GPS (현재 위치 정보)
// router = 운전대 (어디로 갈지 조작)`
</script>
