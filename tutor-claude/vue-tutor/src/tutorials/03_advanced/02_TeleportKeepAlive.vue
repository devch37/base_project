<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-advanced">Advanced · 02</div>
      <h1>🚀 Teleport & KeepAlive</h1>
      <p><strong>Teleport</strong>: 컴포넌트를 DOM의 다른 위치에 렌더링합니다.<br>
         <strong>KeepAlive</strong>: 컴포넌트 상태를 캐싱하여 재마운트를 방지합니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ Teleport — 모달/토스트 패턴</h2>
      <div class="demo-box">
        <h4>🎮 모달 (body 직접 하위에 렌더링)</h4>
        <div class="btn-group">
          <button class="btn btn-primary" @click="showModal = true">모달 열기</button>
          <button class="btn btn-secondary" @click="showToast">토스트 알림 띄우기</button>
        </div>
        <div style="margin-top:8px;padding:8px 12px;background:#f8fafc;border-radius:6px;font-size:13px;color:#64748b">
          이 박스는 z-index: 1이고, 내부 요소는 overflow: hidden 처리됩니다.<br>
          Teleport 없으면 모달이 잘릴 수 있습니다!
        </div>
      </div>

      <!-- Teleport: body 에 렌더링 (현재 DOM 트리 위치와 무관) -->
      <Teleport to="body">
        <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3>Teleport 모달</h3>
              <button @click="showModal = false" style="background:none;border:none;font-size:20px;cursor:pointer">×</button>
            </div>
            <div class="modal-body">
              <p>이 모달은 <code>&lt;Teleport to="body"&gt;</code>로 body 바로 아래에 렌더링됩니다.</p>
              <p>컴포넌트 트리상 위치와 DOM상 위치가 다릅니다!</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showModal = false">닫기</button>
              <button class="btn btn-primary" @click="showModal = false">확인</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Toast는 fixed 위치에 표시 -->
      <Teleport to="body">
        <div class="toast-container">
          <TransitionGroup name="toast">
            <div v-for="toast in toasts" :key="toast.id" :class="['toast', 'toast-' + toast.type]">
              {{ toast.message }}
            </div>
          </TransitionGroup>
        </div>
      </Teleport>

      <div class="code-block">{{ teleportCode }}</div>
    </div>

    <div class="section-card">
      <h2>2️⃣ KeepAlive — 상태 캐싱</h2>
      <div class="demo-box">
        <h4>🎮 탭 전환 — 상태 보존 여부 비교</h4>
        <div class="tab-bar">
          <button
            v-for="tab in tabs" :key="tab"
            :class="['tab-btn', activeTab === tab && 'tab-active']"
            @click="activeTab = tab"
          >{{ tab }}</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-size:12px;font-weight:600;color:#dc2626;margin-bottom:8px">❌ KeepAlive 없음 (상태 초기화)</div>
            <component :is="currentTabComponent" />
          </div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#15803d;margin-bottom:8px">✅ KeepAlive 있음 (상태 유지)</div>
            <KeepAlive>
              <component :is="currentTabComponent" />
            </KeepAlive>
          </div>
        </div>
        <div style="margin-top:8px;font-size:13px;color:#64748b">
          탭 전환 후 돌아와서 입력값이 유지되는지 확인하세요!
        </div>
      </div>
      <div class="code-block">{{ keepAliveCode }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, computed } from 'vue'

// Teleport
const showModal = ref(false)
const toasts = ref([])
let toastId = 0

const showToast = () => {
  const id = toastId++
  toasts.value.push({ id, message: `✅ 작업이 완료되었습니다! (${id})`, type: 'success' })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

// KeepAlive 탭 컴포넌트
const TabA = defineComponent({
  setup() {
    const text = ref('')
    const count = ref(0)
    return { text, count }
  },
  template: `
    <div style="padding:12px;background:#f8fafc;border-radius:8px">
      <div style="font-weight:600;margin-bottom:8px">탭 A</div>
      <input class="form-input" v-model="text" placeholder="입력 후 탭 전환" style="margin-bottom:8px" />
      <button class="btn btn-sm btn-primary" @click="count++">클릭: {{ count }}</button>
    </div>
  `
})

const TabB = defineComponent({
  template: `
    <div style="padding:12px;background:#f8fafc;border-radius:8px">
      <div style="font-weight:600">탭 B — 내용</div>
    </div>
  `
})

const tabs = ['탭 A', '탭 B']
const activeTab = ref('탭 A')
const currentTabComponent = computed(() => activeTab.value === '탭 A' ? TabA : TabB)

// 코드 예시
const teleportCode = `<!-- Teleport: to 속성으로 렌더링 위치 지정 -->
<Teleport to="body">
  <div v-if="showModal" class="modal">
    모달 내용
  </div>
</Teleport>

<!-- to 옵션 -->
<Teleport to="body">        <!-- body 하위 -->
<Teleport to="#modals">     <!-- id=modals인 요소 하위 -->
<Teleport to=".portal">     <!-- class=portal인 요소 하위 -->

<!-- disabled: 조건부로 teleport 비활성화 -->
<Teleport to="body" :disabled="isMobile">
  <Modal />
</Teleport>

<!-- 여러 Teleport가 같은 target을 쓰면 DOM 순서대로 추가됨 -->

왜 Teleport가 필요한가?
- 부모 컴포넌트의 overflow:hidden, z-index가 모달에 영향
- 스타일 격리 문제
- 접근성 (모달은 body 직접 자식이어야 하는 경우)`

const keepAliveCode = `<!-- 기본 사용 -->
<KeepAlive>
  <component :is="currentTab" />
</KeepAlive>

<!-- include: 특정 컴포넌트만 캐싱 (name 기준) -->
<KeepAlive include="TabA,TabB">
  <component :is="currentTab" />
</KeepAlive>

<!-- exclude: 특정 컴포넌트 캐싱 제외 -->
<KeepAlive :exclude="['TabC']">

<!-- max: 최대 캐시 개수 (LRU 방식) -->
<KeepAlive :max="10">

// KeepAlive와 함께 쓰는 생명주기 훅
import { onActivated, onDeactivated } from 'vue'

// KeepAlive 캐시에서 활성화될 때 (탭으로 돌아올 때)
onActivated(() => {
  refreshData()
})

// KeepAlive 캐시로 비활성화될 때 (다른 탭으로 이동할 때)
onDeactivated(() => {
  pauseVideo()
})`
</script>

<style>
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.modal-dialog {
  background: white;
  border-radius: 12px;
  width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
  overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 { font-size: 18px; }
.modal-body   { padding: 20px; }
.modal-body p { color: #64748b; margin-bottom: 8px; font-size: 14px; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.toast-container {
  position: fixed; top: 20px; right: 20px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 10000;
}
.toast {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
  min-width: 200px;
}
.toast-success { background: #42b883; color: white; }
.toast-error   { background: #ef4444; color: white; }
.toast-enter-active, .toast-leave-active { transition: all .3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to   { opacity: 0; transform: translateX(40px); }
</style>

<style scoped>
.tab-bar { display: flex; gap: 4px; border-bottom: 2px solid #e2e8f0; margin-bottom: 0; }
.tab-btn {
  padding: 8px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tab-active { color: #42b883; border-bottom-color: #42b883; font-weight: 600; }
</style>
