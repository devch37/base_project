# React + TypeScript 기초 학습 가이드

초보자를 위한 React와 TypeScript 기본 문법 학습 자료입니다.
각 파일은 독립적으로 학습할 수 있으며, 주석과 예제가 풍부하게 포함되어 있습니다.

## 📚 학습 순서

### 1단계: TypeScript 기초
**파일**: `01-typescript-basics.tsx`

TypeScript의 기본 문법을 배웁니다.
- 기본 타입 (string, number, boolean)
- 배열과 객체
- 인터페이스와 타입 별칭
- 함수와 제네릭
- 클래스와 열거형

**학습 시간**: 약 1시간

### 2단계: React 기초
**파일**: `02-react-basics.tsx`

React의 핵심 개념을 배웁니다.
- JSX 문법
- 함수형 컴포넌트
- 조건부 렌더링
- 리스트 렌더링
- 이벤트 핸들링
- 컴포넌트 조합

**학습 시간**: 약 1.5시간

### 3단계: Props 이해하기
**파일**: `03-react-props.tsx`

컴포넌트 간 데이터 전달 방법을 배웁니다.
- Props의 개념
- Props 타입 정의
- Children Props
- 함수를 Props로 전달하기
- 기본값 설정

**학습 시간**: 약 1시간

### 4단계: State 관리
**파일**: `04-react-state.tsx`

컴포넌트의 상태 관리를 배웁니다.
- useState Hook
- Input과 State 연동
- 배열 State 관리
- 객체 State 관리
- 불변성 유지

**학습 시간**: 약 1.5시간

### 5단계: React Hooks
**파일**: `05-react-hooks.tsx`

다양한 React Hooks를 배웁니다.
- useEffect (생명주기)
- useRef (DOM 접근)
- useMemo (값 최적화)
- useCallback (함수 최적화)
- Custom Hooks 만들기

**학습 시간**: 약 2시간

### 6단계: TypeScript + React 심화
**파일**: `06-typescript-with-react.tsx`

TypeScript와 React의 고급 패턴을 배웁니다.
- 제네릭 컴포넌트
- Event Handler 타입
- 타입 안전한 Form
- Union Types
- API 응답 타입

**학습 시간**: 약 1.5시간

---

## 🚀 학습 방법

### 1. 코드 읽기
- 각 파일을 위에서 아래로 천천히 읽어보세요
- 주석을 꼼꼼히 읽으며 이해하세요
- 이해가 안 되는 부분은 표시해두세요

### 2. 코드 실행해보기
```bash
# 개발 서버 실행
npm run dev
```

- main.tsx나 App.tsx에서 원하는 컴포넌트를 import하여 실행
- 브라우저에서 실제 동작 확인

### 3. 코드 수정해보기
- 예제 코드를 직접 수정해보세요
- 값을 바꾸고, 새로운 기능을 추가해보세요
- 에러를 만나면 어떻게 해결하는지 배우세요

### 4. 실습 문제 풀기
각 파일 끝에 있는 실습 예제를 직접 만들어보세요

---

## 💡 학습 팁

### 초보자를 위한 조언
1. **천천히 진행하세요**
   - 한 번에 모든 것을 이해하려 하지 마세요
   - 하루에 1-2개 파일씩 학습하는 것을 권장합니다

2. **직접 코딩하세요**
   - 복사-붙여넣기만 하지 마세요
   - 직접 타이핑하면서 익히세요

3. **에러를 두려워하지 마세요**
   - 에러는 배움의 기회입니다
   - 에러 메시지를 읽고 이해하려 노력하세요

4. **반복 학습하세요**
   - 한 번에 이해가 안 되면 다시 읽어보세요
   - 실습을 반복하면 자연스럽게 익숙해집니다

### 효과적인 학습 방법
- 📝 **메모하기**: 이해한 내용을 자신의 말로 정리
- 🎯 **목표 설정**: 작은 프로젝트를 만들어보기
- 👥 **질문하기**: 이해가 안 되는 부분은 검색하거나 질문
- 🔄 **복습하기**: 주기적으로 이전 내용 복습

---

## 📖 각 파일별 핵심 개념

### 01-typescript-basics.tsx
```typescript
// 타입 지정
const name: string = "홍길동";

// 인터페이스
interface User {
  name: string;
  age: number;
}

// 함수
function greet(name: string): string {
  return `안녕하세요, ${name}님!`;
}
```

