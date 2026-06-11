import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// ===== 전역 커스텀 디렉티브 =====

// v-focus: 마운트 시 자동 포커스
app.directive('focus', {
  mounted(el) { el.focus() }
})

// v-tooltip: 마우스 오버 시 툴팁 표시
app.directive('tooltip', {
  mounted(el, binding) {
    const tooltip = document.createElement('div')
    tooltip.textContent = binding.value
    tooltip.style.cssText = `
      display:none; position:fixed; background:#1e293b; color:white;
      padding:6px 12px; border-radius:6px; font-size:12px; z-index:99999;
      pointer-events:none; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,.2);
    `
    document.body.appendChild(tooltip)
    el.addEventListener('mouseenter', (e) => {
      tooltip.style.display = 'block'
      tooltip.style.left = (e.clientX + 10) + 'px'
      tooltip.style.top  = (e.clientY - 36) + 'px'
    })
    el.addEventListener('mousemove', (e) => {
      tooltip.style.left = (e.clientX + 10) + 'px'
      tooltip.style.top  = (e.clientY - 36) + 'px'
    })
    el.addEventListener('mouseleave', () => { tooltip.style.display = 'none' })
    el._tooltip = tooltip
  },
  unmounted(el) { el._tooltip?.remove() }
})

// v-click-outside: 외부 클릭 감지
app.directive('click-outside', {
  mounted(el, binding) {
    el._clickOutsideHandler = (event) => {
      if (!el.contains(event.target)) binding.value(event)
    }
    setTimeout(() => document.addEventListener('click', el._clickOutsideHandler), 0)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutsideHandler)
  }
})

// v-lazy-img: IntersectionObserver 기반 지연 로딩
app.directive('lazy-img', {
  mounted(el, binding) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.src = binding.value
        observer.unobserve(el)
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    el._observer = observer
  },
  unmounted(el) { el._observer?.disconnect() }
})

app.mount('#app')
