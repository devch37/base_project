<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-advanced">Advanced · 05</div>
      <h1>🏗️ 실무 아키텍처 패턴</h1>
      <p>Vue 실무에서 자주 쓰이는 설계 패턴과 코드 구조를 배웁니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ 폴더 구조 — 실무 추천</h2>
      <div class="code-block">{{ folderCode }}</div>
    </div>

    <div class="section-card">
      <h2>2️⃣ API 레이어 분리 패턴</h2>
      <div class="code-block">{{ apiLayerCode }}</div>
      <div class="info">
        🔑 API URL을 컴포넌트에 하드코딩하지 마세요!<br>
        API 레이어를 분리하면: 엔드포인트 변경 시 한 곳만 수정, 테스트 용이, 재사용 가능
      </div>
    </div>

    <div class="section-card">
      <h2>3️⃣ 컴포넌트 책임 분리 — Smart vs Dumb</h2>
      <div class="code-block">{{ smartDumbCode }}</div>
    </div>

    <div class="section-card">
      <h2>4️⃣ Provide / Inject — 깊은 컴포넌트 통신</h2>
      <div class="demo-box">
        <h4>🎮 provide/inject 데모</h4>
        <ProvideDemo />
      </div>
      <div class="code-block">{{ provideCode }}</div>
    </div>

    <div class="section-card">
      <h2>5️⃣ 에러 처리 패턴</h2>
      <div class="code-block">{{ errorCode }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, inject, defineComponent } from 'vue'

// Provide/Inject 데모
const ProvideDemo = defineComponent({
  setup() {
    const theme = ref('light')
    const toggleTheme = () => { theme.value = theme.value === 'light' ? 'dark' : 'light' }
    provide('theme', { theme, toggleTheme })
    return {}
  },
  template: `
    <div style="border:2px dashed #e2e8f0;border-radius:8px;padding:16px">
      <div style="font-size:12px;color:#94a3b8;margin-bottom:8px">조부모 컴포넌트 (provide)</div>
      <ParentComp />
    </div>
  `,
  components: {
    ParentComp: defineComponent({
      template: `
        <div style="border:2px dashed #e2e8f0;border-radius:8px;padding:12px;margin:8px 0">
          <div style="font-size:12px;color:#94a3b8;margin-bottom:8px">부모 컴포넌트 (props 전달 안 함!)</div>
          <ChildComp />
        </div>
      `,
      components: {
        ChildComp: defineComponent({
          setup() {
            const { theme, toggleTheme } = inject('theme')
            return { theme, toggleTheme }
          },
          template: `
            <div style="border:2px dashed #42b883;border-radius:8px;padding:12px">
              <div style="font-size:12px;color:#42b883;margin-bottom:8px">자식 컴포넌트 (inject)</div>
              <div>현재 테마: <strong>{{ theme }}</strong></div>
              <button class="btn btn-sm btn-primary" @click="toggleTheme" style="margin-top:8px">
                테마 토글
              </button>
            </div>
          `
        })
      }
    })
  }
})

const folderCode = `src/
├── assets/           # 정적 파일 (이미지, 폰트)
├── components/       # 재사용 가능한 컴포넌트
│   ├── base/         # 기본 UI 컴포넌트 (BaseButton, BaseInput)
│   ├── layout/       # 레이아웃 컴포넌트 (AppHeader, AppSidebar)
│   └── domain/       # 도메인별 컴포넌트 (UserCard, ProductList)
├── composables/      # 재사용 가능한 로직 (useFetch, useAuth)
├── directives/       # 커스텀 디렉티브
├── router/           # 라우터 설정
├── stores/           # Pinia 스토어
│   ├── auth.js       # 인증 상태
│   ├── cart.js       # 장바구니
│   └── ui.js         # UI 상태 (모달, 토스트 등)
├── services/         # API 서비스 레이어
│   ├── api.js        # axios 인스턴스
│   ├── authService.js
│   └── productService.js
├── utils/            # 유틸리티 함수
├── views/            # 페이지 컴포넌트 (라우터와 1:1)
│   ├── HomeView.vue
│   └── dashboard/
│       ├── DashboardView.vue
│       └── components/   # 이 페이지에서만 쓰는 컴포넌트
└── main.js`

