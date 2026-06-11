<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-basic">Basic · 02</div>
      <h1>🔄 반응형 데이터 (Reactive Data)</h1>
      <p>Vue의 핵심 — <code>ref</code>, <code>reactive</code>, <code>computed</code>, <code>watch</code><br>
         데이터가 변하면 화면이 자동으로 업데이트됩니다.</p>
    </div>

    <!-- ref -->
    <div class="section-card">
      <h2>1️⃣ ref — 원시값 반응형</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        숫자, 문자열, 불린 같은 원시값을 반응형으로 만들 때 사용. 접근 시 <code>.value</code> 필요.
      </p>
      <div class="demo-box">
        <h4>🎮 데모</h4>
        <div class="reactive-display">
          <div class="reactive-item">
            <div class="reactive-label">count</div>
            <div class="reactive-value">{{ count }}</div>
          </div>
          <div class="reactive-item">
            <div class="reactive-label">message</div>
            <div class="reactive-value" style="font-size:18px">{{ message }}</div>
          </div>
          <div class="reactive-item">
            <div class="reactive-label">isVisible</div>
            <div class="reactive-value">{{ isVisible }}</div>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" @click="count++">count++</button>
          <button class="btn btn-primary" @click="count--">count--</button>
          <button class="btn btn-secondary" @click="message = message === '안녕!' ? 'Hello!' : '안녕!'">메시지 토글</button>
          <button class="btn btn-secondary" @click="isVisible = !isVisible">visible 토글</button>
        </div>
      </div>
      <div class="code-block">{{ refCode }}</div>
    </div>

    <!-- reactive -->
    <div class="section-card">
      <h2>2️⃣ reactive — 객체 반응형</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        객체나 배열을 반응형으로 만들 때 사용. <code>.value</code> 불필요, 직접 접근 가능.
      </p>
      <div class="demo-box">
        <h4>🎮 데모 — 회원 정보</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div class="form-group">
              <label class="form-label">이름</label>
              <input class="form-input" v-model="user.name" />
            </div>
            <div class="form-group">
              <label class="form-label">나이</label>
              <input class="form-input" type="number" v-model.number="user.age" />
            </div>
            <div class="form-group">
              <label class="form-label">이메일</label>
              <input class="form-input" v-model="user.email" />
            </div>
          </div>
          <div class="result-box" style="align-self:center">
            <strong>실시간 미리보기</strong><br><br>
            👤 {{ user.name }} ({{ user.age }}세)<br>
            📧 {{ user.email }}<br>
            🎂 {{ user.age >= 18 ? '성인' : '미성년자' }}
          </div>
        </div>
      </div>
      <div class="code-block">{{ reactiveCode }}</div>
      <div class="tip">💡 ref vs reactive: 원시값 → ref, 객체/배열 → 둘 다 가능. 실무에서는 <strong>ref를 기본으로</strong> 쓰는 추세입니다.</div>
    </div>

    <!-- computed -->
    <div class="section-card">
      <h2>3️⃣ computed — 계산된 값</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        다른 반응형 값에 의존하는 계산 결과. <strong>캐싱됨</strong> — 의존 값이 변할 때만 재계산.
      </p>
      <div class="demo-box">
        <h4>🎮 데모 — 장바구니</h4>
        <div v-for="item in cart" :key="item.id" class="cart-item">
          <span>{{ item.name }}</span>
          <span>{{ item.price.toLocaleString() }}원</span>
          <div class="qty-control">
            <button class="btn btn-sm btn-secondary" @click="item.qty > 1 && item.qty--">−</button>
            <span>{{ item.qty }}</span>
            <button class="btn btn-sm btn-secondary" @click="item.qty++">+</button>
          </div>
          <span style="font-weight:600">{{ (item.price * item.qty).toLocaleString() }}원</span>
        </div>
        <div style="border-top:2px solid #e2e8f0;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between">
          <span>총 수량: <strong>{{ totalQty }}개</strong></span>
          <span>총 금액: <strong style="color:#42b883;font-size:18px">{{ totalPrice.toLocaleString() }}원</strong></span>
        </div>
      </div>
      <div class="code-block">{{ computedCode }}</div>
    </div>

    <!-- watch -->
    <div class="section-card">
      <h2>4️⃣ watch — 감시자</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        값 변화를 감지하여 <strong>부수 효과(Side Effect)</strong>를 실행. API 호출, 로그, 저장 등에 사용.
      </p>
      <div class="demo-box">
        <h4>🎮 데모 — 검색창 (Debounce 패턴)</h4>
        <input class="form-input" v-model="searchQuery" placeholder="검색어를 입력하세요..." />
        <div style="margin-top:8px;font-size:13px;color:#64748b">
          검색어가 바뀔 때마다 watch가 실행됩니다:
        </div>
        <div v-if="searchLogs.length" style="margin-top:8px">
          <div v-for="log in searchLogs" :key="log.id" class="log-item">
            {{ log.time }} — "{{ log.query }}" 검색 API 호출됨
          </div>
        </div>
      </div>
      <div class="code-block">{{ watchCode }}</div>
      <div class="info">
        🔑 <strong>computed vs watch 언제 쓸까?</strong><br>
        • computed: 값을 <em>계산</em>할 때 (return 값 있음)<br>
        • watch: 값 변화에 반응해서 <em>작업</em>할 때 (API 호출, 저장 등, return 값 없음)
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

