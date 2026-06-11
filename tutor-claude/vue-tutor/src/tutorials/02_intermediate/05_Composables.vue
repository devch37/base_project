<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-intermediate">Intermediate · 05</div>
      <h1>🪝 Composables (커스텀 훅)</h1>
      <p>Composition API를 활용한 <strong>로직 재사용</strong> 패턴입니다.<br>
         React의 Custom Hook과 동일한 개념. 실무에서 매우 중요합니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ Composable이란?</h2>
      <div class="info">
        🔑 Composable = <strong>상태(state)와 로직(logic)을 포함한 재사용 가능한 함수</strong><br><br>
        예전 방식 (Mixin): 이름 충돌, 출처 불명확, 암묵적 의존성 → ❌ 사용 지양<br>
        Composable: 명시적 import, 타입 추론 완벽, 테스트 용이 → ✅ 권장
      </div>
    </div>

    <div class="section-card">
      <h2>2️⃣ useCounter — 가장 단순한 예시</h2>
      <div class="demo-box">
        <h4>🎮 여러 컴포넌트에서 같은 Composable 재사용</h4>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          <CounterWidget label="좋아요" :use-counter="counterA" emoji="👍" />
          <CounterWidget label="댓글" :use-counter="counterB" emoji="💬" />
          <CounterWidget label="공유" :use-counter="counterC" emoji="🔗" />
        </div>
        <div style="margin-top:12px;font-size:13px;color:#64748b">
          합계: <strong>{{ counterA.count.value + counterB.count.value + counterC.count.value }}</strong>
          (각 카운터는 독립적인 상태를 가집니다)
        </div>
      </div>
      <div class="code-block">{{ counterCode }}</div>
    </div>

    <div class="section-card">
      <h2>3️⃣ useFetch — API 호출 패턴</h2>
      <div class="demo-box">
        <h4>🎮 데이터 페칭</h4>
        <div class="btn-group">
          <button class="btn btn-primary" @click="fetchUsers" :disabled="usersState.loading.value">
            {{ usersState.loading.value ? '⏳ 로딩 중...' : '데이터 불러오기 (시뮬레이션)' }}
          </button>
          <button class="btn btn-danger btn-sm" @click="simulateError">에러 시뮬레이션</button>
        </div>

        <div v-if="usersState.loading.value" class="fetch-status loading">⏳ 데이터를 가져오는 중...</div>
        <div v-else-if="usersState.error.value" class="fetch-status error">❌ {{ usersState.error.value }}</div>
        <div v-else-if="usersState.data.value">
          <div v-for="user in usersState.data.value" :key="user.id" class="user-row">
            <div class="avatar">{{ user.name[0] }}</div>
            <div>
              <div style="font-weight:600;font-size:14px">{{ user.name }}</div>
              <div style="font-size:12px;color:#94a3b8">{{ user.email }}</div>
            </div>
          </div>
        </div>
        <div v-else style="color:#94a3b8;text-align:center;padding:20px;font-size:14px">
          버튼을 눌러 데이터를 불러오세요
        </div>
      </div>
      <div class="code-block">{{ fetchCode }}</div>
    </div>

    <div class="section-card">
      <h2>4️⃣ useLocalStorage — 영속성 있는 상태</h2>
      <div class="demo-box">
        <h4>🎮 페이지 새로고침해도 값 유지</h4>
        <div class="form-group">
          <label class="form-label">테마</label>
          <select class="form-input" v-model="theme">
            <option value="light">☀️ 라이트</option>
            <option value="dark">🌙 다크</option>
            <option value="system">🖥️ 시스템</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">언어</label>
          <select class="form-input" v-model="language">
            <option value="ko">🇰🇷 한국어</option>
            <option value="en">🇺🇸 English</option>
            <option value="ja">🇯🇵 日本語</option>
          </select>
        </div>
        <div class="result-box">
          localStorage에 저장됨 → 새로고침해도 유지!<br>
          theme: <strong>{{ theme }}</strong> | language: <strong>{{ language }}</strong>
        </div>
      </div>
      <div class="code-block">{{ localStorageCode }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, watch } from 'vue'