const apiLayerCode = `// services/api.js — axios 기본 설정
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
})

// 요청 인터셉터: 토큰 자동 첨부
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = \`Bearer \${token}\`
  return config
})

// 응답 인터셉터: 에러 처리, 토큰 갱신
api.interceptors.response.use(
  response => response.data,
  async error => {
    if (error.response?.status === 401) {
      await refreshToken()
      return api.request(error.config)
    }
    return Promise.reject(error)
  }
)

export default api

// services/userService.js — 도메인별 API 분리
import api from './api'

export const userService = {
  getAll:     ()       => api.get('/users'),
  getById:    (id)     => api.get(\`/users/\${id}\`),
  create:     (data)   => api.post('/users', data),
  update:     (id, d)  => api.put(\`/users/\${id}\`, d),
  delete:     (id)     => api.delete(\`/users/\${id}\`),
}

// 컴포넌트에서 사용
import { userService } from '@/services/userService'
const users = await userService.getAll()`

const smartDumbCode = `// ===== Smart Component (Container) =====
// 데이터 로딩, 상태 관리, 비즈니스 로직 담당
// UserListPage.vue
<script setup>
import { ref, onMounted } from 'vue'
import { userService } from '@/services'
import UserList from '@/components/UserList.vue'

const users = ref([])
const loading = ref(true)

onMounted(async () => {
  users.value = await userService.getAll()
  loading.value = false
})

async function handleDelete(id) {
  await userService.delete(id)
  users.value = users.value.filter(u => u.id !== id)
}
<\/script>
<template>
  <UserList :users="users" :loading="loading" @delete="handleDelete" />
</template>

// ===== Dumb Component (Presentational) =====
// 오직 props를 받아서 UI 렌더링만 담당
// components/UserList.vue
<script setup>
defineProps({ users: Array, loading: Boolean })
defineEmits(['delete'])
<\/script>
<template>
  <div v-if="loading">로딩 중...</div>
  <div v-else v-for="user in users" :key="user.id">
    {{ user.name }}
    <button @click="$emit('delete', user.id)">삭제</button>
  </div>
</template>`

const provideCode = `// 조부모 컴포넌트 — provide
import { provide, ref } from 'vue'

const theme = ref('light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// 반응형으로 provide (readonly로 감싸면 읽기 전용 강제)
import { readonly } from 'vue'
provide('theme', { theme: readonly(theme), toggleTheme })

// 깊은 자식 컴포넌트 — inject
import { inject } from 'vue'

// 두 번째 인수: 기본값 (provide 없을 때 사용)
const { theme, toggleTheme } = inject('theme', {
  theme: ref('light'),
  toggleTheme: () => {}
})

// 언제 쓸까?
// - 앱 전체 테마, 언어 설정
// - 폼 컴포넌트 그룹 (FormGroup → FormInput)
// - 레이아웃 컴포넌트 (AppLayout → Page)
// Props Drilling을 피하되 Pinia까지는 필요 없을 때`

const errorCode = `// 1. 전역 에러 핸들러 (main.js)
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue Error:', error)
  // Sentry, Datadog 등에 에러 전송
  errorTrackingService.capture(error)
}

// 2. 컴포넌트 에러 바운더리
// onErrorCaptured: 자식 컴포넌트의 에러 캡처
import { onErrorCaptured } from 'vue'

onErrorCaptured((error, instance, info) => {
  showErrorToast(error.message)
  return false  // false 반환 시 에러 전파 중단
})

// 3. Composable의 에러 처리
function useSafeRequest(requestFn) {
  const data  = ref(null)
  const error = ref(null)

  const execute = async (...args) => {
    try {
      data.value = await requestFn(...args)
    } catch (e) {
      error.value = e.message
      // 필요 시 에러 트래킹
    }
  }
  return { data, error, execute }
}`
</script>