// ===== ref =====
const count = ref(0)
const message = ref('안녕!')
const isVisible = ref(true)

// ===== reactive =====
const user = reactive({ name: '김철수', age: 25, email: 'kim@example.com' })

// ===== computed =====
const cart = reactive([
  { id: 1, name: '클린 코드 책', price: 28000, qty: 1 },
  { id: 2, name: 'Vue 스티커', price: 3000, qty: 2 },
  { id: 3, name: '기계식 키보드', price: 150000, qty: 1 },
])

// computed는 의존하는 값(cart의 qty)이 변할 때만 재계산 (캐싱!)
const totalQty = computed(() => cart.reduce((sum, item) => sum + item.qty, 0))
const totalPrice = computed(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0))

// ===== watch =====
const searchQuery = ref('')
const searchLogs = ref([])

// searchQuery가 변할 때마다 실행
watch(searchQuery, (newQuery, oldQuery) => {
  if (!newQuery) return
  searchLogs.value.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString(),
    query: newQuery
  })
  if (searchLogs.value.length > 5) searchLogs.value.pop()
})

// 코드 예시
const refCode = `import { ref } from 'vue'

// ref: 원시값(숫자, 문자열, 불린)을 반응형으로
const count   = ref(0)
const message = ref('안녕!')
const isActive = ref(false)

// script에서는 .value로 접근
count.value++
count.value = 10
message.value = 'Hello!'

// 템플릿에서는 .value 없이 바로 사용
// <p>{{ count }}</p>  <- 자동으로 .value 언래핑`

const reactiveCode = `import { reactive } from 'vue'

// reactive: 객체를 반응형으로 (깊은 반응형)
const user = reactive({
  name: '김철수',
  age: 25,
  address: { city: '서울' }  // 중첩 객체도 반응형!
})

// .value 없이 직접 접근
user.name = '이영희'
user.age++
user.address.city = '부산'  // 중첩도 OK

// 배열도 reactive로
const items = reactive(['사과', '바나나'])
items.push('딸기')  // 배열 메서드도 반응형으로 추적`

const computedCode = `import { ref, computed } from 'vue'

const cart = ref([
  { name: '책', price: 28000, qty: 1 },
  { name: '키보드', price: 150000, qty: 1 },
])

// computed: 다른 반응형 값에 의존하는 계산된 값
// cart가 변할 때만 재계산 (캐싱 → 성능!)
const totalPrice = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

// 쓰기 가능한 computed (getter + setter)
const fullName = computed({
  get: () => firstName.value + ' ' + lastName.value,
  set: (val) => {
    [firstName.value, lastName.value] = val.split(' ')
  }
})`

const watchCode = `import { ref, watch, watchEffect } from 'vue'

const searchQuery = ref('')

// 기본 watch: 특정 값 감시
watch(searchQuery, (newVal, oldVal) => {
  // newVal: 새 값, oldVal: 이전 값
  callSearchAPI(newVal)
})

// 옵션 설명
watch(searchQuery, handler, {
  immediate: true,  // 처음 실행 시 즉시 한 번 실행
  deep: true,       // 중첩 객체 깊은 감시
})

// 여러 값 동시 감시
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log(newFirst, newLast)
})

// watchEffect: 사용된 반응형 값을 자동 추적
watchEffect(() => {
  console.log(searchQuery.value)  // 자동으로 searchQuery 감시
})`
</script>

<style scoped>
.reactive-display { display: flex; gap: 16px; margin-bottom: 16px; }
.reactive-item {
  flex: 1;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.reactive-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
.reactive-value { font-size: 24px; font-weight: 700; color: #42b883; }
.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}
.qty-control { display: flex; align-items: center; gap: 8px; }
.qty-control span { min-width: 24px; text-align: center; font-weight: 600; }
.log-item {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  margin-bottom: 4px;
  color: #15803d;
}
</style>
