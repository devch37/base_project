<template>
  <div class="app">
    <!-- 사이드바 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">⚡ Vue 3</div>
        <div class="logo-sub">완전 정복 튜토리얼</div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/" class="nav-home">🏠 홈</RouterLink>

        <!-- Basic 섹션 -->
        <div class="nav-section">
          <div class="nav-section-title">
            <span class="badge badge-basic">Basic</span>
          </div>
          <RouterLink to="/basic/template">📝 템플릿 문법</RouterLink>
          <RouterLink to="/basic/reactive">🔄 반응형 데이터</RouterLink>
          <RouterLink to="/basic/events">🖱️ 이벤트 처리</RouterLink>
          <RouterLink to="/basic/conditional">🔀 조건부/리스트 렌더링</RouterLink>
          <RouterLink to="/basic/form">📋 폼 바인딩 (v-model)</RouterLink>
          <RouterLink to="/basic/component">🧩 컴포넌트 기초</RouterLink>
        </div>

        <!-- Intermediate 섹션 -->
        <div class="nav-section">
          <div class="nav-section-title">
            <span class="badge badge-intermediate">Intermediate</span>
          </div>
          <RouterLink to="/intermediate/composition-api">⚙️ Composition API</RouterLink>
          <RouterLink to="/intermediate/props-emits">📡 Props & Emits</RouterLink>
          <RouterLink to="/intermediate/lifecycle">🔁 생명주기 훅</RouterLink>
          <RouterLink to="/intermediate/slots">🎰 Slots</RouterLink>
          <RouterLink to="/intermediate/composables">🪝 Composables</RouterLink>
          <RouterLink to="/intermediate/router">🗺️ Vue Router</RouterLink>
          <RouterLink to="/intermediate/pinia">🍍 Pinia 상태관리</RouterLink>
        </div>

        <!-- Advanced 섹션 -->
        <div class="nav-section">
          <div class="nav-section-title">
            <span class="badge badge-advanced">Advanced</span>
          </div>
          <RouterLink to="/advanced/directives">🎯 커스텀 디렉티브</RouterLink>
          <RouterLink to="/advanced/teleport">🚀 Teleport & KeepAlive</RouterLink>
          <RouterLink to="/advanced/async">⏳ Async & Suspense</RouterLink>
          <RouterLink to="/advanced/performance">⚡ 성능 최적화</RouterLink>
          <RouterLink to="/advanced/patterns">🏗️ 실무 패턴</RouterLink>
        </div>

        <!-- 실전 프로젝트 -->
        <div class="nav-section">
          <div class="nav-section-title">
            <span class="badge badge-project">Project</span>
          </div>
          <RouterLink to="/project">✅ 실전 Todo 앱</RouterLink>
        </div>
      </nav>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style>
/* ===== 전역 리셋 ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --primary: #42b883;
  --primary-dark: #33a06f;
  --secondary: #35495e;
  --basic: #4ade80;
  --basic-bg: #f0fdf4;
  --intermediate: #60a5fa;
  --intermediate-bg: #eff6ff;
  --advanced: #f87171;
  --advanced-bg: #fef2f2;
  --project: #a78bfa;
  --project-bg: #faf5ff;
  --bg: #f8fafc;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text: #1e293b;
  --text-muted: #64748b;
  --shadow: 0 1px 3px rgba(0,0,0,.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,.07);
  --radius: 8px;
  --sidebar-w: 240px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

/* ===== 레이아웃 ===== */
.app { display: flex; min-height: 100vh; }