### 02-react-basics.tsx
```tsx
// 컴포넌트
function Welcome() {
  return <h1>안녕하세요!</h1>;
}

// JSX 표현식
function Greeting() {
  const name = "김철수";
  return <p>안녕, {name}!</p>;
}
```

### 03-react-props.tsx
```tsx
// Props 타입 정의
interface GreetingProps {
  name: string;
}

// Props 사용
function Greeting({ name }: GreetingProps) {
  return <h1>안녕하세요, {name}님!</h1>;
}
```

### 04-react-state.tsx
```tsx
// State 사용
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        증가
      </button>
    </div>
  );
}
```

### 05-react-hooks.tsx
```tsx
// useEffect
useEffect(() => {
  console.log("컴포넌트 렌더링!");
}, []);

// Custom Hook
function useCounter(initialValue: number) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(prev => prev + 1);
  return [count, increment] as const;
}
```

### 06-typescript-with-react.tsx
```tsx
// 제네릭 컴포넌트
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

---

## 🎯 학습 후 프로젝트 아이디어

기초를 마친 후 다음 프로젝트를 만들어보세요:

### 쉬운 난이도
1. **카운터 앱**
   - 증가/감소/리셋 버튼
   - useState 연습

2. **할 일 목록 (Todo)**
   - 추가/삭제/완료 기능
   - 배열 State 연습

3. **간단한 계산기**
   - 사칙연산 구현
   - State와 이벤트 연습

### 중간 난이도
1. **날씨 앱**
   - API 호출 (useEffect)
   - 로딩/에러 상태 관리

2. **쇼핑 카트**
   - 상품 추가/삭제
   - 총 금액 계산

3. **메모 앱**
   - CRUD 기능
   - localStorage 저장

### 어려운 난이도
1. **블로그 플랫폼**
   - 게시글 CRUD
   - 댓글 기능

2. **채팅 앱**
   - 실시간 메시지
   - 사용자 관리

3. **대시보드**
   - 차트/그래프
   - 데이터 시각화

---

## 🔗 추가 학습 자료

### 공식 문서
- [React 공식 문서 (한글)](https://ko.react.dev/)
- [TypeScript 공식 문서 (한글)](https://www.typescriptlang.org/ko/)

### 유용한 도구
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/)

### 추천 유튜브 채널
- 노마드 코더
- 드림코딩
- 벨로퍼트

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1. 순서대로 꼭 공부해야 하나요?
A: 권장하지만 필수는 아닙니다. 이미 아는 부분은 건너뛰어도 됩니다.

### Q2. 얼마나 시간이 걸리나요?
A: 개인차가 있지만, 전체를 완료하는 데 1-2주 정도 소요됩니다.

### Q3. 어려운 부분이 있으면 어떻게 하나요?
A:
- 공식 문서 참고
- 구글/스택오버플로우 검색
- 커뮤니티에 질문

### Q4. 다음에 무엇을 배워야 하나요?
A:
- React Router (라우팅)
- 상태 관리 (Redux, Zustand)
- 스타일링 (styled-components, Tailwind CSS)
- 테스팅 (Jest, React Testing Library)

---

## 🎉 학습을 마치며

축하합니다! 🎊

이 가이드를 모두 완료했다면, 당신은 이제:
- ✅ TypeScript 기본 문법을 이해합니다
- ✅ React 컴포넌트를 만들 수 있습니다
- ✅ Props와 State를 다룰 수 있습니다
- ✅ Hooks를 활용할 수 있습니다
- ✅ 타입 안전한 React 앱을 만들 수 있습니다

**다음 단계**: 실제 프로젝트를 만들어보세요!
배운 것을 활용해서 자신만의 애플리케이션을 만드는 것이
가장 좋은 학습 방법입니다.

화이팅! 💪

---

## 📝 학습 체크리스트

학습을 완료할 때마다 체크해보세요:

- [ ] 01-typescript-basics.tsx 완료
- [ ] 02-react-basics.tsx 완료
- [ ] 03-react-props.tsx 완료
- [ ] 04-react-state.tsx 완료
- [ ] 05-react-hooks.tsx 완료
- [ ] 06-typescript-with-react.tsx 완료
- [ ] 첫 번째 실습 프로젝트 완료
- [ ] 공식 문서 읽기 시작

---

**마지막 업데이트**: 2024년 2월
**작성자**: Claude Code Tutor
**라이선스**: 학습 목적으로 자유롭게 사용 가능

문의사항이나 개선 제안이 있다면 언제든 알려주세요!
