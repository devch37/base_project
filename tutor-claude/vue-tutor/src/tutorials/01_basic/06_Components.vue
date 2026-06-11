<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-basic">Basic · 06</div>
      <h1>🧩 컴포넌트 기초 (Components)</h1>
      <p>컴포넌트는 Vue 앱의 빌딩 블록입니다.<br>
         재사용 가능한 독립적인 UI 조각을 만들어 조합합니다.</p>
    </div>

    <!-- 컴포넌트란? -->
    <div class="section-card">
      <h2>1️⃣ 컴포넌트란?</h2>
      <div class="component-diagram">
        <div class="diagram-box app-box">
          App.vue
          <div class="diagram-children">
            <div class="diagram-box navbar-box">Navbar.vue</div>
            <div style="display:flex;gap:8px">
              <div class="diagram-box sidebar-box">Sidebar.vue</div>
              <div class="diagram-box">
                Main.vue
                <div class="diagram-children">
                  <div class="diagram-box card-box">Card.vue ×3</div>
                  <div class="diagram-box btn-box">Button.vue ×5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="info">
        🔑 컴포넌트 = <strong>재사용 가능한 HTML + CSS + JavaScript 묶음</strong><br>
        한 번 만들면 여러 곳에서 사용 가능. 유지보수가 한 곳에서 이루어집니다.
      </div>
    </div>

    <!-- 인라인 컴포넌트 데모 -->
    <div class="section-card">
      <h2>2️⃣ 컴포넌트 직접 만들어보기</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        아래 컴포넌트들은 이 파일 안에 직접 정의된 컴포넌트입니다.
      </p>

      <h3>AlertBox 컴포넌트</h3>
      <AlertBox type="success" message="컴포넌트가 성공적으로 렌더링되었습니다!" />
      <AlertBox type="warning" message="이것은 경고 메시지입니다." />
      <AlertBox type="error" message="오류가 발생했습니다." />
      <AlertBox type="info" message="참고: 이 컴포넌트는 type과 message props를 받습니다." />

      <div class="code-block" style="margin-top:16px">{{ alertCode }}</div>

      <h3>CounterCard 컴포넌트 (독립적 상태)</h3>
      <p style="color:#64748b;font-size:13px;margin-bottom:12px">
        각 카운터는 독립적인 상태를 가집니다. 서로 영향을 주지 않습니다!
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <CounterCard title="좋아요" emoji="👍" />
        <CounterCard title="댓글" emoji="💬" />
        <CounterCard title="공유" emoji="🔗" />
      </div>

      <div class="code-block" style="margin-top:16px">{{ counterCode }}</div>
    </div>

    <!-- Props 기초 -->
    <div class="section-card">
      <h2>3️⃣ Props — 부모 → 자식 데이터 전달</h2>
      <div class="demo-box">
        <h4>🎮 Props 데모</h4>
        <div class="form-group">
          <label class="form-label">카드 제목</label>
          <input class="form-input" v-model="cardTitle" />
        </div>
        <div class="form-group">
          <label class="form-label">카드 색상</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button
              v-for="color in colors" :key="color"
              class="btn btn-sm"
              :style="{ background: color, color: 'white' }"
              @click="cardColor = color"
            >{{ color }}</button>
          </div>
        </div>
        <!-- 부모가 props를 통해 자식 컴포넌트에 데이터 전달 -->
        <ProfileCard :title="cardTitle" :color="cardColor" :count="cardCount" />
        <div class="btn-group" style="margin-top:8px">
          <button class="btn btn-primary" @click="cardCount++">count 증가 (부모에서)</button>
        </div>
      </div>
      <div class="code-block">{{ propsCode }}</div>
    </div>

    <!-- Emit 기초 -->
    <div class="section-card">
      <h2>4️⃣ Emits — 자식 → 부모 이벤트 전달</h2>
      <div class="demo-box">
        <h4>🎮 Emit 데모</h4>
        <p style="font-size:13px;color:#64748b;margin-bottom:12px">
          자식 컴포넌트(LikeButton)가 클릭되면 부모에게 이벤트를 보냅니다.
        </p>
        <LikeButton :liked="isLiked" @toggle="handleToggle" />
        <div class="result-box" style="margin-top:8px">
          부모에서 받은 상태: {{ isLiked ? '❤️ 좋아요' : '🤍 좋아요 취소됨' }} (총 {{ likeCount }}회 토글)
        </div>
      </div>
      <div class="code-block">{{ emitCode }}</div>
      <div class="info">
        🔑 Vue의 단방향 데이터 흐름:<br>
        <strong>부모 → 자식: Props</strong> (데이터를 내려보냄)<br>
        <strong>자식 → 부모: Emit</strong> (이벤트를 올려보냄)
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, h } from 'vue'

// ===== 인라인 컴포넌트 정의 =====

// AlertBox 컴포넌트
const AlertBox = defineComponent({
  props: {
    type: { type: String, default: 'info' },
    message: { type: String, required: true }
  },
  template: `
    <div :class="['alert-box', 'alert-' + type]">
      <span>{{ { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' }[type] }}</span>
      {{ message }}
    </div>
  `
})

