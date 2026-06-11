<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-basic">Basic · 03</div>
      <h1>🖱️ 이벤트 처리 (Event Handling)</h1>
      <p><code>v-on</code> 또는 <code>@</code>로 DOM 이벤트를 처리합니다.<br>
         이벤트 수식어(Modifier)로 preventDefault, stopPropagation 등을 선언적으로 처리합니다.</p>
    </div>

    <!-- 기본 이벤트 -->
    <div class="section-card">
      <h2>1️⃣ 기본 이벤트 처리</h2>
      <div class="demo-box">
        <h4>🎮 클릭 이벤트</h4>
        <div class="btn-group">
          <!-- 인라인 핸들러: 간단한 로직은 직접 -->
          <button class="btn btn-primary" @click="clickCount++">
            클릭! ({{ clickCount }}회)
          </button>
          <!-- 메서드 핸들러: 복잡한 로직 -->
          <button class="btn btn-secondary" @click="handleReset">초기화</button>
          <!-- 이벤트 객체 받기 -->
          <button class="btn btn-secondary" @click="handleClickWithEvent">
            이벤트 객체 받기
          </button>
        </div>
        <div v-if="eventInfo" class="result-box" style="margin-top:8px">
          이벤트 타입: {{ eventInfo.type }} | 위치: ({{ eventInfo.x }}, {{ eventInfo.y }})
        </div>
      </div>

      <div class="demo-box">
        <h4>🎮 마우스/키보드 이벤트</h4>
        <div
          class="event-zone"
          @mouseenter="mouseEvent = '마우스 진입'"
          @mouseleave="mouseEvent = '마우스 나감'"
          @mousemove="handleMouseMove"
        >
          {{ mouseEvent }} | 위치: ({{ mouseX }}, {{ mouseY }})
        </div>

        <input
          class="form-input"
          style="margin-top:12px"
          v-model="keyInput"
          @keyup="lastKey = $event.key"
          @keyup.enter="handleEnter"
          placeholder="키보드 입력 (Enter 누르면 확인)"
        />
        <div style="font-size:13px;color:#64748b;margin-top:4px">
          마지막 키: <strong>{{ lastKey }}</strong> | 값: <strong>{{ keyInput }}</strong>
        </div>
        <div v-if="submittedValue" class="result-box" style="margin-top:8px">
          ✅ 제출됨: "{{ submittedValue }}"
        </div>
      </div>

      <div class="code-block">{{ basicEventCode }}</div>
    </div>

    <!-- 이벤트 수식어 -->
    <div class="section-card">
      <h2>2️⃣ 이벤트 수식어 (Event Modifiers)</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        코드 없이 선언적으로 이벤트 동작을 제어합니다.
      </p>

      <div class="demo-box">
        <h4>🎮 .stop — 이벤트 버블링 방지</h4>
        <div
          class="event-zone"
          style="background:#fff3cd;cursor:pointer"
          @click="bubbleLogs.push('부모 클릭됨')"
        >
          부모 요소 (클릭하면 "부모 클릭됨" 로그)
          <div
            style="background:#d4edda;padding:12px;margin-top:8px;border-radius:6px"
            @click.stop="bubbleLogs.push('자식 클릭됨 (버블링 차단!)')"
          >
            자식 요소 (.stop 적용) — 클릭해도 부모 이벤트 발생 안 함
          </div>
        </div>
        <div style="margin-top:8px">
          <span v-for="(log, i) in bubbleLogs" :key="i" class="result" style="margin:2px">{{ log }}</span>
          <button v-if="bubbleLogs.length" class="btn btn-sm btn-secondary" @click="bubbleLogs=[]" style="margin-left:8px">초기화</button>
        </div>
      </div>

      <div class="demo-box">
        <h4>🎮 .prevent — 기본 동작 방지</h4>
        <!-- .prevent = event.preventDefault() -->
        <form @submit.prevent="handleFormSubmit">
          <input class="form-input" v-model="formName" placeholder="이름 입력" style="margin-bottom:8px" />
          <button type="submit" class="btn btn-primary">
            제출 (.prevent 적용 — 페이지 새로고침 없음)
          </button>
        </form>
        <div v-if="formSubmitLog" class="result-box" style="margin-top:8px">
          {{ formSubmitLog }}
        </div>
      </div>

      <div class="code-block">{{ modifierCode }}</div>

      <h3>수식어 전체 목록</h3>
      <div class="modifier-grid">
        <div class="modifier-item" v-for="m in modifiers" :key="m.name">
          <code class="modifier-name">{{ m.name }}</code>
          <div class="modifier-desc">{{ m.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 키 수식어 -->
    <div class="section-card">
      <h2>3️⃣ 키 수식어 (Key Modifiers)</h2>
      <div class="demo-box">
        <h4>🎮 특정 키 이벤트</h4>
        <input
          class="form-input"
          @keyup.enter="keyLogs.push('Enter 눌림')"
          @keyup.esc="keyLogs.push('Esc 눌림')"
          @keyup.space="keyLogs.push('Space 눌림')"
          @keydown.ctrl.s.prevent="keyLogs.push('Ctrl+S (기본 저장 방지)')"
          placeholder="Enter, Esc, Space, Ctrl+S 눌러보기"
        />
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">
          <span v-for="(log, i) in keyLogs.slice(-5)" :key="i" class="result">{{ log }}</span>
        </div>
      </div>
      <div class="code-block">{{ keyModifierCode }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 기본 이벤트
const clickCount = ref(0)
const eventInfo = ref(null)
const mouseEvent = ref('마우스를 올려보세요')
const mouseX = ref(0)
const mouseY = ref(0)
const keyInput = ref('')
const lastKey = ref('-')
const submittedValue = ref('')

const handleReset = () => { clickCount.value = 0 }
const handleClickWithEvent = (event) => {
  eventInfo.value = { type: event.type, x: event.clientX, y: event.clientY }
}
const handleMouseMove = (e) => {
  mouseX.value = e.offsetX
  mouseY.value = e.offsetY
}
const handleEnter = () => {
  submittedValue.value = keyInput.value
}

// 이벤트 수식어
const bubbleLogs = ref([])
const formName = ref('')
const formSubmitLog = ref('')

const handleFormSubmit = () => {
  formSubmitLog.value = `✅ 제출됨: "${formName.value}" — 페이지가 새로고침되지 않음!`
}

// 키 수식어
const keyLogs = ref([])

// 코드 예시
const basicEventCode = `<template>
  <!-- 인라인 핸들러 (간단한 경우) -->
  <button @click="count++">클릭</button>

  <!-- 메서드 핸들러 -->
  <button @click="handleClick">클릭</button>

  <!-- 이벤트 객체 받기 -->
  <button @click="handleClick($event)">클릭</button>

  <!-- 마우스 이벤트 -->
  <div @mouseenter="onEnter" @mouseleave="onLeave">영역</div>

  <!-- 키보드 이벤트 -->
  <input @keyup="onKeyUp" @keyup.enter="onEnter" />
</template>

<script setup>
function handleClick(event) {
  console.log(event.type)    // 'click'
  console.log(event.target)  // 클릭된 요소
}
<\/script>`

const modifierCode = `<!-- 이벤트 수식어 -->
@click.stop       <!-- stopPropagation() — 버블링 차단 -->
@click.prevent    <!-- preventDefault() — 기본 동작 방지 -->
@click.self       <!-- 자기 자신 클릭 시에만 -->
@click.once       <!-- 딱 한 번만 실행 -->
@click.passive    <!-- 스크롤 성능 최적화 -->
@click.capture    <!-- 캡처 단계에서 처리 -->

<!-- 체이닝 가능 -->
@click.stop.prevent

<!-- 폼 제출 시 새로고침 방지 (가장 많이 씀!) -->
<form @submit.prevent="handleSubmit">
  <button type="submit">제출</button>
</form>`

const keyModifierCode = `<!-- 자주 쓰는 키 수식어 -->
@keyup.enter    <!-- Enter -->
@keyup.esc      <!-- Escape -->
@keyup.space    <!-- Space -->
@keyup.tab      <!-- Tab -->
@keyup.delete   <!-- Delete/Backspace -->
@keyup.up       <!-- ↑ -->
@keyup.down     <!-- ↓ -->

<!-- 특수 키 조합 -->
@keydown.ctrl.s   <!-- Ctrl+S -->
@keydown.shift.enter  <!-- Shift+Enter -->
@keydown.alt.enter    <!-- Alt+Enter -->`

const modifiers = [
  { name: '.stop',    desc: 'stopPropagation() — 이벤트 버블링 차단' },
  { name: '.prevent', desc: 'preventDefault() — 기본 동작 방지 (폼 제출 등)' },
  { name: '.self',    desc: '이벤트 발생 요소 자체일 때만 실행' },
  { name: '.once',    desc: '이벤트 한 번만 발생' },
  { name: '.passive', desc: '스크롤 성능 최적화' },
  { name: '.capture', desc: '캡처 단계에서 이벤트 처리' },
]
</script>

<style scoped>
.event-zone {
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: crosshair;
  font-size: 14px;
  color: #64748b;
  user-select: none;
}
.modifier-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}
.modifier-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}
.modifier-name {
  display: block;
  color: #42b883;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
}
.modifier-desc { font-size: 12px; color: #64748b; }
</style>
