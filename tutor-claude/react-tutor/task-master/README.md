# Task Master - 실무 수준 React + TypeScript 학습 프로젝트

## 프로젝트 개요

Task Master는 팀 협업을 위한 작업 관리 플랫폼입니다. 이 프로젝트를 통해 React 기초부터 실무에서 사용하는 고급 패턴까지 학습할 수 있습니다.

## 학습 목표

### Phase 1: React 기초 (Components & Props)
- ✅ 함수형 컴포넌트 작성
- ✅ Props와 TypeScript 인터페이스
- ✅ 컴포넌트 구조화 및 재사용성
- ✅ 조건부 렌더링과 리스트 렌더링

### Phase 2: 상태 관리 (State & Hooks)
- ✅ useState로 로컬 상태 관리
- ✅ useEffect로 사이드 이펙트 처리
- ✅ Custom Hooks 작성
- ✅ useContext로 전역 상태 관리

### Phase 3: 폼 처리 & 유효성 검증
- ✅ React Hook Form으로 효율적인 폼 관리
- ✅ Zod를 이용한 스키마 기반 유효성 검증
- ✅ 실시간 에러 피드백

### Phase 4: API 통신 & 데이터 페칭
- ✅ Axios로 HTTP 요청
- ✅ TanStack Query(React Query)로 서버 상태 관리
- ✅ 로딩, 에러, 성공 상태 처리
- ✅ 데이터 캐싱 및 무효화 전략

### Phase 5: 라우팅 & 네비게이션
- ✅ React Router로 SPA 라우팅
- ✅ 중첩 라우트와 레이아웃
- ✅ Protected Routes (인증 필요 라우트)
- ✅ 프로그래밍 방식 네비게이션

### Phase 6: 전역 상태 관리
- ✅ Zustand로 효율적인 상태 관리
- ✅ 상태 슬라이스 패턴
- ✅ 미들웨어 활용 (persist, devtools)

### Phase 7: 고급 UI 인터랙션
- ✅ Drag & Drop (dnd-kit)
- ✅ 애니메이션과 트랜지션
- ✅ 모달과 오버레이

### Phase 8: 성능 최적화
- ✅ React.memo로 불필요한 리렌더링 방지
- ✅ useMemo와 useCallback 활용
- ✅ 코드 스플리팅과 Lazy Loading
- ✅ 가상화 (Virtual Scrolling)

### Phase 9: 에러 처리 & 사용자 경험
- ✅ Error Boundaries
- ✅ Toast 알림 (react-hot-toast)
- ✅ 낙관적 업데이트 (Optimistic Updates)
- ✅ 재시도 로직

### Phase 10: 실무 베스트 프랙티스
- ✅ 프로젝트 구조화 전략
- ✅ 타입 안전성 강화
- ✅ 환경 변수 관리
- ✅ 접근성 (a11y) 고려사항

## 기술 스택

### 핵심 기술
- **React 19** - 최신 React 기능
- **TypeScript** - 타입 안전성
- **Vite** - 빠른 개발 환경

### 상태 관리
- **Zustand** - 경량 전역 상태 관리
- **TanStack Query** - 서버 상태 관리 및 캐싱

### 라우팅
- **React Router v7** - 최신 SPA 라우팅

### 폼 & 유효성 검증
- **React Hook Form** - 성능 최적화된 폼 관리
- **Zod** - TypeScript 우선 스키마 검증

### UI & UX
- **dnd-kit** - 드래그 앤 드롭
- **react-hot-toast** - 알림 시스템
- **date-fns** - 날짜 처리

### HTTP 클라이언트
- **Axios** - HTTP 요청

## 프로젝트 구조

