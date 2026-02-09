# Task Master - 학습 가이드

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [시작하기](#시작하기)
3. [학습 경로](#학습-경로)
4. [핵심 개념](#핵심-개념)
5. [단계별 학습](#단계별-학습)
6. [실습 과제](#실습-과제)
7. [FAQ](#faq)

---

## 프로젝트 개요

Task Master는 React와 TypeScript를 실무 수준으로 학습하기 위한 종합 프로젝트입니다. 단순한 튜토리얼이 아닌, 실제 프로덕션 환경에서 사용할 수 있는 코드 품질과 아키텍처를 가지고 있습니다.

### 왜 이 프로젝트인가?

1. **실전 중심**: 실무에서 실제로 사용하는 패턴과 라이브러리
2. **점진적 학습**: 기초부터 고급까지 단계적 구성
3. **Best Practices**: 업계 표준 코드 작성 방법
4. **타입 안전성**: TypeScript의 모든 이점 활용
5. **현대적 도구**: 2024년 현재 가장 인기 있는 기술 스택

---

## 시작하기

### 1. 환경 설정

```bash
# 프로젝트 디렉토리로 이동
cd task-master

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173`을 열어 애플리케이션을 확인하세요.

### 2. 개발 도구 설치

다음 브라우저 확장 프로그램을 설치하면 학습에 큰 도움이 됩니다:

- **React Developer Tools**: 컴포넌트 트리와 props/state 확인
- **Redux DevTools**: Zustand 상태 디버깅 (devtools 미들웨어 사용 시)

### 3. 에디터 설정 (VS Code 권장)

추천 확장 프로그램:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Error Lens

---

## 학습 경로

### 추천 학습 순서

```
1단계: 기초 개념 이해 (1-2주)
├─ React 기본 개념
├─ TypeScript 기초
└─ 프로젝트 구조 파악

2단계: 컴포넌트 학습 (1-2주)
├─ 공통 컴포넌트 분석
├─ Props와 State
└─ 이벤트 처리

3단계: 상태 관리 (2-3주)
├─ React Query (서버 상태)
├─ Zustand (클라이언트 상태)
└─ Custom Hooks

4단계: 고급 기능 (3-4주)
├─ 폼 처리 (React Hook Form)
├─ 라우팅 (React Router)
├─ 드래그 앤 드롭
└─ 성능 최적화

5단계: 실전 프로젝트 (4주+)
├─ 기능 확장
├─ 테스트 작성
├─ 배포
└─ 포트폴리오 작성
```

---

## 핵심 개념

### 1. React 핵심 개념

#### 컴포넌트

React 애플리케이션은 컴포넌트로 구성됩니다.

```tsx
// 함수형 컴포넌트 (추천)
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// TypeScript와 함께
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

#### Props

부모에서 자식으로 데이터를 전달합니다.

```tsx
// 부모 컴포넌트
<Button onClick={handleClick} variant="primary">
  클릭하세요
</Button>

// 자식 컴포넌트에서 받기
function Button({ onClick, variant, children }) {
  // ...
}
```

#### State

컴포넌트의 내부 상태를 관리합니다.

```tsx
const [count, setCount] = useState(0);

// 상태 업데이트
setCount(count + 1);
setCount((prev) => prev + 1); // 함수형 업데이트 (권장)
```

#### Effect

사이드 이펙트를 처리합니다.

```tsx
useEffect(() => {
  // 컴포넌트 마운트 시 실행
  console.log('Component mounted');

  // 클린업 함수
  return () => {
    console.log('Component unmounted');
  };
}, []); // 의존성 배열
```

### 2. TypeScript 핵심 개념

#### 인터페이스

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  age?: number; // Optional
}
```

#### 타입

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'danger';

type Status = 'loading' | 'success' | 'error';
```

#### 제네릭

```tsx
function identity<T>(value: T): T {
  return value;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
}
```

### 3. React Query 핵심 개념

#### Query (데이터 읽기)

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: fetchTasks,
});
```

#### Mutation (데이터 변경)

```tsx
const mutation = useMutation({
  mutationFn: createTask,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});

// 사용
mutation.mutate(newTaskData);
```

### 4. Zustand 핵심 개념

```tsx
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// 컴포넌트에서 사용
const { count, increment } = useStore();
```

---

## 단계별 학습

### Phase 1: 기초 다지기

#### 학습 목표
- React 함수형 컴포넌트 이해
- Props와 State의 차이
- TypeScript 기본 타입

#### 학습 파일
1. `/src/types/index.ts` - 타입 정의 이해
2. `/src/components/common/Button.tsx` - 기본 컴포넌트
3. `/src/utils/helpers.ts` - 유틸리티 함수

#### 실습 과제
1. 새로운 공통 컴포넌트 만들기 (Badge, Alert 등)
2. 타입 정의 추가하기
3. 유틸리티 함수 작성하기

#### 체크리스트
- [ ] 함수형 컴포넌트를 작성할 수 있다
- [ ] Props 타입을 정의할 수 있다
- [ ] useState를 사용할 수 있다
- [ ] 조건부 렌더링을 할 수 있다

### Phase 2: 상태 관리

#### 학습 목표
- React Query로 서버 상태 관리
- Zustand로 클라이언트 상태 관리
- Custom Hook 작성

#### 학습 파일
1. `/src/hooks/useTasks.ts` - React Query 활용
2. `/src/store/authStore.ts` - Zustand 기본
3. `/src/store/taskStore.ts` - 복잡한 상태 관리

#### 실습 과제
1. useQuery로 데이터 페칭하기
2. useMutation으로 데이터 변경하기
3. Zustand 스토어 만들기
4. Custom Hook 작성하기

#### 체크리스트
- [ ] useQuery를 사용할 수 있다
- [ ] useMutation을 사용할 수 있다
- [ ] Zustand 스토어를 만들 수 있다
- [ ] Custom Hook을 작성할 수 있다

### Phase 3: 폼 처리

#### 학습 목표
- React Hook Form 사용법
- Zod를 이용한 유효성 검증
- 에러 처리

#### 실습 과제
1. 로그인 폼 만들기
2. 회원가입 폼 만들기
3. 작업 생성/수정 폼 만들기

#### 체크리스트
- [ ] React Hook Form을 사용할 수 있다
- [ ] Zod 스키마를 작성할 수 있다
- [ ] 폼 에러를 처리할 수 있다

### Phase 4: 라우팅

#### 학습 목표
- React Router 설정
- 페이지 컴포넌트 분리
- Protected Routes

#### 실습 과제
1. 라우터 설정하기
2. 페이지 컴포넌트 만들기
3. 인증 라우트 구현하기

### Phase 5: 고급 기능

#### 학습 목표
- 드래그 앤 드롭
- 성능 최적화
- 에러 바운더리

#### 실습 과제
1. 드래그 앤 드롭 구현
2. React.memo 적용
3. useCallback/useMemo 사용

---

## 실습 과제

### 초급 과제

1. **Badge 컴포넌트 만들기**
   - variant: 'success' | 'warning' | 'error' | 'info'
   - size: 'sm' | 'md' | 'lg'
   - 힌트: Button.tsx를 참고하세요

2. **Task 카드 컴포넌트 개선**
   - 작업 상세 정보 표시
   - 클릭 시 상세 모달
   - 상태 변경 드롭다운

3. **필터 기능 추가**
   - 상태별 필터
   - 우선순위별 필터
   - 검색 기능

### 중급 과제

1. **페이지네이션 구현**
   - React Query의 useInfiniteQuery 사용
   - 무한 스크롤 or 페이지 번호

2. **작업 통계 대시보드**
   - 상태별 작업 수
   - 우선순위 분포 차트
   - 최근 활동 타임라인

3. **댓글 기능 추가**
   - 댓글 CRUD
   - 실시간 업데이트
   - 알림 기능

### 고급 과제

1. **드래그 앤 드롭 칸반 보드**
   - dnd-kit 사용
   - 칸반 보드 UI
   - 순서 저장

2. **실시간 협업 기능**
   - WebSocket 연결
   - 다른 사용자의 작업 실시간 반영
   - Presence 표시

3. **성능 최적화**
   - 가상화 (react-window)
   - Code Splitting
   - Lazy Loading

---

## FAQ

### Q: React와 TypeScript를 처음 배우는데 이 프로젝트가 적합한가요?

A: 이 프로젝트는 React와 TypeScript의 기본을 알고 있다는 전제로 만들어졌습니다. 완전 초보라면 먼저 React 공식 문서의 튜토리얼을 완료하고 오시는 것을 추천합니다.

### Q: 어떤 파일부터 읽어야 하나요?

A: 다음 순서로 읽으세요:
1. `/src/types/index.ts` - 전체 타입 구조
2. `/src/components/common/Button.tsx` - 기본 컴포넌트
3. `/src/hooks/useTasks.ts` - React Query 패턴
4. `/src/App.tsx` - 전체 흐름

### Q: Mock API를 실제 API로 변경하려면?

A: `/src/hooks/useTasks.ts`에서 `mockApi`를 `api`로 변경하면 됩니다.

```tsx
// Before
import mockApi from '../services/mockApi';

// After
import api from '../services/api';
```

### Q: Tailwind CSS를 다른 CSS 라이브러리로 바꿀 수 있나요?

A: 네, 가능합니다. 다만 모든 컴포넌트의 className을 변경해야 합니다. 학습 목적이라면 Tailwind CSS를 그대로 사용하는 것을 추천합니다.

### Q: 에러가 발생했을 때 어떻게 해결하나요?

A:
1. 콘솔 에러 메시지를 꼼꼼히 읽기
2. 파일 상단의 주석 참고
3. React DevTools로 컴포넌트 상태 확인
4. Network 탭에서 API 요청 확인
5. 코드의 주석 읽기

### Q: 실무에서 바로 사용할 수 있나요?

A: 이 프로젝트의 패턴과 구조는 실무에서 사용 가능합니다. 다만 다음을 추가로 고려하세요:
- 실제 백엔드 API 연동
- 테스트 코드 작성
- 에러 모니터링 (Sentry 등)
- 성능 모니터링
- 접근성 (a11y) 강화
- 보안 (인증, 권한 등)

---

## 추가 학습 자료

### 공식 문서
- [React 공식 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### 추천 유튜브 채널
- Jack Herrington (영어)
- Web Dev Simplified (영어)
- Nomad Coders (한국어)
- 드림코딩 (한국어)

### 추천 블로그
- Kent C. Dodds
- Dan Abramov
- Robin Wieruch

---

## 다음 단계

이 프로젝트를 완료했다면:

1. **포트폴리오 만들기**
   - GitHub에 업로드
   - README 작성
   - 배포 (Vercel, Netlify)

2. **심화 학습**
   - Next.js로 서버 사이드 렌더링
   - React Native로 모바일 앱
   - GraphQL 학습

3. **실전 프로젝트**
   - 나만의 프로젝트 기획
   - 실제 서비스 런칭
   - 오픈소스 기여

---

**Happy Learning!**

질문이나 피드백은 GitHub Issues에 남겨주세요.