.sidebar {
  width: var(--sidebar-w);
  background: var(--secondary);
  color: #cbd5e1;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px 16px 16px;
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.logo { font-size: 22px; font-weight: 700; color: var(--primary); }
.logo-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.sidebar-nav {
  padding: 12px 0;
  flex: 1;
}

.nav-home {
  display: block;
  padding: 8px 16px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 14px;
  border-radius: 0;
  transition: all .15s;
  margin: 0 8px;
  border-radius: var(--radius);
}
.nav-home:hover, .nav-home.router-link-active {
  background: rgba(66,184,131,.2);
  color: var(--primary);
}

.nav-section { margin: 8px 0; }
.nav-section-title {
  padding: 8px 16px 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-section a {
  display: block;
  padding: 7px 16px 7px 20px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 13px;
  margin: 1px 8px;
  border-radius: var(--radius);
  transition: all .15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-section a:hover { color: #e2e8f0; background: rgba(255,255,255,.07); }
.nav-section a.router-link-active {
  color: var(--primary);
  background: rgba(66,184,131,.15);
  font-weight: 500;
}

.main-content {
  margin-left: var(--sidebar-w);
  flex: 1;
  min-height: 100vh;
}

/* ===== 배지 ===== */
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: .5px;
}
.badge-basic        { background: var(--basic-bg);        color: #16a34a; }
.badge-intermediate { background: var(--intermediate-bg);  color: #2563eb; }
.badge-advanced     { background: var(--advanced-bg);      color: #dc2626; }
.badge-project      { background: var(--project-bg);       color: #7c3aed; }

/* ===== 튜토리얼 공통 레이아웃 ===== */
.tutorial-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 32px;
}
.tutorial-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border);
}
.tutorial-header h1 { font-size: 28px; font-weight: 700; color: var(--text); }
.tutorial-header p  { color: var(--text-muted); margin-top: 8px; font-size: 15px; line-height: 1.7; }
.level-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.level-basic        { background: var(--basic-bg);        color: #16a34a; }
.level-intermediate { background: var(--intermediate-bg); color: #2563eb; }
.level-advanced     { background: var(--advanced-bg);     color: #dc2626; }
.level-project      { background: var(--project-bg);      color: #7c3aed; }

/* ===== 섹션 카드 ===== */
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}
.section-card h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-card h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--text-muted);
}

/* ===== 코드 블록 ===== */
.code-block {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
  margin: 12px 0;
  white-space: pre;
}

/* ===== 데모 영역 ===== */
.demo-box {
  background: var(--bg);
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
}
.demo-box h4 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 12px;
  font-weight: 600;
}

/* ===== 버튼 ===== */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all .15s;
}
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-secondary { background: var(--border); color: var(--text); }
.btn-secondary:hover { background: #cbd5e1; }
.btn-danger { background: #fee2e2; color: #dc2626; }
.btn-danger:hover { background: #fecaca; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-group { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }

/* ===== 입력 폼 ===== */
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  outline: none;
  transition: border-color .15s;
}
.form-input:focus { border-color: var(--primary); }
.form-group { margin-bottom: 12px; }
.form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: var(--text-muted); }

/* ===== 결과 표시 ===== */
.result {
  background: var(--primary);
  color: white;
  padding: 6px 12px;
  border-radius: var(--radius);
  font-size: 14px;
  display: inline-block;
  margin: 4px 2px;
}
.result-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius);
  padding: 12px;
  font-size: 14px;
  margin: 8px 0;
  color: #15803d;
}

/* ===== 팁/노트 ===== */
.tip {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 12px 16px;
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 13px;
  margin: 12px 0;
  color: #92400e;
}
.info {
  background: #eff6ff;
  border-left: 4px solid var(--intermediate);
  padding: 12px 16px;
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 13px;
  margin: 12px 0;
  color: #1e40af;
}

/* ===== 비교 테이블 ===== */
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 12px 0;
}
.compare-col h4 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .5px;
  padding: 6px 12px;
  border-radius: var(--radius);
  margin-bottom: 8px;
  font-weight: 700;
}
.compare-col.bad  h4 { background: #fef2f2; color: #dc2626; }
.compare-col.good h4 { background: #f0fdf4; color: #16a34a; }

/* ===== 태그 ===== */
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: var(--border);
  color: var(--text-muted);
}

/* ===== 반응형 ===== */
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .main-content { margin-left: 0; }
  .compare-grid { grid-template-columns: 1fr; }
}
</style>
