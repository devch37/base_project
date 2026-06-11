<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-advanced">Advanced · 01</div>
      <h1>🎯 커스텀 디렉티브 (Custom Directives)</h1>
      <p>내장 디렉티브(v-if, v-model)처럼 직접 디렉티브를 만들 수 있습니다.<br>
         DOM을 직접 조작해야 하는 로직을 캡슐화할 때 사용합니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ v-focus — 자동 포커스</h2>
      <div class="demo-box">
        <h4>🎮 페이지 로드 시 자동 포커스</h4>
        <input v-focus class="form-input" placeholder="페이지 로드 시 자동으로 포커스됩니다" />
      </div>
      <div class="code-block">{{ focusCode }}</div>
    </div>

    <div class="section-card">
      <h2>2️⃣ v-tooltip — 툴팁</h2>
      <div class="demo-box">
        <h4>🎮 마우스 올리면 툴팁 표시</h4>
        <div class="btn-group">
          <button v-tooltip="'이 버튼을 클릭하면 저장됩니다'" class="btn btn-primary">💾 저장</button>
          <button v-tooltip="'삭제는 되돌릴 수 없습니다!'" class="btn btn-danger">🗑️ 삭제</button>
          <span v-tooltip="'도움말 텍스트입니다'" style="cursor:help;color:#42b883">❓ 도움말</span>
        </div>
      </div>
      <div class="code-block">{{ tooltipCode }}</div>
    </div>

    <div class="section-card">
      <h2>3️⃣ v-click-outside — 외부 클릭 감지</h2>
      <div class="demo-box">
        <h4>🎮 드롭다운 (외부 클릭 시 닫힘)</h4>
        <div style="position:relative;display:inline-block">
          <button class="btn btn-primary" @click="dropdownOpen = !dropdownOpen">
            메뉴 {{ dropdownOpen ? '▲' : '▼' }}
          </button>
          <div v-if="dropdownOpen" v-click-outside="() => dropdownOpen = false" class="dropdown-menu">
            <div class="dropdown-item" @click="dropdownOpen = false">📋 프로필</div>
            <div class="dropdown-item" @click="dropdownOpen = false">⚙️ 설정</div>
            <div class="dropdown-item" @click="dropdownOpen = false">🚪 로그아웃</div>
          </div>
        </div>
        <span style="font-size:13px;color:#64748b;margin-left:12px">드롭다운 외부를 클릭하면 닫힙니다</span>
      </div>
      <div class="code-block">{{ clickOutsideCode }}</div>
    </div>

    <div class="section-card">
      <h2>4️⃣ v-lazy-img — 지연 로딩 이미지</h2>
      <div class="demo-box">
        <h4>🎮 스크롤 시 이미지 로드 (IntersectionObserver)</h4>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div v-for="i in 6" :key="i" class="lazy-img-box">
            <img
              v-lazy-img="`https://picsum.photos/seed/${i * 10}/200/150`"
              src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
              alt="Lazy loaded"
              style="width:100%;height:100%;object-fit:cover;border-radius:8px"
            />
          </div>
        </div>
      </div>
      <div class="code-block">{{ lazyImgCode }}</div>
    </div>

    <div class="section-card">
      <h2>5️⃣ 디렉티브 훅 생명주기</h2>
      <div class="code-block">{{ hooksCode }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dropdownOpen = ref(false)

// 코드 예시
const focusCode = `// 방법 1: 컴포넌트 내에서 로컬 등록
<script setup>
const vFocus = {
  mounted(el) {
    el.focus()
  }
}
<\/script>

<template>
  <input v-focus />
</template>

// 방법 2: main.js에서 전역 등록
app.directive('focus', {
  mounted(el) { el.focus() }
})`

const tooltipCode = `// main.js 전역 등록
app.directive('tooltip', {
  mounted(el, binding) {
    // binding.value = 디렉티브에 전달된 값 ('툴팁 텍스트')
    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.textContent = binding.value
    document.body.appendChild(tooltip)

    el.addEventListener('mouseenter', (e) => {
      tooltip.style.display = 'block'
      tooltip.style.left = e.clientX + 'px'
      tooltip.style.top  = (e.clientY - 40) + 'px'
    })
    el.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none'
    })

    // 나중에 정리할 수 있도록 저장
    el._tooltip = tooltip
  },
  unmounted(el) {
    el._tooltip?.remove()
  }
})`

const clickOutsideCode = `// composables/directives.js
export const vClickOutside = {
  mounted(el, binding) {
    el._clickOutsideHandler = (event) => {
      // 클릭된 곳이 el 외부이면 핸들러 실행
      if (!el.contains(event.target)) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutsideHandler)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutsideHandler)
  }
}

// 사용
<div v-click-outside="closeDropdown">드롭다운</div>`

const lazyImgCode = `// v-lazy-img: IntersectionObserver로 뷰포트 진입 시 로드
app.directive('lazy-img', {
  mounted(el, binding) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.src = binding.value  // 실제 이미지 URL로 교체
        observer.unobserve(el)
      }
    }, { threshold: 0.1 })

    observer.observe(el)
  }
})

// 사용: src는 플레이스홀더, v-lazy-img에 실제 URL
<img
  v-lazy-img="'/images/photo.jpg'"
  src="/images/placeholder.jpg"
/>`

const hooksCode = `app.directive('my-directive', {
  // el: 바인딩된 DOM 요소
  // binding: { value, oldValue, arg, modifiers, instance }
  // vnode: 가상 DOM 노드

  created(el, binding, vnode) {
    // 요소 속성 적용 전
  },
  beforeMount(el, binding, vnode) {
    // DOM에 마운트 직전
  },
  mounted(el, binding, vnode) {
    // DOM에 마운트 완료 ← 대부분 여기서 초기화
    console.log(binding.value)  // 전달된 값
    console.log(binding.arg)    // v-dir:arg에서 arg
    console.log(binding.modifiers)  // v-dir.mod에서 { mod: true }
  },
  beforeUpdate(el, binding, vnode, prevVnode) {
    // 업데이트 직전
  },
  updated(el, binding, vnode, prevVnode) {
    // 업데이트 완료 ← 값 변경 감지
  },
  beforeUnmount(el) {},
  unmounted(el) {
    // 소멸 시 정리 ← 이벤트 리스너 제거 등
  }
})`
</script>

<style scoped>
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  min-width: 150px;
  z-index: 100;
  margin-top: 4px;
}
.dropdown-item {
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
}
.dropdown-item:hover { background: #f8fafc; }
.lazy-img-box {
  width: 130px; height: 100px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
}
</style>