```
task-master/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/         # 공통 UI 컴포넌트 (Button, Input, Card 등)
│   │   ├── layout/         # 레이아웃 컴포넌트 (Header, Sidebar 등)
│   │   ├── tasks/          # 작업 관련 컴포넌트
│   │   └── auth/           # 인증 관련 컴포넌트
│   ├── hooks/              # Custom Hooks
│   ├── pages/              # 페이지 컴포넌트 (라우트별)
│   ├── services/           # API 서비스 계층
│   ├── store/              # Zustand 스토어
│   ├── types/              # TypeScript 타입 정의
│   ├── utils/              # 유틸리티 함수
│   ├── styles/             # 전역 스타일
│   └── assets/             # 정적 자산
├── public/                 # 정적 파일
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 빌드
```bash
npm run build
```

### 4. 프로덕션 미리보기
```bash
npm run preview
```

## 학습 가이드

### 시작하기 전에
이 프로젝트는 단계별로 구성되어 있습니다. 각 단계는 이전 단계의 지식을 기반으로 합니다.

### 권장 학습 순서

1. **타입 정의 이해하기** (`src/types/`)
   - TypeScript 인터페이스와 타입 알아보기
   - 도메인 모델 이해하기

2. **공통 컴포넌트** (`src/components/common/`)
   - 재사용 가능한 UI 컴포넌트 학습
   - Props 패턴 이해하기
   - TypeScript Generics 활용

3. **페이지 컴포넌트** (`src/pages/`)
   - 라우트별 페이지 구조
   - 컴포넌트 조합 패턴

4. **Custom Hooks** (`src/hooks/`)
   - 로직 재사용 패턴
   - Hook 작성 베스트 프랙티스

5. **상태 관리** (`src/store/`)
   - Zustand 스토어 구조
   - 상태 업데이트 패턴

6. **API 통신** (`src/services/`)
   - Axios 인스턴스 설정
   - React Query 통합
   - 에러 핸들링

7. **고급 기능**
   - 드래그 앤 드롭
   - 성능 최적화
   - 에러 바운더리

## 주요 기능

### 1. 인증 시스템
- 로그인 / 회원가입
- JWT 토큰 기반 인증
- Protected Routes
- 자동 토큰 갱신

### 2. 작업 관리
- 작업 CRUD (생성, 조회, 수정, 삭제)
- 필터링 및 정렬
- 검색 기능
- 우선순위 설정

### 3. 보드 뷰
- 칸반 보드 스타일
- 드래그 앤 드롭으로 상태 변경
- 시각적 작업 관리

### 4. 팀 협업
- 작업 할당
- 댓글 시스템
- 실시간 업데이트

### 5. 대시보드
- 작업 통계
- 진행률 시각화
- 최근 활동

## 코드 품질

### TypeScript
- 모든 컴포넌트와 함수에 명시적 타입
- Interface와 Type 적절히 활용
- Generic 타입으로 재사용성 향상

### 컴포넌트 설계
- 단일 책임 원칙 (SRP)
- Props Drilling 회피
- Composition over Inheritance

### 성능
- React.memo로 메모이제이션
- useCallback/useMemo 적절히 사용
- Code Splitting으로 번들 최적화

### 접근성
- 시맨틱 HTML
- ARIA 속성
- 키보드 내비게이션

## 환경 변수

`.env` 파일을 생성하여 다음 변수를 설정하세요:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Task Master
```

## Mock API

실제 백엔드 없이 학습할 수 있도록 Mock API가 포함되어 있습니다.
`src/services/mockApi.ts`에서 데이터를 시뮬레이션합니다.

## 다음 단계

이 프로젝트를 완료한 후 다음을 학습할 수 있습니다:

1. **실제 백엔드 연동**
   - RESTful API 또는 GraphQL
   - WebSocket으로 실시간 기능

2. **테스트**
   - Jest + React Testing Library
   - E2E 테스트 (Playwright, Cypress)

3. **배포**
   - Vercel, Netlify 배포
   - CI/CD 파이프라인

4. **고급 기능**
   - 다크모드
   - 국제화 (i18n)
   - PWA

## 학습 팁

1. **코드 읽기**: 주석을 꼼꼼히 읽으세요. 왜 그렇게 작성했는지 설명되어 있습니다.
2. **직접 수정**: 코드를 변경하며 어떻게 동작하는지 실험하세요.
3. **콘솔 확인**: 개발자 도구에서 React DevTools와 Network 탭을 활용하세요.
4. **공식 문서**: 각 라이브러리의 공식 문서를 참고하세요.
5. **단계별 진행**: 한 번에 모든 것을 이해하려 하지 마세요.

## 참고 자료

- [React 공식 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Zustand 문서](https://zustand.docs.pmnd.rs/)
- [React Router 문서](https://reactrouter.com/)

## 라이선스

MIT

## 기여

이 프로젝트는 학습 목적으로 만들어졌습니다. 개선 사항이나 버그를 발견하면 이슈를 등록해주세요.

---

**Happy Learning!**

질문이나 막히는 부분이 있다면 주석을 참고하거나, 각 단계별로 차근차근 학습하세요.
