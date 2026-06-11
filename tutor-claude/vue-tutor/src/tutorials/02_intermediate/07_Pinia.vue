<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-intermediate">Intermediate · 07</div>
      <h1>🍍 Pinia — 상태 관리</h1>
      <p>Vue 3 공식 상태 관리 라이브러리.<br>
         여러 컴포넌트에서 공유해야 하는 상태를 중앙에서 관리합니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ 상태 관리가 왜 필요한가?</h2>
      <div class="problem-diagram">
        <div class="pd-item">
          <div class="pd-label">컴포넌트 A</div>
          <div class="pd-content">로그인 정보 필요</div>
        </div>
        <div class="pd-arrow">← props 전달 →</div>
        <div class="pd-item pd-middle">
          <div class="pd-label">Grandparent</div>
          <div class="pd-content">데이터 보관</div>
        </div>
        <div class="pd-arrow">← emit →</div>
        <div class="pd-item">
          <div class="pd-label">컴포넌트 B</div>
          <div class="pd-content">로그인 정보 필요</div>
        </div>
      </div>
      <div class="tip">
        ⚠️ Props Drilling 문제: 로그인 정보를 여러 컴포넌트에서 쓰려면 props로 계속 내려줘야 합니다.<br>
        → <strong>Pinia로 글로벌 상태를 관리</strong>하면 어느 컴포넌트에서나 바로 접근 가능!
      </div>
    </div>

    <div class="section-card">
      <h2>2️⃣ Store 정의 — Setup Store (권장)</h2>
      <div class="code-block">{{ storeDefCode }}</div>
    </div>

    <div class="section-card">
      <h2>3️⃣ 라이브 Pinia 데모</h2>
      <div class="demo-box">
        <h4>🎮 두 컴포넌트가 같은 Store를 공유</h4>

        <!-- 컴포넌트 A: 카운터 조작 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="background:#f0fdf4;border:2px solid #42b883;border-radius:12px;padding:16px">
            <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:12px">컴포넌트 A — 조작</div>
            <div class="btn-group">
              <button class="btn btn-primary" @click="counter.increment">+1</button>
              <button class="btn btn-secondary" @click="counter.decrement">-1</button>
              <button class="btn btn-secondary" @click="counter.reset">초기화</button>
            </div>
            <div style="margin-top:8px;font-size:13px">count: <strong>{{ counter.count }}</strong></div>
          </div>
          <!-- 컴포넌트 B: 상태 표시 (같은 store) -->
          <div style="background:#eff6ff;border:2px solid #60a5fa;border-radius:12px;padding:16px">
            <div style="font-size:12px;font-weight:700;color:#2563eb;margin-bottom:12px">컴포넌트 B — 표시</div>
            <div style="font-size:48px;font-weight:800;color:#60a5fa;text-align:center">
              {{ counter.count }}
            </div>
            <div style="text-align:center;font-size:13px;color:#64748b">
              두 배: <strong>{{ counter.doubleCount }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-box" style="margin-top:16px">
        <h4>🎮 장바구니 Store (실전 예시)</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <!-- 상품 목록 -->
          <div>
            <div style="font-size:13px;font-weight:600;margin-bottom:8px">상품 목록</div>
            <div v-for="product in products" :key="product.id" class="product-item">
              <div>
                <div style="font-weight:600;font-size:14px">{{ product.name }}</div>
                <div style="font-size:13px;color:#64748b">{{ product.price.toLocaleString() }}원</div>
              </div>
              <button class="btn btn-sm btn-primary" @click="cart.addItem(product)">
                장바구니 담기
              </button>
            </div>
          </div>
          <!-- 장바구니 -->
          <div>
            <div style="font-size:13px;font-weight:600;margin-bottom:8px">
              🛒 장바구니 ({{ cart.itemCount }}개)
            </div>
            <div v-if="cart.items.length === 0" style="color:#94a3b8;font-size:14px;padding:12px">
              장바구니가 비었습니다
            </div>
            <div v-for="item in cart.items" :key="item.id" class="cart-item-row">
              <div style="flex:1;font-size:14px">{{ item.name }}</div>
              <div style="font-size:13px;color:#64748b">×{{ item.qty }}</div>
              <button class="btn btn-sm btn-danger" @click="cart.removeItem(item.id)">×</button>
            </div>
            <div v-if="cart.items.length" style="border-top:2px solid #e2e8f0;padding-top:8px;margin-top:8px;text-align:right">
              합계: <strong style="color:#42b883;font-size:16px">{{ cart.totalPrice.toLocaleString() }}원</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <h2>4️⃣ Store 사용법</h2>
      <div class="code-block">{{ storeUseCode }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

// 인라인 Pinia 시뮬레이션 (실제 프로젝트에서는 stores/ 폴더에 분리)
// ===== Counter Store =====
const counterState = ref(0)
const counter = {
  get count() { return counterState.value },
  get doubleCount() { return counterState.value * 2 },
  increment() { counterState.value++ },
  decrement() { counterState.value-- },
  reset() { counterState.value = 0 }
}

// ===== Cart Store =====
const cartItems = reactive([])
const cart = {
  get items() { return cartItems },
  get itemCount() { return cartItems.reduce((sum, i) => sum + i.qty, 0) },
  get totalPrice() { return cartItems.reduce((sum, i) => sum + i.price * i.qty, 0) },
  addItem(product) {
    const existing = cartItems.find(i => i.id === product.id)
    if (existing) { existing.qty++ }
    else { cartItems.push({ ...product, qty: 1 }) }
  },
  removeItem(id) {
    const idx = cartItems.findIndex(i => i.id === id)
    if (idx !== -1) cartItems.splice(idx, 1)
  }
}

const products = [
  { id: 1, name: '클린 코드', price: 28000 },
  { id: 2, name: 'Vue 스티커', price: 3000 },
  { id: 3, name: '기계식 키보드', price: 150000 },
]

// 코드 예시
const storeDefCode = `// stores/counterStore.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// defineStore(이름, setup 함수) — Setup Store 방식 (권장)
export const useCounterStore = defineStore('counter', () => {

  // ref → state
  const count = ref(0)

  // computed → getters
  const doubleCount = computed(() => count.value * 2)
  const isPositive  = computed(() => count.value > 0)

  // function → actions
  function increment() { count.value++ }
  function decrement() { count.value-- }
  function reset()     { count.value = 0 }

  // 반드시 return!
  return { count, doubleCount, isPositive, increment, decrement, reset }
})`

const storeUseCode = `<!-- 컴포넌트에서 사용 -->
<script setup>
import { useCounterStore } from '@/stores/counterStore'

// store 인스턴스
const counter = useCounterStore()

// ✅ 직접 접근
counter.count       // state 읽기
counter.increment() // action 실행

// ⚠️ 구조분해 시 반응성 유지 방법
import { storeToRefs } from 'pinia'
const { count, doubleCount } = storeToRefs(counter)  // state, getter만
const { increment } = counter  // action은 그냥 구조분해 OK

// $reset(): state를 초기값으로 리셋 (Options Store만 지원)
counter.$reset()

// $patch(): 여러 state를 한 번에 변경
counter.$patch({ count: 10, name: '새이름' })
<\/script>

<template>
  <div>{{ counter.count }}</div>
  <button @click="counter.increment">+</button>
</template>`

const problem = `<!-- Props Drilling 문제 -->
<App>
  <Header :user="user" />          <!-- user를 계속 내려줌 -->
    <Navbar :user="user" />        <!-- 또 내려줌 -->
      <UserMenu :user="user" />    <!-- 또 내려줌 -->

<!-- Pinia로 해결 -->
<UserMenu>
  <script setup>
  import { useAuthStore } from '@/stores/auth'
  const auth = useAuthStore()
  auth.user  // 어디서든 바로 접근!
  <\/script>
</UserMenu>`
</script>

<style scoped>
.problem-diagram {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
}
.pd-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  min-width: 100px;
}
.pd-middle { border-color: #42b883; background: #f0fdf4; }
.pd-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
.pd-content { font-size: 13px; }
.pd-arrow { color: #94a3b8; font-size: 13px; flex-shrink: 0; }
.product-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid #f1f5f9;
}
.cart-item-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; border-bottom: 1px solid #f8fafc; font-size: 14px;
}
</style>
