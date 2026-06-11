<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-basic">Basic · 01</div>
      <h1>📝 템플릿 문법 (Template Syntax)</h1>
      <p>Vue의 HTML 기반 템플릿에서 JavaScript 표현식을 사용하는 방법입니다.<br>
         선언적(Declarative) 렌더링 — "데이터가 변하면 화면이 자동으로 바뀐다."</p>
    </div>

    <!-- 1. 텍스트 보간 -->
    <div class="section-card">
      <h2>1️⃣ 텍스트 보간 (Interpolation)</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        <code>{{ }}</code> (이중 중괄호, Mustache 문법)으로 데이터를 표시합니다.
      </p>

      <div class="demo-box">
        <h4>🎮 데모</h4>
        <!-- {{ }}  안에는 단순 표현식만 가능 (문장 X) -->
        <p>이름: <strong>{{ name }}</strong></p>
        <p>나이: <strong>{{ age }}</strong></p>
        <p>내년 나이: <strong>{{ age + 1 }}</strong></p>
        <p>성인 여부: <strong>{{ age >= 18 ? '성인' : '미성년자' }}</strong></p>
        <p>이름 길이: <strong>{{ name.length }}글자</strong></p>

        <div class="btn-group" style="margin-top:12px">
          <button class="btn btn-primary" @click="name = 'Vue 개발자'">이름 변경</button>
          <button class="btn btn-secondary" @click="age++">나이 +1</button>
        </div>
      </div>

      <div class="code-block">{{ templateCode }}</div>
    </div>

    <!-- 2. v-bind -->
    <div class="section-card">
      <h2>2️⃣ v-bind — 속성 바인딩</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        HTML 속성에 동적 값을 바인딩할 때 사용. <code>v-bind:href</code> = <code>:href</code> (단축형)
      </p>

      <div class="demo-box">
        <h4>🎮 데모</h4>

        <div class="form-group">
          <label class="form-label">링크 URL</label>
          <input class="form-input" v-model="linkUrl" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">버튼 비활성화?</label>
          <input type="checkbox" v-model="isDisabled" /> {{ isDisabled ? '비활성' : '활성' }}
        </div>

        <!-- :href = v-bind:href 의 단축형 -->
        <a :href="linkUrl" target="_blank" class="btn btn-primary">
          링크 열기 ({{ linkUrl }})
        </a>

        <!-- :disabled = 조건에 따라 disabled 속성 토글 -->
        <button class="btn btn-secondary" :disabled="isDisabled" style="margin-left:8px">
          {{ isDisabled ? '비활성 버튼' : '활성 버튼' }}
        </button>

        <!-- :class = 동적 클래스 바인딩 -->
        <div style="margin-top:16px">
          <input type="checkbox" v-model="isHighlighted" /> 강조 적용
          <div :class="{ highlighted: isHighlighted, 'base-box': true }" style="margin-top:8px">
            동적 클래스 적용 박스
          </div>
        </div>

        <!-- :style = 동적 스타일 바인딩 -->
        <div style="margin-top:12px">
          <label class="form-label">배경색</label>
          <input type="color" v-model="bgColor" />
          <div :style="{ backgroundColor: bgColor, padding: '12px', borderRadius: '8px', marginTop: '8px', color: 'white' }">
            동적 스타일 적용 박스 ({{ bgColor }})
          </div>
        </div>
      </div>

      <div class="code-block">{{ bindCode }}</div>
      <div class="tip">💡 <strong>:attr</strong>은 <strong>v-bind:attr</strong>의 단축형입니다. 실무에서는 항상 단축형을 씁니다.</div>
    </div>

    <!-- 3. v-html -->
    <div class="section-card">
      <h2>3️⃣ v-html — HTML 렌더링</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        HTML 문자열을 실제 DOM으로 렌더링합니다. <strong>XSS 위험</strong>이 있으므로 신뢰할 수 있는 데이터에만 사용하세요.
      </p>

      <div class="demo-box">
        <h4>🎮 데모</h4>
        <input class="form-input" v-model="htmlContent" style="margin-bottom:12px" />
        <div class="compare-grid">
          <div>
            <strong>{{ '{{ htmlContent }}' }}</strong> (텍스트로 출력):<br>
            <div style="padding:8px;background:#f1f5f9;border-radius:4px;margin-top:4px">{{ htmlContent }}</div>
          </div>
          <div>
            <strong>v-html</strong> (HTML로 렌더링):<br>
            <div v-html="htmlContent" style="padding:8px;background:#f1f5f9;border-radius:4px;margin-top:4px"></div>
          </div>
        </div>
      </div>

      <div class="tip">⚠️ <strong>v-html에 사용자 입력을 직접 넣으면 XSS 공격</strong>에 취약합니다. 신뢰된 데이터만 사용하세요.</div>
    </div>

    <!-- 4. 단방향 바인딩 정리 -->
    <div class="section-card">
      <h2>4️⃣ 단방향 데이터 흐름 정리</h2>
      <div class="flow-diagram">
        <div class="flow-box js-box">JavaScript<br><small>data</small></div>
        <div class="flow-arrow">→ 자동 반영 →</div>
        <div class="flow-box html-box">HTML<br><small>template</small></div>
      </div>
      <div class="info">
        🔑 Vue의 핵심: <strong>데이터를 바꾸면 화면이 자동으로 바뀝니다.</strong><br>
        DOM을 직접 조작하는 대신(document.getElementById) 데이터만 변경하면 됩니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 반응형 데이터 — 변경되면 화면이 자동으로 업데이트됨
