<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-project">Project</div>
      <h1>✅ 실전 Todo 앱</h1>
      <p>지금까지 배운 모든 것을 사용합니다:<br>
        <strong>Pinia</strong> (상태관리) · <strong>Composables</strong> (로컬스토리지) ·
        <strong>computed</strong> (필터/정렬) · <strong>Transitions</strong> (애니메이션)</p>
    </div>

    <div class="todo-app">
      <!-- 헤더 -->
      <div class="todo-header">
        <h2>📝 My Tasks</h2>
        <div class="todo-stats">
          <div class="stat-item">
            <div class="stat-num">{{ todos.length }}</div>
            <div class="stat-label">전체</div>
          </div>
          <div class="stat-item stat-done">
            <div class="stat-num">{{ completedCount }}</div>
            <div class="stat-label">완료</div>
          </div>
          <div class="stat-item stat-todo">
            <div class="stat-num">{{ remainingCount }}</div>
            <div class="stat-label">남은 것</div>
          </div>
        </div>
      </div>

      <!-- 입력 -->
      <div class="todo-input-area">
        <input
          ref="inputRef"
          class="todo-input"
          v-model.trim="newTodo"
          @keyup.enter="addTodo"
          placeholder="할 일을 입력하고 Enter를 누르세요"
        />
        <select class="todo-priority-select" v-model="newPriority">
          <option value="low">🟢 낮음</option>
          <option value="medium">🟡 중간</option>
          <option value="high">🔴 높음</option>
        </select>
        <button class="btn btn-primary" @click="addTodo" :disabled="!newTodo">추가</button>
      </div>

      <!-- 필터/정렬 -->
      <div class="todo-controls">
        <div class="filter-tabs">
          <button
            v-for="f in filters" :key="f.value"
            :class="['filter-tab', currentFilter === f.value && 'active']"
            @click="currentFilter = f.value"
          >{{ f.label }}</button>
        </div>
        <select class="sort-select" v-model="sortBy">
          <option value="created">생성 순</option>
          <option value="priority">우선순위</option>
          <option value="alpha">가나다 순</option>
        </select>
      </div>

      <!-- 검색 -->
      <input class="form-input" v-model="searchQuery" placeholder="🔍 할 일 검색..." style="margin-bottom:12px" />

      <!-- 할 일 목록 -->
      <TransitionGroup name="todo-list" tag="div" class="todo-list">
        <div
          v-for="todo in filteredTodos" :key="todo.id"
          :class="['todo-item', todo.done && 'todo-done', 'priority-' + todo.priority]"
        >
          <label class="todo-checkbox">
            <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo.id)" />
            <span class="checkbox-custom"></span>
          </label>

          <div class="todo-content" v-if="editingId !== todo.id">
            <div :class="['todo-text', todo.done && 'done-text']">{{ todo.text }}</div>
            <div class="todo-meta">
              <span :class="['priority-badge', 'badge-' + todo.priority]">
                {{ { low: '🟢 낮음', medium: '🟡 중간', high: '🔴 높음' }[todo.priority] }}
              </span>
              <span class="todo-date">{{ formatDate(todo.createdAt) }}</span>
            </div>
          </div>

          <input
            v-else
            class="todo-edit-input"
            v-model="editText"
            @keyup.enter="saveEdit(todo.id)"
            @keyup.esc="cancelEdit"
            @blur="saveEdit(todo.id)"
            :ref="el => editingId === todo.id && el?.focus()"
          />

          <div class="todo-actions">
            <button class="action-btn" @click="startEdit(todo)" :disabled="todo.done">✏️</button>
            <button class="action-btn action-delete" @click="removeTodo(todo.id)">🗑️</button>
          </div>
        </div>

        <div key="empty" v-if="filteredTodos.length === 0" class="empty-state">
          <div style="font-size:48px;margin-bottom:12px">
            {{ currentFilter === 'done' ? '🎉' : '📭' }}
          </div>
          <div>{{ currentFilter === 'done' ? '아직 완료된 항목이 없습니다' : '할 일이 없습니다!' }}</div>
        </div>
      </TransitionGroup>

      <!-- 하단 액션 -->
      <div class="todo-footer" v-if="todos.length > 0">
        <span style="font-size:13px;color:#64748b">
          {{ completedCount }}개 완료
        </span>
        <button
          v-if="completedCount > 0"
          class="btn btn-sm btn-danger"
          @click="clearCompleted"
        >완료 항목 삭제</button>
      </div>

      <!-- 진행률 -->
      <div class="progress-bar" v-if="todos.length > 0">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div style="text-align:right;font-size:12px;color:#94a3b8;margin-top:4px">
        {{ progressPercent }}% 완료
      </div>
    </div>

    <!-- 코드 구조 설명 -->
    <div class="section-card" style="margin-top:32px">
      <h2>🏗️ 이 앱의 기술 스택</h2>
      <div class="tech-grid">
        <div class="tech-item" v-for="tech in techStack" :key="tech.name">
          <div class="tech-icon">{{ tech.icon }}</div>
          <div class="tech-name">{{ tech.name }}</div>
          <div class="tech-desc">{{ tech.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// ===== useLocalStorage Composable =====
function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key)
  const value = ref(stored ? JSON.parse(stored) : defaultValue)
  watch(value, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true })
  return value
}

