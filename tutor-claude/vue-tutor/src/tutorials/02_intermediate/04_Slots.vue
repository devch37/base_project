<template>
  <div class="tutorial-page">
    <div class="tutorial-header">
      <div class="level-badge level-intermediate">Intermediate · 04</div>
      <h1>🎰 Slots</h1>
      <p>슬롯은 컴포넌트에 <strong>HTML 콘텐츠를 주입</strong>할 수 있게 해줍니다.<br>
         레이아웃 컴포넌트, 재사용 가능한 UI 패턴에 필수적입니다.</p>
    </div>

    <div class="section-card">
      <h2>1️⃣ 기본 슬롯 (Default Slot)</h2>
      <div class="demo-box">
        <h4>🎮 데모</h4>
        <BaseCard>
          <p>이 내용은 <strong>부모</strong>가 주입한 내용입니다.</p>
          <p>BaseCard 컴포넌트는 이 내용을 모르지만 표시해줍니다.</p>
        </BaseCard>
        <BaseCard>
          <button class="btn btn-primary">완전히 다른 내용 주입!</button>
        </BaseCard>
      </div>
      <div class="code-block">{{ defaultSlotCode }}</div>
    </div>

    <div class="section-card">
      <h2>2️⃣ 명명된 슬롯 (Named Slots)</h2>
      <div class="demo-box">
        <h4>🎮 레이아웃 컴포넌트 데모</h4>
        <PageLayout>
          <template #header>
            <h2 style="color:#42b883">📄 페이지 헤더</h2>
          </template>
          <template #default>
            <p>이것은 본문(default slot) 내용입니다.</p>
            <p>여러 줄도 가능합니다.</p>
          </template>
          <template #footer>
            <small style="color:#94a3b8">© 2024 Footer</small>
          </template>
        </PageLayout>
      </div>
      <div class="code-block">{{ namedSlotCode }}</div>
    </div>

    <div class="section-card">
      <h2>3️⃣ 스코프드 슬롯 (Scoped Slots) ⭐ 고급</h2>
      <p style="color:#64748b;font-size:14px;margin-bottom:16px">
        자식 컴포넌트가 데이터를 부모에게 올려보내 렌더링을 위임합니다.
        <strong>실무에서 매우 자주 쓰이는 패턴!</strong>
      </p>
      <div class="demo-box">
        <h4>🎮 DataTable 컴포넌트 — 렌더링을 부모가 결정</h4>
        <DataTable :items="users">
          <!-- slotProps로 자식의 데이터를 받아서 렌더링 -->
          <template #row="{ item, index }">
            <tr>
              <td>{{ index + 1 }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="avatar">{{ item.name[0] }}</div>
                  {{ item.name }}
                </div>
              </td>
              <td>{{ item.role }}</td>
              <td><span :class="['status-chip', item.active ? 'chip-active' : 'chip-inactive']">
                {{ item.active ? '활성' : '비활성' }}
              </span></td>
            </tr>
          </template>
        </DataTable>
      </div>
      <div class="code-block">{{ scopedSlotCode }}</div>
      <div class="info">
        🔑 스코프드 슬롯 활용처:<br>
        - DataTable (행 렌더링 위임)<br>
        - List (아이템 렌더링 위임)<br>
        - Form (입력 필드 렌더링 위임)<br>
        - 무한 스크롤, 가상화 리스트
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, reactive } from 'vue'

// 기본 슬롯 컴포넌트
const BaseCard = defineComponent({
  template: `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <slot />
    </div>
  `
})

// 명명된 슬롯 컴포넌트
const PageLayout = defineComponent({
  template: `
    <div style="border:2px solid #42b883;border-radius:12px;overflow:hidden">
      <div style="background:#f0fdf4;padding:16px;border-bottom:1px solid #bbf7d0">
        <slot name="header">기본 헤더</slot>
      </div>
      <div style="padding:16px">
        <slot />
      </div>
      <div style="background:#f8fafc;padding:12px 16px;border-top:1px solid #e2e8f0;text-align:center">
        <slot name="footer" />
      </div>
    </div>
  `
})

// 스코프드 슬롯 DataTable
const DataTable = defineComponent({
  props: { items: Array },
  template: `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f8fafc;text-align:left">
          <th style="padding:10px 12px;border-bottom:2px solid #e2e8f0">#</th>
          <th style="padding:10px 12px;border-bottom:2px solid #e2e8f0">이름</th>
          <th style="padding:10px 12px;border-bottom:2px solid #e2e8f0">역할</th>
          <th style="padding:10px 12px;border-bottom:2px solid #e2e8f0">상태</th>
        </tr>
      </thead>
      <tbody>
        <slot v-for="(item, index) in items" :key="item.id" name="row" :item="item" :index="index" />
      </tbody>
    </table>
  `
})

const users = reactive([
  { id: 1, name: '김철수', role: 'Frontend', active: true },
  { id: 2, name: '이영희', role: 'Backend', active: true },
  { id: 3, name: '박민준', role: 'DevOps', active: false },
  { id: 4, name: '정수연', role: 'Designer', active: true },
])

const defaultSlotCode = `<!-- BaseCard.vue -->
<template>
  <div class="card">
    <slot />  <!-- 부모가 주입한 내용이 여기 들어감 -->
    <!-- 기본값 설정 가능 -->
    <slot>기본 내용 (아무것도 안 주입하면 이게 보임)</slot>
  </div>
</template>

<!-- 부모에서 사용 -->
<BaseCard>
  <p>이 내용이 slot으로 들어갑니다.</p>
</BaseCard>
<BaseCard>
  <button>완전히 다른 내용!</button>
</BaseCard>`

const namedSlotCode = `<!-- PageLayout.vue -->
<template>
  <div>
    <header><slot name="header" /></header>
    <main><slot /><!-- default slot --></main>
    <footer><slot name="footer" /></footer>
  </div>
</template>

<!-- 부모에서 사용 -->
<PageLayout>
  <template #header>  <!-- v-slot:header 의 단축형 -->
    <h1>제목</h1>
  </template>

  <!-- default slot은 #default 또는 그냥 넣기 -->
  <p>본문 내용</p>

  <template #footer>
    <p>푸터</p>
  </template>
</PageLayout>`

const scopedSlotCode = `<!-- DataTable.vue (자식) -->
<template>
  <table>
    <tbody>
      <!-- :item, :index 로 부모에게 데이터 전달 -->
      <slot
        v-for="(item, index) in items"
        name="row"
        :item="item"
        :index="index"
      />
    </tbody>
  </table>
</template>

<!-- 부모에서 슬롯 데이터 받아서 렌더링 -->
<DataTable :items="users">
  <template #row="{ item, index }">
    <tr>
      <td>{{ index + 1 }}</td>
      <td>{{ item.name }}</td>
      <td>{{ item.role }}</td>
    </tr>
  </template>
</DataTable>

<!-- 👆 DataTable은 어떻게 렌더링할지 모름 — 부모가 결정!
     → 같은 DataTable로 완전히 다른 모양 렌더링 가능
     → 재사용성 극대화! -->`
</script>

<style>
.avatar {
  width: 28px; height: 28px;
  background: #42b883;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.status-chip {
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.chip-active   { background: #f0fdf4; color: #15803d; }
.chip-inactive { background: #f8fafc; color: #94a3b8; }
</style>

<style scoped>
tbody tr { border-bottom: 1px solid #f1f5f9; }
tbody tr:hover { background: #f8fafc; }
tbody td { padding: 10px 12px; }
</style>
