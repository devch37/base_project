<template>
  <div class="home">
    <div class="hero">
      <div class="hero-badge">Vue 3 완전 정복</div>
      <h1>실무에서 바로 쓰는<br><span class="highlight">Vue 3 튜토리얼</span></h1>
      <p>Basic부터 Advanced까지 — 각 개념을 직접 실행해보며 배웁니다.<br>모든 예제는 실무에서 그대로 사용할 수 있습니다.</p>
    </div>

    <!-- 학습 로드맵 -->
    <div class="roadmap">
      <h2>📍 학습 로드맵</h2>
      <div class="roadmap-grid">
        <div class="roadmap-card" @click="goTo('/basic/template')">
          <div class="roadmap-level level-basic">Step 1 · Basic</div>
          <h3>🌱 Vue 기초</h3>
          <p>Vue의 핵심 개념인 반응형 데이터, 템플릿 문법, 이벤트 처리를 배웁니다.</p>
          <ul>
            <li>템플릿 문법 ({{ }}, v-bind, v-on)</li>
            <li>ref, computed, watch</li>
            <li>v-if / v-for</li>
            <li>v-model (양방향 바인딩)</li>
            <li>컴포넌트 기초</li>
          </ul>
          <div class="roadmap-cta">시작하기 →</div>
        </div>

        <div class="roadmap-card" @click="goTo('/intermediate/composition-api')">
          <div class="roadmap-level level-intermediate">Step 2 · Intermediate</div>
          <h3>🌿 심화 개념</h3>
          <p>Composition API, Props/Emits, Router, Pinia 등 실무에 필수적인 기술을 배웁니다.</p>
          <ul>
            <li>Composition API (setup)</li>
            <li>Props & Emits</li>
            <li>생명주기 훅</li>
            <li>Slots & Composables</li>
            <li>Vue Router + Pinia</li>
          </ul>
          <div class="roadmap-cta">시작하기 →</div>
        </div>

        <div class="roadmap-card" @click="goTo('/advanced/directives')">
          <div class="roadmap-level level-advanced">Step 3 · Advanced</div>
          <h3>🌳 고급 기법</h3>
          <p>커스텀 디렉티브, Teleport, 성능 최적화 등 시니어 레벨의 기술을 배웁니다.</p>
          <ul>
            <li>커스텀 디렉티브</li>
            <li>Teleport & KeepAlive</li>
            <li>Async Components & Suspense</li>
            <li>성능 최적화 기법</li>
            <li>실무 아키텍처 패턴</li>
          </ul>
          <div class="roadmap-cta">시작하기 →</div>
        </div>

        <div class="roadmap-card project-card" @click="goTo('/project')">
          <div class="roadmap-level level-project">Step 4 · Project</div>
          <h3>🚀 실전 Todo 앱</h3>
          <p>지금까지 배운 모든 기술을 합쳐서 실전 수준의 Todo 앱을 만들어봅니다.</p>
          <ul>
            <li>Pinia 글로벌 상태관리</li>
            <li>로컬스토리지 영속성</li>
            <li>필터링 & 정렬</li>
            <li>컴포넌트 분리 패턴</li>
            <li>Composable 활용</li>
          </ul>
          <div class="roadmap-cta">바로 만들기 →</div>
        </div>
      </div>
    </div>

    <!-- Vue 2 vs Vue 3 비교 -->
    <div class="section-card">
      <h2>🆚 Vue 2 vs Vue 3 핵심 차이점</h2>
      <div class="compare-grid">
        <div class="compare-col bad">
          <h4>❌ Vue 2 (Options API)</h4>
          <div class="code-block">{{ vue2Code }}</div>
        </div>
        <div class="compare-col good">
          <h4>✅ Vue 3 (Composition API)</h4>
          <div class="code-block">{{ vue3Code }}</div>
        </div>
      </div>
      <div class="tip">
        💡 Vue 3도 Options API를 지원합니다. 하지만 이 튜토리얼은 <strong>Composition API</strong> 중심으로 가르칩니다.
        Composition API가 로직 재사용, TypeScript 지원, 가독성 모든 면에서 우수하기 때문입니다.
      </div>
    </div>

    <!-- 빠른 참조 -->
    <div class="section-card">
      <h2>⚡ Vue 3 핵심 요약 치트시트</h2>
      <div class="cheatsheet-grid">
        <div class="cheat-item" v-for="item in cheatsheet" :key="item.title">
          <div class="cheat-title">{{ item.title }}</div>
          <div class="code-block">{{ item.code }}</div>
          <div class="cheat-desc">{{ item.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goTo = (path) => router.push(path)

const vue2Code = `// Vue 2 - Options API
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    double() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  },
  mounted() {
    console.log('마운트됨')
  }
}`

const vue3Code = `// Vue 3 - Composition API
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)

function increment() { count.value++ }

onMounted(() => {
  console.log('마운트됨')
})`

const cheatsheet = [
  { title: 'ref (원시값 반응형)', code: `const count = ref(0)\ncount.value++        // .value 필수\n{{ count }}          // 템플릿에선 생략`, desc: '숫자, 문자열, 불린 등 원시값' },
  { title: 'reactive (객체 반응형)', code: `const state = reactive({ name: '', age: 0 })\nstate.name = 'Kim'   // .value 불필요\nstate.age++`, desc: '객체, 배열에 사용' },
  { title: 'computed (계산된 값)', code: `const double = computed(() => count.value * 2)\n// 의존하는 값이 변할 때만 재계산\n// getter only → 읽기 전용`, desc: '성능 최적화 + 가독성' },
  { title: 'watch (감시자)', code: `watch(count, (newVal, oldVal) => {\n  console.log(newVal, oldVal)\n})\n// 즉시 실행: { immediate: true }`, desc: '값 변화에 반응하여 부수 효과 실행' },
  { title: 'v-bind / v-on 단축', code: `:class="{ active: isActive }"   // v-bind\n@click="handleClick"           // v-on\n@keyup.enter="submit"          // 수식어`, desc: '`:` = v-bind, `@` = v-on' },
  { title: 'Lifecycle Hooks', code: `onMounted(() => { /* DOM 준비됨 */ })\nonUpdated(() => { /* 업데이트 후 */ })\nonUnmounted(() => { /* 정리 */ })`, desc: '컴포넌트 생명주기 시점에 코드 실행' },
]
</script>

<style scoped>
.home { max-width: 1000px; margin: 0 auto; padding: 40px 32px; }

.hero {
  text-align: center;
  padding: 60px 0 48px;
}
.hero-badge {
  display: inline-block;
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.hero h1 { font-size: 40px; font-weight: 800; line-height: 1.2; color: #1e293b; }
.highlight { color: #42b883; }
.hero p { color: #64748b; font-size: 17px; margin-top: 16px; line-height: 1.7; }

.roadmap { margin-bottom: 32px; }
.roadmap h2 { font-size: 22px; font-weight: 700; margin-bottom: 20px; }
.roadmap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.roadmap-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.roadmap-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  border-color: #42b883;
}
.project-card { grid-column: span 2; }

.roadmap-level {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  padding: 3px 10px;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 12px;
}

.roadmap-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.roadmap-card p { color: #64748b; font-size: 14px; margin-bottom: 12px; }
.roadmap-card ul { color: #64748b; font-size: 13px; padding-left: 16px; }
.roadmap-card ul li { margin-bottom: 4px; }
.roadmap-cta {
  margin-top: 16px;
  color: #42b883;
  font-weight: 600;
  font-size: 14px;
}

.cheatsheet-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.cheat-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}
.cheat-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #334155; }
.cheat-desc { font-size: 12px; color: #64748b; margin-top: 8px; }

.code-block { font-size: 11.5px; padding: 12px; }
</style>
