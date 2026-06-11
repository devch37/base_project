<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-intermediate">Intermediate · 01</div>
      <h1>⚙️ Composition API</h1>
      <p>Vue 3의 핵심 — 로직을 <strong>관심사 별로 묶어</strong> 재사용할 수 있는 방식입니다.<br>
         Options API보다 TypeScript 지원, 코드 재사용이 훨씬 뛰어납니다.</p>
    </div>

    <!-- Options API vs Composition API -->
    <div class="section-card">
      <h2>1️⃣ Options API vs Composition API</h2>
      <div class="compare-grid">
        <div>
          <div style="font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:8px">❌ Options API — 기능이 여러 옵션에 분산</div>
          <div class="code-block" style="font-size:11px">{{ optionsApiCode }}</div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:8px">✅ Composition API — 관련 로직이 한곳에</div>
          <div class="code-block" style="font-size:11px">{{ compositionApiCode }}</div>
        </div>
      </div>
      <div class="tip">
        💡 기능이 많아질수록 Options API는 data, computed, methods 등에 흩어지지만,
        Composition API는 관련 코드끼리 모여있습니다. → <strong>가독성, 재사용성 UP!</strong>
      </div>
    </div>

    <!-- setup() 과 script setup -->
    <div class="section-card">
      <h2>2️⃣ &lt;script setup&gt; — 가장 권장하는 방식</h2>
      <div class="demo-box">
        <h4>🎮 라이브 데모 — 카운터 (Composition API)</h4>
        <div class="counter-demo">
          <div class="counter-value">{{ count }}</div>
          <div class="btn-group">
            <button class="btn btn-secondary" @click="decrement">−</button>
            <button class="btn btn-primary"   @click="increment">+</button>
            <button class="btn btn-secondary" @click="reset">초기화</button>
          </div>
          <div style="margin-top:12px;font-size:13px;color:#64748b">
            두 배: <strong>{{ doubled }}</strong> |
            짝수: <strong>{{ isEven ? '짝수' : '홀수' }}</strong> |
            로그: {{ history.slice(-3).join(' → ') }}
          </div>
        </div>
      </div>
      <div class="code-block">{{ scriptSetupCode }}</div>
    </div>

    <!-- reactive references -->
    <div class="section-card">
      <h2>3️⃣ ref vs reactive — 언제 뭘 쓸까?</h2>
      <div class="demo-box">
        <h4>🎮 ref + reactive 비교 데모</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div style="font-size:12px;font-weight:600;color:#7c3aed;margin-bottom:8px">ref 사용</div>
            <div class="form-group">
              <input class="form-input" v-model="firstName" placeholder="이름" />
            </div>
            <div class="form-group">
              <input class="form-input" type="number" v-model.number="refAge" />
            </div>
            <div class="result-box">{{ firstName }} ({{ refAge }})</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#059669;margin-bottom:8px">reactive 사용</div>
            <div class="form-group">
              <input class="form-input" v-model="person.name" placeholder="이름" />
            </div>
            <div class="form-group">
              <input class="form-input" type="number" v-model.number="person.age" />
            </div>
            <div class="result-box">{{ person.name }} ({{ person.age }})</div>
          </div>
        </div>
      </div>
      <div class="code-block">{{ refVsReactiveCode }}</div>

      <div class="decision-table">
        <div class="dt-header">언제 무엇을 쓸까?</div>
        <div class="dt-row">
          <div class="dt-cell dt-ref">ref</div>
          <div class="dt-cell">숫자, 문자열, 불린 등 원시값 / 단일 값 / 외부에서 교체 필요할 때</div>
        </div>
        <div class="dt-row">
          <div class="dt-cell dt-reactive">reactive</div>
          <div class="dt-cell">여러 관련 속성을 묶을 때 / 폼 데이터 / 절대 교체 안 하는 객체</div>
        </div>
        <div class="dt-row">
          <div class="dt-cell dt-tip">실무 팁</div>
          <div class="dt-cell"><strong>ref를 기본으로 사용</strong>하고, 관련 속성이 5개 이상이면 reactive 고려</div>
        </div>
      </div>
    </div>

    <!-- toRefs -->
    <div class="section-card">
      <h2>4️⃣ toRefs / toRef — reactive를 구조분해할 때</h2>
      <div class="code-block">{{ toRefsCode }}</div>
      <div class="tip">
        ⚠️ reactive 객체를 구조분해하면 반응성이 사라집니다!
        <code>toRefs()</code>로 감싸야 반응성을 유지할 수 있습니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, toRefs } from 'vue'