// ===== Todo State (영속성 있음 — 새로고침해도 유지!) =====
const todos = useLocalStorage('vue-tutor-todos', [
  { id: 1, text: 'Vue 기초 배우기', done: true, priority: 'high', createdAt: Date.now() - 86400000 },
  { id: 2, text: 'Composition API 마스터', done: false, priority: 'high', createdAt: Date.now() - 3600000 },
  { id: 3, text: 'Pinia 상태관리 학습', done: false, priority: 'medium', createdAt: Date.now() - 1800000 },
  { id: 4, text: 'Todo 앱 완성하기', done: false, priority: 'low', createdAt: Date.now() },
])

// ===== UI State =====
const newTodo = ref('')
const newPriority = ref('medium')
const currentFilter = ref('all')
const sortBy = ref('created')
const searchQuery = ref('')
const editingId = ref(null)
const editText = ref('')
const inputRef = ref(null)
let nextId = computed(() => Math.max(0, ...todos.value.map(t => t.id)) + 1)

// ===== Computed =====
const completedCount = computed(() => todos.value.filter(t => t.done).length)
const remainingCount = computed(() => todos.value.filter(t => !t.done).length)
const progressPercent = computed(() =>
  todos.value.length ? Math.round((completedCount.value / todos.value.length) * 100) : 0
)

const priorityOrder = { high: 0, medium: 1, low: 2 }

const filteredTodos = computed(() => {
  let result = todos.value

  // 필터
  if (currentFilter.value === 'active') result = result.filter(t => !t.done)
  if (currentFilter.value === 'done')   result = result.filter(t => t.done)

  // 검색
  if (searchQuery.value) {
    result = result.filter(t => t.text.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }

  // 정렬
  return [...result].sort((a, b) => {
    if (sortBy.value === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
    if (sortBy.value === 'alpha')    return a.text.localeCompare(b.text)
    return b.createdAt - a.createdAt
  })
})

// ===== Actions =====
const addTodo = () => {
  if (!newTodo.value) return
  todos.value.push({
    id: nextId.value,
    text: newTodo.value,
    done: false,
    priority: newPriority.value,
    createdAt: Date.now()
  })
  newTodo.value = ''
  newPriority.value = 'medium'
}

const toggleTodo = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) todo.done = !todo.done
}

const removeTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id)
}

const clearCompleted = () => {
  todos.value = todos.value.filter(t => !t.done)
}

const startEdit = (todo) => {
  editingId.value = todo.id
  editText.value = todo.text
}

const saveEdit = (id) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo && editText.value.trim()) {
    todo.text = editText.value.trim()
  }
  editingId.value = null
}

const cancelEdit = () => { editingId.value = null }

const formatDate = (ts) => {
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
}

const filters = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'done', label: '완료' },
]

