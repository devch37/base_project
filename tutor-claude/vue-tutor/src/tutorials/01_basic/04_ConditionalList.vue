<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-basic">Basic · 04</div>
      <h1>🔀 조건부/리스트 렌더링</h1>
      <p><code>v-if</code> / <code>v-show</code>로 조건부 렌더링,<br>
         <code>v-for</code>로 배열/객체를 반복 렌더링합니다.</p>
    </div>

    <!-- v-if vs v-show -->
    <div class="section-card">
      <h2>1️⃣ v-if vs v-show</h2>
      <div class="compare-grid">
        <div class="compare-col good">
          <h4>v-if</h4>
          <p style="font-size:13px;color:#374151">조건이 false면 DOM에서 완전히 제거됩니다.</p>
        </div>
        <div class="compare-col good">
          <h4>v-show</h4>
          <p style="font-size:13px;color:#374151">조건이 false면 display:none 적용됩니다 (DOM은 유지).</p>
        </div>
      </div>

      <div class="demo-box">
        <h4>🎮 데모</h4>
        <div class="btn-group">
          <button class="btn btn-primary" @click="showIf = !showIf">v-if 토글 ({{ showIf }})</button>
          <button class="btn btn-secondary" @click="showShow = !showShow">v-show 토글 ({{ showShow }})</button>
        </div>
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">v-if → DOM 존재 여부:</div>
            <div v-if="showIf" class="result-box">✅ DOM에 존재함 (v-if)</div>
            <div v-else style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;font-size:14px;color:#dc2626">
              ❌ DOM에서 제거됨
            </div>
          </div>
          <div>
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">v-show → CSS display:</div>
            <div v-show="showShow" class="result-box">✅ display: block (v-show)</div>
            <div v-show="!showShow" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;font-size:14px;color:#dc2626">
              display: none (DOM은 존재!)
            </div>
          </div>
        </div>
      </div>

      <div class="demo-box">
        <h4>🎮 v-if / v-else-if / v-else</h4>
        <div class="btn-group">
          <button
            v-for="s in ['loading', 'success', 'error', 'empty']" :key="s"
            :class="['btn', status === s ? 'btn-primary' : 'btn-secondary']"
            @click="status = s"
          >{{ s }}</button>
        </div>
        <div style="margin-top:12px">
          <div v-if="status === 'loading'" class="status-box loading-box">⏳ 로딩 중...</div>
          <div v-else-if="status === 'success'" class="status-box success-box">✅ 성공!</div>
          <div v-else-if="status === 'error'" class="status-box error-box">❌ 오류 발생</div>
          <div v-else class="status-box empty-box">📭 데이터 없음</div>
        </div>
      </div>

      <div class="code-block">{{ conditionCode }}</div>
      <div class="tip">💡 <strong>언제 쓸까?</strong><br>
        v-if: 조건이 자주 안 바뀔 때 (초기 렌더링 비용 낮음)<br>
        v-show: 자주 토글될 때 (DOM 유지 → 토글 비용 낮음)
      </div>
    </div>

    <!-- v-for -->
    <div class="section-card">
      <h2>2️⃣ v-for — 리스트 렌더링</h2>
      <div class="demo-box">
        <h4>🎮 배열 렌더링 + 동적 추가/삭제</h4>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input class="form-input" v-model="newFruit" @keyup.enter="addFruit" placeholder="과일 이름 입력" />
          <button class="btn btn-primary" @click="addFruit">추가</button>
        </div>
        <div v-if="fruits.length === 0" style="color:#94a3b8;text-align:center;padding:20px">
          목록이 비어있습니다.
        </div>
        <!-- :key 는 반드시 고유한 값! index 사용은 지양 -->
        <div
          v-for="(fruit, index) in fruits" :key="fruit.id"
          class="list-item"
        >
          <span class="list-index">{{ index + 1 }}</span>
          <span>{{ fruit.name }}</span>
          <button class="btn btn-sm btn-danger" @click="removeFruit(fruit.id)">삭제</button>
        </div>
      </div>

      <div class="demo-box">
        <h4>🎮 객체 렌더링</h4>
        <!-- v-for로 객체의 key, value 순회 -->
        <div v-for="(value, key, index) in userProfile" :key="key" class="obj-item">
          <span class="obj-key">{{ key }}</span>
          <span class="obj-value">{{ value }}</span>
          <span class="obj-index">#{{ index }}</span>
        </div>
      </div>

      <div class="demo-box">
        <h4>🎮 정렬/필터링된 리스트</h4>
        <div class="btn-group">
          <button class="btn btn-sm btn-secondary" @click="sortOrder = 'asc'">이름 오름차순</button>
          <button class="btn btn-sm btn-secondary" @click="sortOrder = 'desc'">이름 내림차순</button>
          <button class="btn btn-sm btn-secondary" @click="filterActive = !filterActive">
            {{ filterActive ? '전체 보기' : '활성만 보기' }}
          </button>
        </div>
        <!-- computed로 정렬/필터링 처리 (v-for에서 직접 하지 않음!) -->
        <div v-for="person in sortedFilteredPeople" :key="person.id" class="list-item" style="margin-top:8px">
          <span :class="['status-dot', person.active ? 'dot-active' : 'dot-inactive']"></span>
          <span>{{ person.name }}</span>
          <span style="color:#94a3b8;font-size:13px">{{ person.role }}</span>
        </div>
      </div>

      <div class="code-block">{{ listCode }}</div>
      <div class="tip">
        ⚠️ <strong>:key가 중요한 이유</strong><br>
        Vue는 :key로 어떤 DOM이 바뀌었는지 추적합니다. index를 key로 쓰면 삭제 시 버그 발생!<br>
        반드시 <strong>고유하고 안정적인 값</strong>(id 등)을 key로 사용하세요.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