// 카운터 데모
const count = ref(0)
const history = ref([0])
const doubled = computed(() => count.value * 2)
const isEven = computed(() => count.value % 2 === 0)
const increment = () => { count.value++; history.value.push(count.value) }
const decrement = () => { count.value--; history.value.push(count.value) }
const reset = () => { count.value = 0; history.value = [0] }

// ref vs reactive
const firstName = ref('김철수')
const refAge = ref(25)
const person = reactive({ name: '이영희', age: 30 })

// 코드 예시
const optionsApiCode = `// ❌ 기능 A의 data, computed, methods가
//    각각 다른 섹션에 흩어짐
export default {
  data() {
    return {
      // 기능 A 데이터
      searchQuery: '',
      // 기능 B 데이터
      count: 0,
    }
  },
  computed: {
    // 기능 A 계산
    filteredList() { ... },
    // 기능 B 계산
    doubled() { ... }
  },
  methods: {
    // 기능 A 메서드
    fetchData() { ... },
    // 기능 B 메서드
    increment() { ... }
  }
}`

const compositionApiCode = `// ✅ 기능별로 묶어서 관리 → 파악하기 쉬움
<script setup>
// ---- 기능 A: 검색 ----
const searchQuery = ref('')
const filteredList = computed(() => ...)
async function fetchData() { ... }

// ---- 기능 B: 카운터 ----
const count = ref(0)
const doubled = computed(() => count.value * 2)
function increment() { count.value++ }
<\/script>

// 기능 A만 따로 빼서 재사용도 가능!
// useSearch.js 로 추출 → Composable`

const scriptSetupCode = `<script setup>
// 1. import만 하면 자동으로 템플릿에서 사용 가능
import { ref, computed } from 'vue'

// 2. 반응형 데이터 선언
const count = ref(0)

// 3. computed 값
const doubled = computed(() => count.value * 2)

// 4. 메서드 (그냥 함수)
function increment() { count.value++ }

// 5. defineProps, defineEmits도 여기서
const props = defineProps({ initial: Number })
const emit  = defineEmits(['change'])

// setup() 리턴 불필요 — 자동으로 템플릿에 노출
<\/script>`

const refVsReactiveCode = `// ===== ref =====
const count = ref(0)
const name  = ref('김철수')

count.value++        // .value 필수
name.value = '이영희'

// ===== reactive =====
const user = reactive({ name: '김철수', age: 25 })

user.name = '이영희' // .value 불필요
user.age++

// ===== 중요: reactive 교체 불가! =====
let user = reactive({ name: '김' })
user = reactive({ name: '이' }) // ❌ 반응성 사라짐!

const user = ref({ name: '김' })
user.value = { name: '이' } // ✅ ref는 교체 가능`

const toRefsCode = `import { reactive, toRefs, toRef } from 'vue'

const state = reactive({ name: '김철수', age: 25 })

// ❌ 구조분해하면 반응성 사라짐!
const { name, age } = state  // 일반 값이 됨

// ✅ toRefs로 반응성 유지
const { name, age } = toRefs(state)  // Ref 객체들
name.value = '이영희'  // state.name도 변경됨!

// 단일 속성만: toRef
const name = toRef(state, 'name')

// Composable에서 reactive를 반환할 때 toRefs 필수!
function useUser() {
  const state = reactive({ name: '', age: 0 })
  return toRefs(state)  // ← 이렇게 해야 구조분해해도 반응성 유지
}`
</script>

<style scoped>
.counter-demo {
  text-align: center;
  padding: 20px;
}
.counter-value {
  font-size: 64px;
  font-weight: 800;
  color: #42b883;
  line-height: 1;
  margin-bottom: 16px;
}
.decision-table {
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.dt-header {
  background: #1e293b;
  color: white;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
}
.dt-row {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
}
.dt-row:last-child { border-bottom: none; }
.dt-cell {
  padding: 10px 16px;
  font-size: 13px;
}
.dt-cell:first-child {
  min-width: 100px;
  font-weight: 700;
  border-right: 1px solid #f1f5f9;
}
.dt-ref      { color: #7c3aed; }
.dt-reactive { color: #059669; }
.dt-tip      { color: #f59e0b; }
</style>
