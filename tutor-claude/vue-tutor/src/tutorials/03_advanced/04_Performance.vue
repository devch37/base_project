<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-advanced">Advanced · 04</div>
      <h1>⚡ 성능 최적화</h1>
      <p>Vue 앱의 렌더링 성능을 최적화하는 실무 기법들을 배웁니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ shallowRef / shallowReactive — 얕은 반응형</h2>
      <div class="code-block">{{ shallowCode }}</div>
      <div class="tip">
        💡 깊은 중첩 객체에 reactive/ref를 쓰면 모든 중첩 속성이 반응형이 되어 오버헤드 발생.<br>
        최상위만 반응형이 필요하면 <strong>shallowRef/shallowReactive</strong>를 사용하세요.
      </div>
    </div>

    <div class="section-card">
      <h2>2️⃣ v-memo — 리스트 렌더링 최적화</h2>
      <div class="demo-box">
        <h4>🎮 v-memo 효과 비교</h4>
        <button class="btn btn-primary" @click="updateCounter">업데이트 (counter: {{ perfCounter }})</button>
        <button class="btn btn-secondary" @click="selectItem(1)" style="margin-left:8px">아이템 1 선택</button>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-size:12px;font-weight:600;color:#dc2626;margin-bottom:8px">❌ v-memo 없음</div>
            <div v-for="item in listItems" :key="item.id" class="memo-item">
              {{ item.name }} {{ item.id === selectedId ? '✅' : '' }}
              <span class="render-count">렌더: {{ incrementRender('no', item.id) }}</span>
            </div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#15803d;margin-bottom:8px">✅ v-memo 있음</div>
            <div
              v-for="item in listItems" :key="item.id"
              v-memo="[item.id === selectedId]"
              class="memo-item"
            >
              {{ item.name }} {{ item.id === selectedId ? '✅' : '' }}
              <span class="render-count">렌더: {{ incrementRender('yes', item.id) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="code-block">{{ memoCode }}</div>
    </div>

    <div class="section-card">
      <h2>3️⃣ computed 캐싱 활용</h2>
      <div class="code-block">{{ computedCode }}</div>
    </div>

    <div class="section-card">
      <h2>4️⃣ 실무 성능 체크리스트</h2>
      <div class="checklist">
        <div v-for="item in checklist" :key="item.title" class="check-item">
          <div class="check-icon">{{ item.good ? '✅' : '⚠️' }}</div>
          <div>
            <div class="check-title">{{ item.title }}</div>
            <div class="check-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const perfCounter = ref(0)
const selectedId = ref(null)
const renderCounts = reactive({ no: {}, yes: {} })

const listItems = [
  { id: 1, name: '아이템 A' },
  { id: 2, name: '아이템 B' },
  { id: 3, name: '아이템 C' },
  { id: 4, name: '아이템 D' },
]

const updateCounter = () => perfCounter.value++
const selectItem = (id) => selectedId.value = id

const incrementRender = (type, id) => {
  if (!renderCounts[type][id]) renderCounts[type][id] = 0
  renderCounts[type][id]++
  return renderCounts[type][id]
}

const checklist = [
  { good: true, title: 'v-for에 :key 사용', desc: '고유하고 안정적인 값(id)을 key로 사용' },
  { good: true, title: 'computed 사용', desc: '반복되는 계산은 computed로 캐싱' },
  { good: true, title: '컴포넌트 분리', desc: '큰 컴포넌트를 작게 나눠 재렌더링 범위 축소' },
  { good: true, title: '라우트 코드 분할', desc: '() => import()로 페이지별 지연 로딩' },
  { good: false, title: 'v-if vs v-show 구분', desc: '자주 토글: v-show, 드물게 토글: v-if' },
  { good: false, title: 'v-for + v-if 혼용 피하기', desc: '같은 요소에 v-for + v-if는 성능 이슈' },
]

const shallowCode = `import { shallowRef, shallowReactive, triggerRef } from 'vue'

// shallowRef: 최상위 .value만 반응형 (중첩은 아님)
const state = shallowRef({
  users: [/* 10000명 */],
  config: { /* 복잡한 설정 */ }
})

// 중첩 변경 시 triggerRef로 수동 업데이트
state.value.users.push(newUser)
triggerRef(state)  // 강제로 업데이트 알림

// shallowReactive: 최상위 속성만 반응형
const store = shallowReactive({
  items: [],   // items 자체는 반응형
  meta: {}     // meta 자체는 반응형, meta.xxx는 아님
})

// 언제 쓸까?
// - 거대한 데이터 구조 (차트 데이터, 테이블 rows)
// - 외부 라이브러리 객체 (Three.js scene 등)
// - 성능이 중요한 리스트`

const memoCode = `<!-- v-memo: 지정한 값들이 변하지 않으면 서브트리 렌더링 스킵 -->
<div
  v-for="item in list"
  :key="item.id"
  v-memo="[item.id === selectedId]"
>
  {{ item.name }}
</div>

// 위 코드의 의미:
// item.id === selectedId 값이 변할 때만 이 아이템 재렌더링
// 1000개 아이템에서 1개만 선택 변경 시 → 1개만 재렌더링!

// v-memo="[]" — 한 번만 렌더링, 이후 업데이트 없음 (v-once와 유사)
<StaticContent v-memo="[]" />`

const computedCode = `// ✅ computed — 캐싱됨
const sortedList = computed(() => {
  console.log('계산 중...')  // 의존값 변경 시에만 실행
  return [...list.value].sort((a, b) => a.name.localeCompare(b.name))
})

// 1000번 접근해도 한 번만 계산
console.log(sortedList.value)  // 계산됨
console.log(sortedList.value)  // 캐시 반환 (재계산 없음!)
console.log(sortedList.value)  // 캐시 반환

// ❌ methods — 캐싱 안 됨
const getSortedList = () => {
  console.log('계산 중...')  // 호출할 때마다 실행
  return [...list.value].sort(...)
}

// 1000번 호출 시 1000번 계산!`
</script>

<style scoped>
.memo-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 4px;
  font-size: 14px;
}
.render-count { font-size: 11px; color: #94a3b8; }
.checklist { display: flex; flex-direction: column; gap: 8px; }
.check-item { display: flex; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; }
.check-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.check-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.check-desc  { font-size: 13px; color: #64748b; }
</style>
