/**
 * ============================================
 * TypeScript + React 고급 패턴
 * ============================================
 *
 * TypeScript를 React와 함께 사용할 때 알아야 할
 * 타입 정의, 패턴, 그리고 모범 사례들을 배웁니다.
 */

import React, { useState, useEffect, ReactNode, CSSProperties } from 'react';

// ============================================
// 1. 컴포넌트 Props 타입 정의 패턴
// ============================================

// 방법 1: interface 사용 (권장)
interface UserProps {
  name: string;
  age: number;
  email?: string;  // 선택적 prop
}

function User1({ name, age, email }: UserProps) {
  return <div>{name} ({age})</div>;
}

// 방법 2: type 사용
type ProductProps = {
  id: number;
  name: string;
  price: number;
};

function Product({ id, name, price }: ProductProps) {
  return <div>{name}: {price}원</div>;
}

// 방법 3: inline 타입 정의 (간단한 경우)
function SimpleComponent({ text }: { text: string }) {
  return <div>{text}</div>;
}

// ============================================
// 2. Children Props 타입
// ============================================

// ReactNode: 가장 범용적인 children 타입
interface ContainerProps {
  children: ReactNode;
}

function Container({ children }: ContainerProps) {
  return <div className="container">{children}</div>;
}

// 더 구체적인 children 타입들
interface SpecificChildrenProps {
  // 문자열만 허용
  textOnly: string;

  // 단일 React 요소
  singleElement: React.ReactElement;

  // JSX 요소
  jsxElement: JSX.Element;

  // 함수를 children으로 (Render Props 패턴)
  renderProp: (data: string) => ReactNode;
}

// ============================================
// 3. Event Handler 타입
// ============================================

function EventHandlers() {
  // 버튼 클릭
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("버튼 클릭!", event.currentTarget);
  };

  // Input 변경
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("입력값:", event.target.value);
  };

  // Form 제출
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("폼 제출!");
  };

  // 키보드 이벤트
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      console.log("엔터 키 입력!");
    }
  };

  // Focus 이벤트
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    console.log("포커스!", event.target);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
      />
      <button onClick={handleClick}>제출</button>
    </form>
  );
}

// ============================================
// 4. useState 타입 정의
// ============================================

function StateTypes() {
  // 타입 추론 (TypeScript가 자동으로 타입 결정)
  const [count, setCount] = useState(0);  // number
  const [text, setText] = useState("");   // string

  // 명시적 타입 지정
  const [user, setUser] = useState<User | null>(null);

  // 배열 타입
  const [items, setItems] = useState<string[]>([]);

  // 객체 타입
  interface FormData {
    username: string;
    email: string;
    age: number;
  }
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    age: 0
  });

  // Union 타입
  type Status = "idle" | "loading" | "success" | "error";
  const [status, setStatus] = useState<Status>("idle");

  return <div>State Types Example</div>;
}

// ============================================
// 5. 제네릭 컴포넌트
// ============================================

// 제네릭을 사용한 재사용 가능한 리스트 컴포넌트
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// 사용 예시
interface User {
  id: number;
  name: string;
  email: string;
}

function ListExample() {
  const users: User[] = [
    { id: 1, name: "김철수", email: "kim@example.com" },
    { id: 2, name: "이영희", email: "lee@example.com" }
  ];

  return (
    <List
      items={users}
      renderItem={(user) => (
        <div>
          {user.name} - {user.email}
        </div>
      )}
      keyExtractor={(user) => user.id}
    />
  );
}

// ============================================
// 6. 함수를 Props로 받을 때 타입
// ============================================

interface ButtonWithCallbackProps {
  // 매개변수 없는 함수
  onClick: () => void;

  // 매개변수 있는 함수
  onSubmit: (data: string) => void;

  // 값을 반환하는 함수
  onCalculate: (a: number, b: number) => number;

  // Promise를 반환하는 함수 (비동기)
  onFetch: () => Promise<void>;
}

// ============================================
// 7. useRef 타입 정의
// ============================================

function RefTypes() {
  // DOM 요소 ref
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 값을 저장하는 ref
  const countRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const focusInput = () => {
    // 옵셔널 체이닝으로 안전하게 접근
    inputRef.current?.focus();
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      console.log("타이머 완료!");
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div ref={divRef}>
      <input ref={inputRef} type="text" />
      <button ref={buttonRef} onClick={focusInput}>
        포커스
      </button>
    </div>
  );
}

// ============================================
// 8. Custom Hooks 타입 정의
// ============================================

// 반환 타입 명시
function useCounter(initialValue: number = 0): [number, () => void, () => void] {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);

  return [count, increment, decrement];
}

// 객체를 반환하는 Hook
interface UseToggleReturn {
  value: boolean;
  toggle: () => void;
  setTrue: () => void;
  setFalse: () => void;
}

function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = () => setValue(prev => !prev);
  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);

  return { value, toggle, setTrue, setFalse };
}

// 제네릭 Hook
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}

// ============================================
// 9. Style Props 타입
// ============================================

interface StyledComponentProps {
  // CSSProperties 타입 사용
  style?: CSSProperties;

  // className
  className?: string;

