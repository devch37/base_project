<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-intermediate">Intermediate · 03</div>
      <h1>🔁 생명주기 훅 (Lifecycle Hooks)</h1>
      <p>컴포넌트가 생성되고, 마운트되고, 업데이트되고, 소멸되는 각 시점에 코드를 실행합니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ 생명주기 다이어그램</h2>
      <div class="lifecycle-flow">
        <div v-for="step in lifecycleSteps" :key="step.name"
          :class="['lc-step', 'lc-' + step.type, activatedSteps.includes(step.name) && 'lc-active']">
          <div class="lc-name">{{ step.name }}</div>
          <div class="lc-desc">{{ step.desc }}</div>
        </div>
      </div>
      <div class="tip">💡 클릭/데이터 변경 등 인터랙션을 해보면 어떤 훅이 실행되는지 로그에서 확인하세요.</div>
    </div>

    <div class="section-card">
      <h2>2️⃣ 라이브 생명주기 로그</h2>
      <div class="demo-box">
        <h4>🎮 데모</h4>
        <div class="btn-group">
          <button class="btn btn-primary" @click="triggerUpdate">업데이트 트리거 (count: {{ count }})</button>
          <button class="btn btn-secondary" @click="showChild = !showChild">
            {{ showChild ? '자식 컴포넌트 제거 (unmount)' : '자식 컴포넌트 추가 (mount)' }}
          </button>
          <button class="btn btn-secondary btn-sm" @click="logs = []">로그 초기화</button>
        </div>

        <LifecycleChild v-if="showChild" :count="count" @log="addLog" />

        <div class="log-container" style="margin-top:12px">
          <div v-if="logs.length === 0" style="color:#94a3b8;text-align:center;padding:20px">
            위의 버튼을 클릭해 로그를 확인하세요
          </div>
          <div v-for="(log, i) in logs" :key="i" :class="['log-entry', 'log-' + log.type]">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-hook">{{ log.hook }}</span>
            <span>{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-card">
      <h2>3️⃣ 실무에서 각 훅의 용도</h2>
      <div class="code-block">{{ lifecycleUsageCode }}</div>
    </div>

    <div class="section-card">
      <h2>4️⃣ 가장 중요한 패턴: onMounted + onUnmounted</h2>
      <div class="code-block">{{ cleanupCode }}</div>
      <div class="tip">
        ⚠️ <strong>메모리 누수 방지!</strong><br>
        onMounted에서 addEventListener, setInterval, WebSocket 등을 시작했다면<br>
        반드시 onUnmounted에서 정리(cleanup)해야 합니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, onMounted, onUnmounted, onUpdated, onBeforeMount } from 'vue'

const count = ref(0)
const showChild = ref(true)
const logs = ref([])
const activatedSteps = ref([])

const addLog = (log) => {
  logs.value.unshift(log)
  if (logs.value.length > 20) logs.value.pop()
  activatedSteps.value = [log.hook]
  setTimeout(() => { activatedSteps.value = [] }, 500)
}

const triggerUpdate = () => { count.value++ }

const LifecycleChild = defineComponent({
  props: { count: Number },
  emits: ['log'],
  setup(props, { emit }) {
    const log = (hook, msg) => emit('log', {
      time: new Date().toLocaleTimeString(),
      hook,
      type: hook.includes('Unmount') || hook.includes('Before') ? 'warn' : 'info',
      message: msg
    })

    onBeforeMount(() => log('onBeforeMount', 'DOM 생성 직전 — 아직 DOM 접근 불가'))
    onMounted(() => log('onMounted', 'DOM에 마운트됨 — API 호출, DOM 접근 가능 ✅'))
    onUpdated(() => log('onUpdated', `업데이트됨 — count: ${props.count}`))
    onUnmounted(() => log('onUnmounted', '컴포넌트 소멸 — 타이머/이벤트 정리 ✅'))

    return {}
  },
  template: `<div class="child-box">🧩 자식 컴포넌트 (count: {{ count }})</div>`
})

const lifecycleSteps = [
  { name: 'setup()', desc: '컴포넌트 초기화', type: 'setup' },
  { name: 'onBeforeMount', desc: 'DOM 생성 직전', type: 'mount' },
  { name: 'onMounted', desc: 'DOM 마운트 완료', type: 'mount' },
  { name: 'onBeforeUpdate', desc: '업데이트 직전', type: 'update' },
  { name: 'onUpdated', desc: '업데이트 완료', type: 'update' },
  { name: 'onBeforeUnmount', desc: '소멸 직전', type: 'unmount' },
  { name: 'onUnmounted', desc: '소멸 완료', type: 'unmount' },
]

const lifecycleUsageCode = `import {
  onMounted, onUnmounted, onUpdated,
  onBeforeMount, onBeforeUnmount,
  onActivated, onDeactivated  // KeepAlive용
} from 'vue'

// ✅ 가장 많이 쓰는 패턴
onMounted(() => {
  // API 데이터 로드
  fetchData()
  // DOM 조작 (DOM이 준비된 후!)
  chart = new Chart(canvasRef.value)
  // 이벤트 리스너 등록
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 반드시 정리!
  window.removeEventListener('resize', handleResize)
  chart.destroy()
  clearInterval(timer)
})

onUpdated(() => {
  // 데이터 변경 후 DOM 상태 확인이 필요할 때
  // 주의: 여기서 반응형 데이터 변경하면 무한 루프!
})`

const cleanupCode = `// 실전 패턴: 타이머 정리
const timer = ref(null)

onMounted(() => {
  timer.value = setInterval(() => {
    fetchLatestData()
  }, 5000)
})

onUnmounted(() => {
  clearInterval(timer.value) // 안 하면 컴포넌트 제거 후에도 계속 실행됨!
})

// 실전 패턴: WebSocket 정리
let ws = null

onMounted(() => {
  ws = new WebSocket('wss://api.example.com')
  ws.onmessage = handleMessage
})

onUnmounted(() => {
  ws?.close()
})`
</script>

<style scoped>
.lifecycle-flow {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.lc-step {
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid;
  transition: all .3s;
}
.lc-active { transform: scale(1.05); box-shadow: 0 4px 12px rgba(66,184,131,.3); }
.lc-setup   { border-color: #a78bfa; background: #faf5ff; }
.lc-mount   { border-color: #42b883; background: #f0fdf4; }
.lc-update  { border-color: #60a5fa; background: #eff6ff; }
.lc-unmount { border-color: #f87171; background: #fef2f2; }
.lc-name { font-size: 13px; font-weight: 700; font-family: monospace; }
.lc-desc { font-size: 12px; color: #64748b; margin-top: 2px; }
.log-container {
  background: #1e293b;
  border-radius: 8px;
  padding: 12px;
  max-height: 240px;
  overflow-y: auto;
}
.log-entry { display: flex; gap: 12px; padding: 4px 0; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,.05); }
.log-time { color: #475569; min-width: 70px; }
.log-hook { color: #42b883; font-family: monospace; min-width: 120px; }
.log-info span:last-child { color: #e2e8f0; }
.log-warn span:last-child { color: #fde68a; }
.child-box {
  background: #f0fdf4;
  border: 2px solid #42b883;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: #15803d;
  margin-top: 12px;
}
</style>
