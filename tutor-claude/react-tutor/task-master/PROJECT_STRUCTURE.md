# Task Master - 프로젝트 구조

## 전체 구조

```
task-master/
├── src/
│   ├── components/          # 컴포넌트
│   │   ├── common/         # 재사용 가능한 공통 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Card.tsx
│   │   ├── layout/         # 레이아웃 컴포넌트 (확장 가능)
│   │   ├── tasks/          # 작업 관련 컴포넌트 (확장 가능)
│   │   └── auth/           # 인증 관련 컴포넌트 (확장 가능)
│   │
│   ├── hooks/              # Custom Hooks
│   │   └── useTasks.ts    # 작업 관련 React Query Hook
│   │
│   ├── store/              # Zustand 상태 관리
│   │   ├── authStore.ts   # 인증 상태
│   │   └── taskStore.ts   # 작업 UI 상태
│   │
│   ├── services/           # API 서비스 계층
│   │   ├── api.ts         # 실제 API 클라이언트
│   │   └── mockApi.ts     # Mock API (학습용)
│   │
│   ├── types/              # TypeScript 타입 정의
│   │   └── index.ts       # 전역 타입
│   │
│   ├── utils/              # 유틸리티 함수
│   │   └── helpers.ts     # 헬퍼 함수 모음
│   │
│   ├── styles/             # 스타일 파일
│   ├── assets/             # 정적 자산
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── App.tsx             # 메인 App 컴포넌트
│   ├── main.tsx            # 엔트리 포인트
│   └── index.css           # 전역 스타일
│
├── public/                 # 정적 파일
├── .env                    # 환경 변수
├── .env.example            # 환경 변수 예시
├── package.json            # 의존성
├── tsconfig.json           # TypeScript 설정
├── tailwind.config.js      # Tailwind CSS 설정
├── postcss.config.js       # PostCSS 설정
├── vite.config.ts          # Vite 설정
├── README.md               # 프로젝트 개요
├── LEARNING_GUIDE.md       # 학습 가이드
└── PROJECT_STRUCTURE.md    # 이 파일
```

## 주요 파일 설명

### 핵심 설정 파일

#### `package.json`
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "@tanstack/react-query": "^5.90.20",
    "zustand": "^5.0.11",
    "react-router-dom": "^7.13.0",
    "react-hook-form": "^7.71.1",
    "zod": "^4.3.6",
    "@dnd-kit/core": "^6.3.1",
    "axios": "^1.13.5",
    "react-hot-toast": "^2.6.0",
    "date-fns": "^4.1.0"
  }
}
```

#### `tsconfig.json`
TypeScript 컴파일러 설정
- Strict 모드 활성화
- React JSX 지원
- 최신 ES 기능 사용

#### `tailwind.config.js`
Tailwind CSS 설정
- 커스텀 색상 팔레트
- 폰트 패밀리
- 확장 가능한 테마

#### `vite.config.ts`
Vite 빌드 도구 설정
- React 플러그인
- 개발 서버 설정
- 빌드 최적화

### 소스 코드 구조

#### `/src/types/index.ts`
전역 타입 정의
- Enum: TaskPriority, TaskStatus, UserRole
- Interface: User, Task, Project, Comment
- API Types: ApiResponse, PaginatedResponse
- Form Types: CreateTaskInput, UpdateTaskInput
- Utility Types: Generic types, Type guards

#### `/src/utils/helpers.ts`
유틸리티 함수
- 날짜 포맷팅
- 문자열 처리
- 배열/객체 변환
- Task 필터링 및 정렬
- 로컬 스토리지 관리
- Debounce, Throttle

#### `/src/services/api.ts`
실제 API 통신
- Axios 인스턴스 설정
- Request/Response 인터셉터
- API 메서드: auth, task, user
- 에러 처리 중앙화

#### `/src/services/mockApi.ts`
Mock API (학습용)
- 로컬 스토리지 기반
- 실제 API와 동일한 인터페이스
- 네트워크 지연 시뮬레이션
- CRUD 작업 구현

#### `/src/store/authStore.ts`
인증 상태 관리 (Zustand)
- 사용자 정보
- 토큰 관리
- 로그인/로그아웃 액션
- Persist 미들웨어로 영속성

#### `/src/store/taskStore.ts`
작업 UI 상태 관리
- 필터 상태
- 정렬 옵션
- 모달 상태
- 선택 상태
- DevTools 미들웨어

#### `/src/hooks/useTasks.ts`
작업 관련 React Query Hook
- useQuery: 데이터 페칭
- useMutation: 데이터 변경
- 캐시 무효화 전략
- 낙관적 업데이트

#### `/src/components/common/`
재사용 가능한 UI 컴포넌트
- **Button.tsx**: 다양한 variant와 size 지원
- **Input.tsx**: Form 통합, 에러 처리
- **Card.tsx**: Compound Components 패턴

#### `/src/App.tsx`
메인 애플리케이션 컴포넌트
- React Query Provider 설정
- Toast 알림 설정
- 데모 페이지 구현

## 데이터 흐름

### 읽기 (Query)
```
Component → useQuery Hook → API Service → Backend
         ← Cache ← Query Client ← Response ←
