<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-intermediate">Intermediate · 02</div>
      <h1>📡 Props & Emits</h1>
      <p>컴포넌트 간 통신의 기본 — <strong>Props(부모→자식)</strong>와 <strong>Emits(자식→부모)</strong><br>
         실무에서 가장 많이 쓰는 패턴을 모두 다룹니다.</p>
    </div>

    <!-- Props 상세 -->
    <div class="section-card">
      <h2>1️⃣ defineProps — 상세 타입 정의</h2>
      <div class="code-block">{{ propsCode }}</div>

      <div class="demo-box">
        <h4>🎮 실시간 Props 변경 데모</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div class="form-group">
              <label class="form-label">상품명</label>
              <input class="form-input" v-model="productName" />
            </div>
            <div class="form-group">
              <label class="form-label">가격</label>
              <input class="form-input" type="number" v-model.number="productPrice" />
            </div>
            <div class="form-group">
              <label class="form-label">재고 있음</label>
              <input type="checkbox" v-model="inStock" />
            </div>
            <div class="form-group">
              <label class="form-label">배지</label>
              <select class="form-input" v-model="badge">
                <option value="">없음</option>
                <option value="NEW">NEW</option>
                <option value="HOT">HOT</option>
                <option value="SALE">SALE</option>
              </select>
            </div>
          </div>
          <!-- ProductCard에 props 전달 -->
          <ProductCard
            :name="productName"
            :price="productPrice"
            :in-stock="inStock"
            :badge="badge"
            @add-to-cart="handleAddToCart"
          />
        </div>
        <div v-if="cartItems.length" class="result-box" style="margin-top:12px">
          🛒 장바구니: {{ cartItems.join(', ') }}
        </div>
      </div>
    </div>

    <!-- Emits 상세 -->
    <div class="section-card">
      <h2>2️⃣ defineEmits — 이벤트 선언과 데이터 전달</h2>
      <div class="code-block">{{ emitsCode }}</div>

      <div class="demo-box">
        <h4>🎮 다양한 Emit 패턴</h4>
        <ModalTrigger
          @open="modalOpen = true"
          @close="modalOpen = false"
          @confirm="handleConfirm"
          @cancel="handleCancel"
        />
        <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
          <div class="modal-box">
            <h3>확인 모달</h3>
            <p>이 작업을 진행하시겠습니까?</p>
            <div class="btn-group" style="justify-content:flex-end">
              <button class="btn btn-secondary" @click="handleCancel">취소</button>
              <button class="btn btn-primary" @click="handleConfirm">확인</button>
            </div>
          </div>
        </div>
        <div v-if="lastAction" class="result-box" style="margin-top:8px">
          마지막 액션: {{ lastAction }}
        </div>
      </div>
    </div>

    <!-- v-model on component -->
    <div class="section-card">
      <h2>3️⃣ 컴포넌트의 v-model</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        컴포넌트에도 <code>v-model</code>을 사용할 수 있습니다.
        내부적으로 <code>:modelValue</code> + <code>@update:modelValue</code>로 동작합니다.
      </p>
      <div class="demo-box">
        <h4>🎮 커스텀 v-model</h4>
        <p style="font-size:13px;color:#64748b;margin-bottom:12px">부모의 값: <strong>"{{ searchText }}"</strong></p>
        <!-- 컴포넌트에 v-model 사용 -->
        <SearchInput v-model="searchText" placeholder="검색어 입력..." />
        <button class="btn btn-secondary btn-sm" @click="searchText = ''" style="margin-top:8px">초기화</button>
      </div>
      <div class="code-block">{{ vmodelCode }}</div>
    </div>

    <!-- Props 안티패턴 -->
    <div class="section-card">
      <h2>4️⃣ Props 절대 하면 안 되는 것</h2>
      <div class="code-block">{{ antiPatternCode }}</div>
      <div class="tip">
        ⚠️ <strong>Props는 읽기 전용!</strong> 자식에서 직접 수정하면 안 됩니다.<br>
        수정이 필요하면: emit으로 부모에게 알리거나, 로컬 복사본(ref)을 만들어 사용하세요.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, computed } from 'vue'

// ProductCard 컴포넌트
const ProductCard = defineComponent({
  props: {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    badge: { type: String, default: '' }
  },
  emits: ['add-to-cart'],
  template: `
    <div class="product-card">
      <div class="product-badge" v-if="badge">{{ badge }}</div>
      <div class="product-name">{{ name }}</div>
      <div class="product-price">{{ price.toLocaleString() }}원</div>
      <div :class="['product-stock', inStock ? 'in-stock' : 'out-stock']">
        {{ inStock ? '✅ 재고 있음' : '❌ 품절' }}
      </div>
      <button class="btn btn-primary" :disabled="!inStock" @click="$emit('add-to-cart', name)" style="width:100%;margin-top:12px">
        {{ inStock ? '장바구니 담기' : '품절' }}
      </button>
    </div>
  `
})