// ===== useCounter Composable =====
function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const increment = () => count.value++
  const decrement = () => count.value > 0 && count.value--
  const reset = () => (count.value = initialValue)
  return { count, increment, decrement, reset }
}

const counterA = useCounter(0)
const counterB = useCounter(0)
const counterC = useCounter(0)

const CounterWidget = defineComponent({
  props: { label: String, useCounter: Object, emoji: String },
  template: `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px">{{ emoji }}</div>
      <div style="font-size:32px;font-weight:800;color:#42b883">{{ useCounter.count.value }}</div>
      <div style="font-size:13px;color:#94a3b8;margin-bottom:8px">{{ label }}</div>
      <div style="display:flex;gap:4px;justify-content:center">
        <button class="btn btn-sm btn-secondary" @click="useCounter.decrement">−</button>
        <button class="btn btn-sm btn-primary"   @click="useCounter.increment">+</button>
      </div>
    </div>
  `
})

// ===== useFetch Composable =====
function useFetch() {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function execute(fetchFn) {
    loading.value = true
    error.value = null
    try {
      data.value = await fetchFn()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}

const usersState = useFetch()

const fetchUsers = () => usersState.execute(() =>
  new Promise((resolve) => setTimeout(() => resolve([
    { id: 1, name: '김철수', email: 'kim@example.com' },
    { id: 2, name: '이영희', email: 'lee@example.com' },
    { id: 3, name: '박민준', email: 'park@example.com' },
  ]), 1000))
)

const simulateError = () => usersState.execute(() =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('서버 오류 (500)')), 800))
)

// ===== useLocalStorage Composable =====
function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key)
  const value = ref(stored ? JSON.parse(stored) : defaultValue)
  watch(value, (newVal) => localStorage.setItem(key, JSON.stringify(newVal)), { deep: true })
  return value
}

const theme = useLocalStorage('tutorial-theme', 'light')
const language = useLocalStorage('tutorial-lang', 'ko')

// 코드 예시
const counterCode = `// composables/useCounter.js
import { ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  function increment() { count.value++ }
  function decrement() { if (count.value > 0) count.value-- }
  function reset() { count.value = initialValue }

  return { count, increment, decrement, reset }
}

// 사용하는 곳에서 (여러 컴포넌트에서 재사용!)
import { useCounter } from '@/composables/useCounter'

const { count, increment, decrement } = useCounter(10)
// 각 호출마다 독립적인 상태를 가짐`

const fetchCode = `// composables/useFetch.js
import { ref } from 'vue'

export function useFetch() {
  const data    = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  async function execute(fetchFn) {
    loading.value = true
    error.value = null
    try {
      data.value = await fetchFn()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}

// 사용
const { data: users, loading, error, execute } = useFetch()

onMounted(() => {
  execute(() => fetch('/api/users').then(r => r.json()))
})`

const localStorageCode = `// composables/useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  // 저장된 값이 있으면 불러오고, 없으면 기본값 사용
  const stored = localStorage.getItem(key)
  const value = ref(stored ? JSON.parse(stored) : defaultValue)

  // 값이 바뀔 때마다 자동 저장
  watch(value, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return value
}

// 사용
const theme = useLocalStorage('app-theme', 'light')
theme.value = 'dark'  // 자동으로 localStorage에 저장됨!`
</script>

<style scoped>
.user-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid #f1f5f9;
}
.fetch-status {
  padding: 16px; border-radius: 8px; font-size: 14px; margin-top: 12px; text-align: center;
}
.fetch-status.loading { background: #fffbeb; color: #92400e; }
.fetch-status.error   { background: #fef2f2; color: #dc2626; }
</style>