const name = ref('김철수')
const age = ref(25)
const linkUrl = ref('https://vuejs.org')
const isDisabled = ref(false)
const isHighlighted = ref(false)
const bgColor = ref('#42b883')
const htmlContent = ref('<strong style="color:#42b883">Vue는</strong> <em>최고</em>!')

// 코드 예시 문자열
const templateCode = `<template>
  <!-- {{ }} 안에는 JavaScript 표현식 사용 가능 -->
  <p>{{ name }}</p>                          <!-- 단순 변수 -->
  <p>{{ age + 1 }}</p>                       <!-- 표현식 -->
  <p>{{ age >= 18 ? '성인' : '미성년자' }}</p> <!-- 삼항 연산자 -->
  <p>{{ name.toUpperCase() }}</p>            <!-- 메서드 호출 -->
</template>

<script setup>
import { ref } from 'vue'
const name = ref('김철수')  // ref로 반응형 데이터 선언
const age  = ref(25)
<\/script>`

const bindCode = `<template>
  <!-- :attr = v-bind:attr 단축형 -->
  <a :href="linkUrl">링크</a>

  <!-- :disabled = boolean 조건 -->
  <button :disabled="isDisabled">버튼</button>

  <!-- :class = 객체 문법 (조건부 클래스) -->
  <div :class="{ active: isActive, 'text-red': hasError }">

  <!-- :class = 배열 문법 -->
  <div :class="[baseClass, isActive ? 'active' : '']">

  <!-- :style = 객체 문법 -->
  <div :style="{ color: textColor, fontSize: size + 'px' }">
</template>`
</script>

<style scoped>
.flow-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 12px;
}
.flow-box {
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}
.flow-box small { display: block; font-weight: 400; font-size: 12px; margin-top: 2px; }
.js-box { background: #fef9c3; border: 2px solid #fde047; color: #713f12; }
.html-box { background: #dbeafe; border: 2px solid #93c5fd; color: #1e3a8a; }
.flow-arrow { font-size: 16px; color: #42b883; font-weight: 700; }
.highlighted { background: #42b883 !important; color: white !important; }
.base-box { padding: 12px; border-radius: 8px; background: #f1f5f9; transition: all .3s; }
</style>