  // 특정 스타일만 허용
  color?: "red" | "blue" | "green";
  size?: "small" | "medium" | "large";
}

function StyledComponent({ style, className, color, size }: StyledComponentProps) {
  const sizeMap = {
    small: "12px",
    medium: "16px",
    large: "20px"
  };

  return (
    <div
      className={className}
      style={{
        ...style,
        color: color,
        fontSize: size ? sizeMap[size] : "16px"
      }}
    >
      스타일 컴포넌트
    </div>
  );
}

// ============================================
// 10. API 응답 타입 정의
// ============================================

// API 응답 인터페이스
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

function FetchWithTypes() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://api.example.com/user/1');
        const result: ApiResponse<UserData> = await response.json();
        setUser(result.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    // fetchUser();
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  if (!user) return <div>데이터 없음</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ============================================
// 11. Component Props 확장하기
// ============================================

// HTML 요소의 기본 props 상속
interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

function CustomButton({ variant = "primary", isLoading, children, ...rest }: CustomButtonProps) {
  return (
    <button
      {...rest}
      disabled={isLoading || rest.disabled}
      style={{
        backgroundColor: variant === "primary" ? "#007bff" : "#6c757d",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "4px",
        cursor: isLoading ? "wait" : "pointer",
        ...rest.style
      }}
    >
      {isLoading ? "로딩 중..." : children}
    </button>
  );
}

// 사용 예시
function CustomButtonExample() {
  return (
    <div>
      <CustomButton onClick={() => alert("클릭!")}>
        클릭하세요
      </CustomButton>

      <CustomButton variant="secondary" disabled>
        비활성화
      </CustomButton>

      <CustomButton isLoading>
        제출
      </CustomButton>
    </div>
  );
}

// ============================================
// 12. Union Types과 Discriminated Unions
// ============================================

// Union Type
type AlertType = "success" | "warning" | "error" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
}

function Alert({ type, message }: AlertProps) {
  const colors = {
    success: "#28a745",
    warning: "#ffc107",
    error: "#dc3545",
    info: "#17a2b8"
  };

  return (
    <div style={{
      padding: "15px",
      backgroundColor: colors[type],
      color: "white",
      borderRadius: "4px",
      margin: "10px 0"
    }}>
      {message}
    </div>
  );
}

// Discriminated Union (구별된 유니온)
interface LoadingState {
  status: "loading";
}

interface SuccessState<T> {
  status: "success";
  data: T;
}

interface ErrorState {
  status: "error";
  error: string;
}

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

function DataDisplay() {
  const [state, setState] = useState<AsyncState<UserData>>({
    status: "loading"
  });

  // 타입 가드를 통한 안전한 타입 체크
  if (state.status === "loading") {
    return <div>로딩 중...</div>;
  }

  if (state.status === "error") {
    return <div>에러: {state.error}</div>;
  }

  // 이 시점에서 TypeScript는 state가 SuccessState임을 알고 있음
  return (
    <div>
      <h2>{state.data.name}</h2>
      <p>{state.data.email}</p>
    </div>
  );
}

// ============================================
// 13. 실습 예제: 타입 안전한 Form
// ============================================

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

type FormErrors = {
  [K in keyof LoginFormData]?: string;
};

function TypeSafeForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = <K extends keyof LoginFormData>(
    field: K,
    value: LoginFormData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 에러 초기화
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "이메일을 입력하세요";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력하세요";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 6자 이상이어야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      console.log("로그인 데이터:", formData);
      alert("로그인 성공!");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>로그인</h2>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>
          이메일
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: errors.email ? "1px solid red" : "1px solid #ddd"
          }}
        />
        {errors.email && (
          <div style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
            {errors.email}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>
          비밀번호
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: errors.password ? "1px solid red" : "1px solid #ddd"
          }}
        />
        {errors.password && (
          <div style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
            {errors.password}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleChange("rememberMe", e.target.checked)}
            style={{ marginRight: "5px" }}
          />
          로그인 상태 유지
        </label>
      </div>

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        로그인
      </button>
    </form>
  );
}

// ============================================
// 요약 및 다음 단계
// ============================================

/*
TypeScript + React 핵심 패턴:

1. Props 타입
   - interface 또는 type 사용
   - 선택적 props: ?
   - children: ReactNode

2. Event 타입
   - React.MouseEvent<HTMLButtonElement>
   - React.ChangeEvent<HTMLInputElement>
   - React.FormEvent<HTMLFormElement>

3. State 타입
   - useState<Type>(초기값)
   - 타입 추론 활용

4. Ref 타입
   - useRef<HTMLElement>(null)
   - useRef<Type>(초기값)

5. 제네릭
   - 재사용 가능한 컴포넌트
   - Custom Hooks

6. Union Types
   - type Status = "idle" | "loading"
   - Discriminated Unions

7. HTML 속성 상속
   - extends React.HTMLAttributes<HTMLElement>

TypeScript를 사용하면:
✅ 타입 안정성
✅ 자동 완성
✅ 리팩토링 용이
✅ 버그 사전 발견
✅ 코드 문서화

다음 단계: 실제 프로젝트에 적용해보세요!
*/

export default TypeSafeForm;