const techStack = [
  { icon: '🔄', name: 'ref / reactive', desc: '반응형 상태 관리' },
  { icon: '🧮', name: 'computed', desc: '필터링, 정렬, 통계' },
  { icon: '👁️', name: 'watch', desc: '로컬스토리지 자동 저장' },
  { icon: '🪝', name: 'Composable', desc: 'useLocalStorage 재사용' },
  { icon: '🎨', name: 'TransitionGroup', desc: '목록 애니메이션' },
  { icon: '📝', name: 'v-model', desc: '폼 입력 바인딩' },
]
</script>

<style scoped>
.todo-app {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,.07);
}
.todo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.todo-header h2 { font-size: 22px; font-weight: 700; }
.todo-stats { display: flex; gap: 16px; }
.stat-item { text-align: center; }
.stat-num { font-size: 22px; font-weight: 800; color: #94a3b8; }
.stat-done .stat-num { color: #42b883; }
.stat-todo .stat-num { color: #60a5fa; }
.stat-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: .5px; }

.todo-input-area {
  display: flex; gap: 8px; margin-bottom: 16px;
}
.todo-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color .15s;
}
.todo-input:focus { border-color: #42b883; }
.todo-priority-select {
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.todo-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.filter-tabs { display: flex; gap: 4px; }
.filter-tab {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  color: #64748b;
  transition: all .15s;
}
.filter-tab.active { background: #42b883; color: white; border-color: #42b883; }
.sort-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.todo-list { min-height: 60px; }
.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  margin-bottom: 6px;
  background: white;
  transition: all .2s;
  border-left: 4px solid transparent;
}
.todo-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.priority-high   { border-left-color: #f87171; }
.priority-medium { border-left-color: #fbbf24; }
.priority-low    { border-left-color: #4ade80; }
.todo-done { opacity: .7; background: #f8fafc; }

.todo-checkbox { position: relative; cursor: pointer; }
.todo-checkbox input { position: absolute; opacity: 0; }
.checkbox-custom {
  width: 20px; height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 5px;
  display: block;
  transition: all .15s;
}
.todo-checkbox input:checked ~ .checkbox-custom {
  background: #42b883;
  border-color: #42b883;
}
.todo-checkbox input:checked ~ .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.todo-content { flex: 1; }
.todo-text { font-size: 14px; font-weight: 500; }
.done-text { text-decoration: line-through; color: #94a3b8; }
.todo-meta { display: flex; gap: 8px; margin-top: 4px; align-items: center; }
.priority-badge { font-size: 11px; padding: 1px 8px; border-radius: 12px; }
.badge-high   { background: #fef2f2; color: #dc2626; }
.badge-medium { background: #fffbeb; color: #92400e; }
.badge-low    { background: #f0fdf4; color: #15803d; }
.todo-date { font-size: 11px; color: #94a3b8; }

.todo-edit-input {
  flex: 1;
  padding: 6px 10px;
  border: 2px solid #42b883;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.todo-actions { display: flex; gap: 4px; }
.action-btn {
  background: none; border: none; cursor: pointer;
  padding: 4px 6px; border-radius: 6px;
  font-size: 14px; transition: background .15s;
}
.action-btn:hover { background: #f1f5f9; }
.action-btn:disabled { opacity: .3; cursor: default; }
.action-delete:hover { background: #fef2f2; }

.empty-state {
  text-align: center; padding: 32px; color: #94a3b8;
  font-size: 15px;
}

.todo-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 12px; border-top: 1px solid #f1f5f9;
  margin-top: 8px;
}

.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  margin-top: 16px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #42b883, #35495e);
  border-radius: 3px;
  transition: width .5s ease;
}

/* TransitionGroup 애니메이션 */
.todo-list-enter-active,
.todo-list-leave-active { transition: all .3s ease; }
.todo-list-enter-from { opacity: 0; transform: translateY(-10px); }
.todo-list-leave-to  { opacity: 0; transform: translateX(20px); }
.todo-list-move { transition: transform .3s ease; }

/* Tech Stack */
.tech-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
.tech-item {
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 8px; padding: 16px; text-align: center;
}
.tech-icon { font-size: 24px; margin-bottom: 6px; }
.tech-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.tech-desc { font-size: 12px; color: #64748b; }
</style>
