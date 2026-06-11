<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-advanced">Advanced · 03</div>
      <h1>⏳ Async Components & Suspense</h1>
      <p>컴포넌트를 <strong>필요할 때만 로드</strong>해 초기 번들 크기를 줄입니다.<br>
         Suspense로 비동기 상태를 선언적으로 처리합니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ defineAsyncComponent — 지연 로딩</h2>
      <div class="code-block">{{ asyncCode }}</div>
      <div class="demo-box">
        <h4>🎮 버튼 클릭 시 동적 로드 (시뮬레이션)</h4>
        <button class="btn btn-primary" @click="loadHeavyComponent" :disabled="loaded">
          {{ loaded ? '로드 완료!' : '무거운 컴포넌트 로드 (1초 후)' }}
        </button>
        <div v-if="loading" style="margin-top:12px;color:#64748b;font-size:14px">⏳ 컴포넌트 로딩 중...</div>
        <div v-if="loaded" class="result-box" style="margin-top:12px">
          ✅ 컴포넌트가 로드되었습니다! (번들에서 코드 분리됨)
        </div>
      </div>
    </div>

    <div class="section-card">
      <h2>2️⃣ Suspense — 비동기 상태 처리</h2>
      <div class="code-block">{{ suspenseCode }}</div>
      <div class="tip">
        💡 <strong>Suspense 사용 조건</strong>: 자식 컴포넌트의 setup()에서 async/await 사용 시
      </div>
    </div>

    <div class="section-card">
      <h2>3️⃣ 실무 패턴 — Route-level Code Splitting</h2>
      <div class="code-block">{{ routeCodeSplitCode }}</div>
      <div class="info">
        🔑 Vue Router + defineAsyncComponent = <strong>코드 분할(Code Splitting)</strong><br>
        각 페이지를 별도 청크(chunk)로 분리 → 초기 로딩 속도 향상<br>
        Vite에서 자동으로 처리됩니다!
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const loading = ref(false)
const loaded = ref(false)

const loadHeavyComponent = async () => {
  loading.value = true
  await new Promise(r => setTimeout(r, 1000))
  loading.value = false
  loaded.value = true
}

const asyncCode = `import { defineAsyncComponent } from 'vue'

// 기본 — 동적 import
const HeavyChart = defineAsyncComponent(
  () => import('./components/HeavyChart.vue')
)

// 고급 옵션 — 로딩/에러 컴포넌트 지정
const AsyncModal = defineAsyncComponent({
  loader: () => import('./components/Modal.vue'),

  // 로딩 중 표시할 컴포넌트
  loadingComponent: LoadingSpinner,
  delay: 200,  // 200ms 후에 로딩 컴포넌트 표시

  // 에러 시 표시할 컴포넌트
  errorComponent: ErrorComponent,
  timeout: 3000,  // 3초 초과 시 에러 처리

  onError(error, retry, fail, attempts) {
    if (attempts <= 3) retry()  // 3번까지 재시도
    else fail()
  }
})

// 사용 — 일반 컴포넌트처럼 사용
<template>
  <HeavyChart v-if="showChart" :data="chartData" />
</template>`

const suspenseCode = `<!-- Suspense: 비동기 컴포넌트 로딩 상태를 선언적으로 처리 -->
<Suspense>
  <!-- 로딩 완료 후 표시 -->
  <template #default>
    <AsyncUserProfile />  <!-- setup()에서 await 사용 -->
  </template>

  <!-- 로딩 중 표시 -->
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>

<!-- AsyncUserProfile.vue -->
<script setup>
// setup에서 await 사용 → Suspense 트리거
const user = await fetchUser()  // 로딩 중에는 fallback 표시
<\/script>

<!-- ErrorBoundary와 함께 -->
<ErrorBoundary @error="handleError">
  <Suspense>
    <template #default><AsyncComp /></template>
    <template #fallback><Spinner /></template>
  </Suspense>
</ErrorBoundary>`

const routeCodeSplitCode = `// router/index.js
// Vue Router에서 자동으로 코드 분할 (가장 일반적인 패턴)
const routes = [
  {
    path: '/',
    // () => import() 사용 시 자동으로 별도 chunk 생성
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue'),
    // webpackChunkName 주석으로 chunk 이름 지정
    // component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard.vue')
  },
]

// 빌드 결과:
// dist/
//   index.js          (공통 코드)
//   HomeView.xxx.js   (홈만 포함)
//   Dashboard.xxx.js  (대시보드만 포함)

// 효과:
// 초기 로드: index.js만 다운로드 (빠름!)
// 홈 방문: HomeView.js 추가 로드
// 대시보드 방문: Dashboard.js 추가 로드`
</script>