// v-if / v-show
const showIf = ref(true)
const showShow = ref(true)
const status = ref('success')

// v-for 배열
let nextId = 4
const fruits = reactive([
  { id: 1, name: '🍎 사과' },
  { id: 2, name: '🍌 바나나' },
  { id: 3, name: '🍓 딸기' },
])
const newFruit = ref('')
const addFruit = () => {
  if (!newFruit.value.trim()) return
  fruits.push({ id: nextId++, name: newFruit.value })
  newFruit.value = ''
}
const removeFruit = (id) => {
  const i = fruits.findIndex(f => f.id === id)
  fruits.splice(i, 1)
}

// 객체 순회
const userProfile = reactive({ 이름: '김철수', 나이: 25, 직업: '개발자', 도시: '서울' })

// 정렬/필터
const sortOrder = ref('asc')
const filterActive = ref(false)
const people = reactive([
  { id: 1, name: '이영희', role: 'Frontend', active: true },
  { id: 2, name: '김철수', role: 'Backend', active: false },
  { id: 3, name: '박민준', role: 'DevOps', active: true },
  { id: 4, name: '정수연', role: 'Designer', active: true },
])

const sortedFilteredPeople = computed(() => {
  let result = filterActive.value ? people.filter(p => p.active) : [...people]
  return result.sort((a, b) =>
    sortOrder.value === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  )
})

// 코드 예시
const conditionCode = `<!-- v-if / v-else-if / v-else -->
<div v-if="status === 'loading'">로딩 중...</div>
<div v-else-if="status === 'error'">오류 발생</div>
<div v-else>성공!</div>

<!-- v-show: DOM 유지, display:none 토글 -->
<div v-show="isVisible">보이거나 숨겨짐</div>

<!-- template으로 여러 요소를 묶기 (DOM에 렌더링 안 됨) -->
<template v-if="isLoggedIn">
  <h1>환영합니다</h1>
  <p>{{ userName }}</p>
</template>`

const listCode = `<!-- 배열 렌더링 -->
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>

<!-- index도 받기 -->
<div v-for="(item, index) in items" :key="item.id">
  {{ index + 1 }}. {{ item.name }}
</div>

<!-- 객체 순회 -->
<div v-for="(value, key, index) in obj" :key="key">
  {{ key }}: {{ value }}
</div>

<!-- 정렬/필터는 computed로! (v-for 안에서 직접 X) -->
const filteredItems = computed(() =>
  items.value.filter(item => item.active)
)
<div v-for="item in filteredItems" :key="item.id">

<!-- ❌ 같은 요소에 v-if + v-for 쓰지 말 것 (v-if가 먼저 실행됨) -->
<!-- ✅ 대신 computed로 미리 필터링 -->
`
</script>

<style scoped>
.status-box {
  padding: 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
}
.loading-box { background: #fef9c3; color: #854d0e; }
.success-box { background: #f0fdf4; color: #15803d; }
.error-box   { background: #fef2f2; color: #dc2626; }
.empty-box   { background: #f8fafc; color: #64748b; }

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 6px;
  font-size: 14px;
}
.list-index {
  width: 24px;
  height: 24px;
  background: #42b883;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.list-item span:nth-child(2) { flex: 1; }

.obj-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}
.obj-key   { color: #7c3aed; font-weight: 600; min-width: 60px; }
.obj-value { flex: 1; }
.obj-index { color: #94a3b8; font-size: 12px; }

.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-active   { background: #42b883; }
.dot-inactive { background: #cbd5e1; }
</style>