// CounterCard 컴포넌트
const CounterCard = defineComponent({
  props: {
    title: String,
    emoji: String
  },
  setup(props) {
    const count = ref(0)
    return { count }
  },
  template: `
    <div class="counter-card">
      <div class="counter-emoji">{{ emoji }}</div>
      <div class="counter-num">{{ count }}</div>
      <div class="counter-title">{{ title }}</div>
      <button class="btn btn-sm btn-primary" @click="count++" style="margin-top:8px">+1</button>
    </div>
  `
})

// ProfileCard 컴포넌트 (props 받음)
const ProfileCard = defineComponent({
  props: {
    title: { type: String, default: '카드 제목' },
    color: { type: String, default: '#42b883' },
    count: { type: Number, default: 0 }
  },
  template: `
    <div :style="{ border: '2px solid ' + color, borderRadius: '12px', padding: '20px', marginTop: '12px' }">
      <div :style="{ color: color, fontWeight: '700', fontSize: '18px' }">{{ title }}</div>
      <div style="color:#64748b;margin-top:4px">count: <strong>{{ count }}</strong></div>
    </div>
  `
})

// LikeButton 컴포넌트 (emit)
const LikeButton = defineComponent({
  props: { liked: Boolean },
  emits: ['toggle'],
  template: `
    <button
      :class="['btn', liked ? 'btn-primary' : 'btn-secondary']"
      @click="$emit('toggle')"
    >
      {{ liked ? '❤️ 좋아요 취소' : '🤍 좋아요' }}
    </button>
  `
})

// 부모 상태
const cardTitle = ref('나의 프로필 카드')
const cardColor = ref('#42b883')
const cardCount = ref(0)
const colors = ['#42b883', '#60a5fa', '#f87171', '#a78bfa', '#fb923c']

const isLiked = ref(false)
const likeCount = ref(0)
const handleToggle = () => {
  isLiked.value = !isLiked.value
  likeCount.value++
}

// 코드 예시
const alertCode = `<!-- AlertBox.vue -->
<template>
  <div :class="['alert', 'alert-' + type]">
    {{ message }}
  </div>
</template>

<script setup>
// props 정의 — 부모로부터 받을 데이터
const props = defineProps({
  type: { type: String, default: 'info' },  // 기본값 설정
  message: { type: String, required: true }  // 필수 props
})
<\/script>

<!-- 부모에서 사용 -->
<AlertBox type="success" message="성공!" />
<AlertBox type="error" :message="errorText" /> <!-- 동적 props는 :사용 -->`

const counterCode = `<!-- CounterCard.vue -->
<template>
  <div class="card">
    <p>{{ count }}</p>
    <button @click="count++">+1</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// 각 컴포넌트 인스턴스는 독립적인 상태를 가짐!
const count = ref(0)
<\/script>

<!-- 3개를 써도 각각 독립적 -->
<CounterCard /> <!-- count: 0 -->
<CounterCard /> <!-- count: 0 (독립!) -->
<CounterCard /> <!-- count: 0 (독립!) -->`

const propsCode = `<!-- ProfileCard.vue -->
<script setup>
const props = defineProps({
  title: String,
  color: { type: String, default: '#42b883' },
  count: { type: Number, required: true }
})
<\/script>

<!-- 부모 App.vue -->
<script setup>
const cardTitle = ref('내 카드')
const cardCount = ref(0)
<\/script>

<template>
  <!-- 정적 props: 문자열 직접 전달 -->
  <ProfileCard title="고정 제목" />

  <!-- 동적 props: ref/변수 전달 -->
  <ProfileCard :title="cardTitle" :count="cardCount" />
</template>`

const emitCode = `<!-- LikeButton.vue (자식) -->
<script setup>
defineProps({ liked: Boolean })
const emit = defineEmits(['toggle'])  // 보낼 이벤트 선언
<\/script>

<template>
  <!-- 클릭 시 부모에게 'toggle' 이벤트 발송 -->
  <button @click="emit('toggle')">
    {{ liked ? '❤️' : '🤍' }}
  </button>
</template>

<!-- 부모 컴포넌트 -->
<template>
  <!-- @toggle = 자식이 emit('toggle')할 때 handleToggle 실행 -->
  <LikeButton :liked="isLiked" @toggle="handleToggle" />
</template>

<script setup>
const isLiked = ref(false)
const handleToggle = () => { isLiked.value = !isLiked.value }
<\/script>`
</script>

<style>
/* 컴포넌트용 전역 스타일 */
.alert-box {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.alert-warning  { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
.alert-error    { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
.alert-info     { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }

.counter-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  min-width: 120px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.counter-emoji { font-size: 32px; margin-bottom: 8px; }
.counter-num { font-size: 32px; font-weight: 800; color: #42b883; }
.counter-title { font-size: 13px; color: #64748b; }
</style>

<style scoped>
.component-diagram {
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.diagram-box {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}
.diagram-children {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.app-box { border-color: #42b883; background: #f0fdf4; }
.navbar-box { border-color: #60a5fa; background: #eff6ff; }
.sidebar-box { border-color: #a78bfa; background: #faf5ff; }
.card-box { border-color: #fb923c; background: #fff7ed; font-size: 12px; }
.btn-box  { border-color: #f87171; background: #fef2f2; font-size: 12px; }
</style>
