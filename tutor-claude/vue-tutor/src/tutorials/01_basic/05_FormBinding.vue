<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-basic">Basic · 05</div>
      <h1>📋 폼 바인딩 (v-model)</h1>
      <p><code>v-model</code>은 입력 요소와 데이터를 <strong>양방향으로 동기화</strong>합니다.<br>
         입력하면 데이터가 바뀌고, 데이터가 바뀌면 입력창이 바뀝니다.</p>
    </div>

    <!-- v-model 기초 -->
    <div class="section-card">
      <h2>1️⃣ v-model 기본 — 각 입력 타입별</h2>
      <div class="demo-box">
        <h4>🎮 모든 입력 타입 데모</h4>
        <div class="form-grid">
          <!-- text -->
          <div class="form-group">
            <label class="form-label">text</label>
            <input class="form-input" type="text" v-model="form.name" placeholder="이름" />
          </div>
          <!-- number (.number 수식어) -->
          <div class="form-group">
            <label class="form-label">number (.number)</label>
            <input class="form-input" type="number" v-model.number="form.age" />
          </div>
          <!-- email -->
          <div class="form-group">
            <label class="form-label">email</label>
            <input class="form-input" type="email" v-model="form.email" placeholder="이메일" />
          </div>
          <!-- password -->
          <div class="form-group">
            <label class="form-label">password</label>
            <input class="form-input" type="password" v-model="form.password" placeholder="비밀번호" />
          </div>
          <!-- textarea -->
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">textarea</label>
            <textarea class="form-input" v-model="form.bio" rows="3" placeholder="자기소개"></textarea>
          </div>
          <!-- select -->
          <div class="form-group">
            <label class="form-label">select</label>
            <select class="form-input" v-model="form.city">
              <option value="">도시 선택</option>
              <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
            </select>
          </div>
          <!-- checkbox (boolean) -->
          <div class="form-group">
            <label class="form-label">checkbox (boolean)</label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.agreed" />
              약관에 동의합니다
            </label>
          </div>
          <!-- checkbox (배열) -->
          <div class="form-group">
            <label class="form-label">checkbox (배열 — 다중 선택)</label>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <label class="checkbox-label" v-for="skill in skillOptions" :key="skill">
                <input type="checkbox" :value="skill" v-model="form.skills" />
                {{ skill }}
              </label>
            </div>
          </div>
          <!-- radio -->
          <div class="form-group">
            <label class="form-label">radio</label>
            <div style="display:flex;gap:16px">
              <label class="checkbox-label" v-for="level in levels" :key="level">
                <input type="radio" :value="level" v-model="form.level" />
                {{ level }}
              </label>
            </div>
          </div>
        </div>

        <!-- 실시간 미리보기 -->
        <div class="preview-box">
          <div class="preview-title">📊 실시간 데이터 미리보기</div>
          <div class="preview-grid">
            <div v-for="(value, key) in form" :key="key" class="preview-item">
              <span class="preview-key">{{ key }}</span>
              <span class="preview-value">{{ Array.isArray(value) ? value.join(', ') || '(없음)' : String(value) || '(없음)' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="code-block">{{ formCode }}</div>
    </div>

    <!-- v-model 수식어 -->
    <div class="section-card">
      <h2>2️⃣ v-model 수식어</h2>
      <div class="demo-box">
        <h4>🎮 수식어 비교</h4>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">.lazy — blur 시 업데이트</label>
            <input class="form-input" v-model.lazy="lazyVal" placeholder="입력 후 포커스 벗어나기" />
            <div class="preview-value" style="margin-top:4px">값: "{{ lazyVal }}"</div>
          </div>
          <div class="form-group">
            <label class="form-label">.number — 숫자로 변환</label>
            <input class="form-input" type="number" v-model.number="numVal" />
            <div class="preview-value" style="margin-top:4px">값: {{ numVal }} (타입: {{ typeof numVal }})</div>
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">.trim — 앞뒤 공백 제거</label>
            <input class="form-input" v-model.trim="trimVal" placeholder="  공백을 넣어보세요  " />
            <div class="preview-value" style="margin-top:4px">값: "{{ trimVal }}" (길이: {{ trimVal.length }})</div>
          </div>
        </div>
      </div>

      <div class="code-block">{{ modifierCode }}</div>
    </div>

    <!-- 실전 회원가입 폼 -->
    <div class="section-card">
      <h2>3️⃣ 실전 예시 — 회원가입 폼 + 유효성 검사</h2>
      <div class="demo-box">
        <h4>🎮 실시간 유효성 검사</h4>
        <form @submit.prevent="submitSignup">
          <div class="form-group">
            <label class="form-label">이메일 *</label>
            <input
              class="form-input"
              :class="{ 'input-error': emailError, 'input-success': signup.email && !emailError }"
              v-model.trim="signup.email"
              type="email"
              placeholder="email@example.com"
            />
            <div v-if="emailError" class="error-msg">{{ emailError }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">비밀번호 * (8자 이상)</label>
            <input
              class="form-input"
              :class="{ 'input-error': passwordError, 'input-success': signup.password && !passwordError }"
              v-model="signup.password"
              type="password"
              placeholder="8자 이상 입력"
            />
            <div class="password-strength" v-if="signup.password">
              <div :class="['strength-bar', 'strength-' + passwordStrength]"></div>
              <span>{{ passwordStrengthLabel }}</span>
            </div>
            <div v-if="passwordError" class="error-msg">{{ passwordError }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">비밀번호 확인 *</label>
            <input
              class="form-input"
              :class="{ 'input-error': confirmError, 'input-success': signup.confirm && !confirmError }"
              v-model="signup.confirm"
              type="password"
              placeholder="비밀번호 다시 입력"
            />
            <div v-if="confirmError" class="error-msg">{{ confirmError }}</div>
          </div>
          <label class="checkbox-label" style="margin-bottom:16px">
            <input type="checkbox" v-model="signup.agreed" />
            <a href="#" @click.prevent>이용약관</a>에 동의합니다 (필수)
          </label>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isFormValid"
            style="width:100%"
          >
            {{ isFormValid ? '회원가입' : '입력을 완료해주세요' }}
          </button>
        </form>
        <div v-if="signupSuccess" class="result-box" style="margin-top:12px">
          🎉 회원가입 성공! {{ signup.email }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

// 기본 폼 데이터
const form = reactive({
  name: '', age: 20, email: '', password: '',
  bio: '', city: '', agreed: false,
  skills: [], level: ''
})
const cities = ['서울', '부산', '인천', '대구', '광주']
const skillOptions = ['Vue', 'React', 'TypeScript', 'Node.js']
const levels = ['초급', '중급', '고급']

// v-model 수식어
const lazyVal = ref('')
const numVal = ref(0)
const trimVal = ref('')

// 회원가입 폼
const signup = reactive({ email: '', password: '', confirm: '', agreed: false })
const signupSuccess = ref(false)

const emailError = computed(() => {
  if (!signup.email) return ''
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signup.email) ? '올바른 이메일 형식이 아닙니다.' : ''
})
const passwordError = computed(() => {
  if (!signup.password) return ''
  return signup.password.length < 8 ? '비밀번호는 8자 이상이어야 합니다.' : ''
})
const confirmError = computed(() => {
  if (!signup.confirm) return ''
  return signup.confirm !== signup.password ? '비밀번호가 일치하지 않습니다.' : ''
})
const passwordStrength = computed(() => {
  const p = signup.password
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})
const passwordStrengthLabel = computed(() => {
  return ['', '약함', '보통', '강함', '매우 강함'][passwordStrength.value]
})
const isFormValid = computed(() =>
  signup.email && signup.password && signup.confirm &&
  signup.agreed && !emailError.value && !passwordError.value && !confirmError.value
)
const submitSignup = () => {
  if (isFormValid.value) signupSuccess.value = true
}

const formCode = `<!-- text -->
<input type="text" v-model="name" />

<!-- number - .number 수식어로 자동 숫자 변환 -->
<input type="number" v-model.number="age" />

<!-- checkbox - boolean -->
<input type="checkbox" v-model="agreed" />

<!-- checkbox - 배열 (다중 선택) -->
<input type="checkbox" value="Vue"   v-model="skills" />
<input type="checkbox" value="React" v-model="skills" />
<!-- skills: ['Vue', 'React'] -->

<!-- radio -->
<input type="radio" value="초급" v-model="level" />
<input type="radio" value="고급" v-model="level" />

<!-- select -->
<select v-model="city">
  <option value="서울">서울</option>
  <option value="부산">부산</option>
</select>

<!-- textarea -->
<textarea v-model="bio"></textarea>`

const modifierCode = `<!-- .lazy: input 이벤트 대신 change 이벤트에서 동기화 (blur 시) -->
<input v-model.lazy="value" />

<!-- .number: 문자열을 숫자로 자동 변환 -->
<input type="number" v-model.number="age" />
// typeof age === 'number' (v-model만 쓰면 string!)

<!-- .trim: 앞뒤 공백 자동 제거 -->
<input v-model.trim="username" />`
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.checkbox-label input { width: 16px; height: 16px; cursor: pointer; }
.preview-box {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}
.preview-title { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.preview-item { display: flex; flex-direction: column; gap: 2px; }
.preview-key { color: #60a5fa; font-size: 12px; }
.preview-value { color: #e2e8f0; font-size: 13px; font-family: monospace; }
.input-error   { border-color: #ef4444 !important; }
.input-success { border-color: #42b883 !important; }
.error-msg { color: #ef4444; font-size: 12px; margin-top: 4px; }
.password-strength { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.strength-bar {
  height: 4px;
  border-radius: 2px;
  flex: 1;
  background: #e2e8f0;
  transition: all .3s;
}
.strength-1 { background: #ef4444; width: 25%; }
.strength-2 { background: #f59e0b; width: 50%; }
.strength-3 { background: #42b883; width: 75%; }
.strength-4 { background: #059669; width: 100%; }
.password-strength span { font-size: 12px; color: #64748b; min-width: 60px; }
</style>