// ModalTrigger 컴포넌트
const ModalTrigger = defineComponent({
  emits: ['open', 'close', 'confirm', 'cancel'],
  template: `
    <div class="btn-group">
      <button class="btn btn-primary" @click="$emit('open')">모달 열기</button>
    </div>
  `
})

// SearchInput — v-model 지원 컴포넌트
const SearchInput = defineComponent({
  props: { modelValue: String, placeholder: String },
  emits: ['update:modelValue'],
  template: `
    <div style="position:relative">
      <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8">🔍</span>
      <input
        class="form-input"
        style="padding-left:36px"
        :value="modelValue"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>
  `
})

// 부모 상태
const productName = ref('Vue 3 핸드북')
const productPrice = ref(35000)
const inStock = ref(true)
const badge = ref('NEW')
const cartItems = ref([])
const handleAddToCart = (name) => cartItems.value.push(name)

const modalOpen = ref(false)
const lastAction = ref('')
const handleConfirm = () => { lastAction.value = '✅ 확인 클릭됨'; modalOpen.value = false }
const handleCancel  = () => { lastAction.value = '❌ 취소 클릭됨'; modalOpen.value = false }

const searchText = ref('')

// 코드 예시
const propsCode = `<script setup>
// 기본 defineProps
const props = defineProps({
  name:    { type: String,  required: true },
  price:   { type: Number,  default: 0 },
  inStock: { type: Boolean, default: true },
  tags:    { type: Array,   default: () => [] }, // 객체/배열은 함수로!
  badge:   {
    type: String,
    validator: (val) => ['NEW', 'HOT', 'SALE', ''].includes(val)
  }
})

// 접근 방법
console.log(props.name)  // props.name

// 구조분해 (반응성 유지하려면 toRefs 필요)
const { name, price } = toRefs(props)
<\/script>

<!-- 부모에서 사용 -->
<ProductCard
  name="Vue 핸드북"          <!-- 정적 문자열 -->
  :price="35000"             <!-- 동적 숫자 (: 필요) -->
  :in-stock="true"           <!-- kebab-case로 전달 -->
  :tags="['vue', 'js']"
/>`

const emitsCode = `<script setup>
// 1. 이벤트 선언
const emit = defineEmits(['add-to-cart', 'remove', 'update:count'])

// 2. 유효성 검사 포함
const emit = defineEmits({
  'add-to-cart': (payload) => {
    return typeof payload === 'string'  // 유효성 검사
  }
})

// 3. 이벤트 발송
function addToCart() {
  emit('add-to-cart', productName)  // 데이터와 함께
}

// 4. 여러 데이터 전달
function submit() {
  emit('submit', { name: '김철수', age: 25 })
}
<\/script>`

const vmodelCode = `<!-- ===== SearchInput.vue (자식) ===== -->
<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
// v-model 컴포넌트의 필수 패턴
defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])
<\/script>

<!-- 부모에서 v-model 사용 -->
<SearchInput v-model="searchText" />
<!-- 위 코드는 아래와 동일 -->
<SearchInput :modelValue="searchText" @update:modelValue="searchText = $event" />

<!-- 여러 v-model (Vue 3) -->
<MyForm v-model:name="name" v-model:age="age" />`

const antiPatternCode = `// ❌ 절대 하면 안 됨 — Props 직접 수정
<script setup>
const props = defineProps({ count: Number })

function increment() {
  props.count++  // 경고 발생! Props는 읽기 전용
}
<\/script>

// ✅ 방법 1: emit으로 부모에게 알리기
const emit = defineEmits(['update:count'])
function increment() {
  emit('update:count', props.count + 1)  // 부모가 변경
}

// ✅ 방법 2: 로컬 복사본 만들기 (독립 수정이 필요할 때)
const localCount = ref(props.count)  // props를 초기값으로 복사
function increment() {
  localCount.value++  // 로컬만 변경, props는 그대로
}`
</script>

<style>
.product-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.product-badge {
  position: absolute;
  top: -8px;
  right: 12px;
  background: #f59e0b;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.product-name  { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.product-price { font-size: 20px; font-weight: 800; color: #42b883; }
.product-stock { font-size: 13px; margin-top: 8px; }
.in-stock { color: #15803d; }
.out-stock { color: #dc2626; }
</style>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
}
.modal-box h3 { margin-bottom: 12px; }
.modal-box p  { color: #64748b; margin-bottom: 20px; }
</style>