```

### 쓰기 (Mutation)
```
Component → useMutation Hook → API Service → Backend
         → Optimistic Update
         → Cache Invalidation
         ← UI Update
```

### 상태 관리 분리
```
Server State (React Query)
- Task 데이터
- User 데이터
- API 응답 캐싱

Client State (Zustand)
- UI 상태 (모달, 필터, 정렬)
- 사용자 선택
- 인증 정보
```

## 학습 경로별 파일 맵

### 1단계: 기초
- `src/types/index.ts` - 타입 시스템 이해
- `src/components/common/Button.tsx` - 기본 컴포넌트
- `src/utils/helpers.ts` - 유틸리티 함수

### 2단계: 상태 관리
- `src/hooks/useTasks.ts` - React Query
- `src/store/authStore.ts` - Zustand 기본
- `src/store/taskStore.ts` - 복잡한 상태

### 3단계: API 통신
- `src/services/api.ts` - Axios 설정
- `src/services/mockApi.ts` - Mock 구현

### 4단계: 전체 통합
- `src/App.tsx` - 모든 것을 연결

## 확장 가이드

### 새로운 페이지 추가
1. `/src/pages/` 디렉토리 생성
2. 페이지 컴포넌트 작성
3. React Router 설정

### 새로운 Feature 추가
1. `/src/types/` 에 타입 추가
2. `/src/services/` 에 API 추가
3. `/src/hooks/` 에 Hook 추가
4. `/src/components/` 에 UI 추가

### 새로운 공통 컴포넌트 추가
1. `/src/components/common/` 에 파일 생성
2. Props 인터페이스 정의
3. forwardRef 사용 (Form 통합 시)
4. Storybook 추가 (선택사항)

## Best Practices

### 파일 명명 규칙
- 컴포넌트: PascalCase (Button.tsx)
- Hook: camelCase with 'use' prefix (useTasks.ts)
- 유틸리티: camelCase (helpers.ts)
- 타입: PascalCase for interfaces/types
- Store: camelCase with 'Store' suffix (authStore.ts)

### Import 순서
```tsx
// 1. External libraries
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules
import { Button } from './components/common/Button';
import { useTasks } from './hooks/useTasks';

// 3. Types
import type { Task } from './types';

// 4. Styles
import './styles.css';
```

### 컴포넌트 구조
```tsx
// 1. Imports
import ...

// 2. Types
interface Props { ... }

// 3. Constants
const OPTIONS = [ ... ];

// 4. Component
export function Component({ props }: Props) {
  // 4.1. Hooks
  const [state, setState] = useState();

  // 4.2. Event Handlers
  const handleClick = () => { ... };

  // 4.3. Effects
  useEffect(() => { ... }, []);

  // 4.4. Render
  return ( ... );
}
```

## 다음 단계

### 추가할 기능
1. **라우팅**: React Router 통합
2. **인증**: 로그인/회원가입 페이지
3. **드래그 앤 드롭**: dnd-kit으로 칸반 보드
4. **폼 관리**: React Hook Form + Zod
5. **테스트**: Jest + React Testing Library
6. **배포**: Vercel 또는 Netlify

### 성능 최적화
1. React.memo 적용
2. useCallback/useMemo 사용
3. Code Splitting (React.lazy)
4. Virtual Scrolling (react-window)

### 품질 향상
1. ESLint 규칙 강화
2. Prettier 설정
3. Husky pre-commit hooks
4. CI/CD 파이프라인

---

**이 프로젝트는 학습용입니다.** 실무에 적용하기 전에 보안, 테스트, 에러 처리를 강화하세요.
