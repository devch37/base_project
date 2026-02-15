/**
 * ============================================
 * React Hooks - 함수형 컴포넌트의 강력한 기능들
 * ============================================
 *
 * Hooks는 함수형 컴포넌트에서 state와 생명주기 기능을 사용할 수 있게 해주는
 * 특별한 함수들입니다. (이름이 use로 시작)
 *
 * 주요 Hooks:
 * - useState: 상태 관리
 * - useEffect: 사이드 이펙트 처리
 * - useRef: DOM 접근 및 값 유지
 * - useMemo: 값 메모이제이션
 * - useCallback: 함수 메모이제이션
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ============================================
// 1. useEffect - 생명주기와 사이드 이펙트
// ============================================

/*
useEffect는 컴포넌트가 렌더링될 때마다 특정 작업을 수행할 수 있게 해줍니다.

사용 사례:
- API 호출
- 타이머 설정
- DOM 직접 조작
- 이벤트 리스너 등록
*/

function BasicUseEffect() {
  const [count, setCount] = useState(0);

  // 매 렌더링마다 실행
  useEffect(() => {
    console.log("컴포넌트가 렌더링되었습니다!");
  });

  // 처음 마운트될 때만 실행 (빈 배열 전달)
  useEffect(() => {
    console.log("컴포넌트가 처음 마운트되었습니다!");
  }, []);

  // count가 변경될 때만 실행 (의존성 배열)
  useEffect(() => {
    console.log(`count가 ${count}로 변경되었습니다!`);
  }, [count]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>카운트: {count}</h2>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}

// ============================================
// 2. useEffect 정리(cleanup) 함수
// ============================================

function TimerExample() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    // 타이머 시작
    const intervalId = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    // cleanup 함수: 컴포넌트 언마운트 시 또는 다음 effect 실행 전 호출
    return () => {
      console.log("타이머 정리!");
      clearInterval(intervalId);
    };
  }, [isRunning]); // isRunning이 변경될 때마다 재실행

  return (
    <div style={{ padding: "20px" }}>
      <h2>타이머: {seconds}초</h2>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? "중지" : "시작"}
      </button>
      <button onClick={() => setSeconds(0)}>리셋</button>
    </div>
  );
}

// ============================================
// 3. useEffect로 API 호출하기
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
}

function FetchUserExample() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // async 함수는 useEffect 안에서 바로 사용 불가
    // 별도 함수로 만들어서 호출
    const fetchUser = async () => {
      try {
        setLoading(true);
        // 실제 API 호출 예시
        const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err) {
        setError("데이터를 불러오는데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!user) return <div>사용자 정보가 없습니다.</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>사용자 정보</h2>
      <p>이름: {user.name}</p>
      <p>이메일: {user.email}</p>
    </div>
  );
}

// ============================================
// 4. useRef - DOM 요소 접근하기
// ============================================

/*
useRef는 두 가지 용도로 사용됩니다:
1. DOM 요소에 직접 접근
2. 렌더링과 상관없이 값 유지 (리렌더링 발생 안함)
*/

function UseRefExample() {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  // 렌더링 횟수 카운트 (리렌더링을 발생시키지 않음)
  renderCount.current += 1;

  // input에 포커스 주기
  const focusInput = () => {
    inputRef.current?.focus(); // 옵셔널 체이닝으로 안전하게 접근
  };

  // input 값 초기화
  const clearInput = () => {
    setText("");
    focusInput();
  };

  return (
    <div style={{ padding: "20px" }}>
      <p>렌더링 횟수: {renderCount.current}</p>

      <input
        ref={inputRef}  // ref 연결
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="입력하세요"
        style={{ padding: "10px", marginRight: "10px" }}
      />

      <button onClick={focusInput}>포커스</button>
      <button onClick={clearInput}>초기화</button>

      <p>입력한 내용: {text}</p>
    </div>
  );
}

// ============================================
// 5. useMemo - 값 메모이제이션
// ============================================

/*
useMemo는 계산 비용이 큰 연산의 결과를 메모이제이션(캐싱)합니다.
의존성 배열의 값이 변경될 때만 다시 계산합니다.
*/

function ExpensiveCalculation() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<number[]>([1, 2, 3, 4, 5]);

  // 비용이 큰 계산 (예시)
  const expensiveSum = (nums: number[]) => {
    console.log("비싼 계산 실행!");
    return nums.reduce((sum, num) => sum + num, 0);
  };

  // useMemo 없이: 매 렌더링마다 계산
  // const sum = expensiveSum(items);

  // useMemo 사용: items가 변경될 때만 계산
  const sum = useMemo(() => {
    return expensiveSum(items);
  }, [items]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>합계: {sum}</h2>
      <p>카운트: {count}</p>

      <button onClick={() => setCount(count + 1)}>
        카운트 증가 (재계산 안함)
      </button>

      <button onClick={() => setItems([...items, items.length + 1])}>
        항목 추가 (재계산됨)
      </button>
    </div>
  );
}

// ============================================
// 6. useCallback - 함수 메모이제이션
// ============================================

/*
useCallback은 함수를 메모이제이션합니다.
자식 컴포넌트에 함수를 props로 전달할 때 유용합니다.
*/

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// React.memo: props가 변경되지 않으면 재렌더링 방지
const MemoizedButton = React.memo(({ onClick, children }: ButtonProps) => {
  console.log(`${children} 버튼 렌더링`);
  return (
    <button onClick={onClick} style={{ margin: "5px", padding: "10px" }}>
      {children}
    </button>
  );
});

function UseCallbackExample() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);

  // useCallback 없이: 매 렌더링마다 새 함수 생성
  // const increment1 = () => setCount1(count1 + 1);

  // useCallback 사용: 의존성이 변경될 때만 새 함수 생성
  const increment1 = useCallback(() => {
    setCount1(prev => prev + 1);
  }, []); // 빈 배열: 한 번만 생성

  const increment2 = useCallback(() => {
    setCount2(prev => prev + 1);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <p>카운트 1: {count1}</p>
      <p>카운트 2: {count2}</p>

      <MemoizedButton onClick={increment1}>
        카운트 1 증가
      </MemoizedButton>

      <MemoizedButton onClick={increment2}>
        카운트 2 증가
      </MemoizedButton>
    </div>
  );
}

// ============================================
// 7. Custom Hook 만들기
// ============================================

/*
Custom Hook: 로직을 재사용하기 위해 만드는 커스텀 함수
반드시 use로 시작해야 합니다.
*/

// 윈도우 크기를 추적하는 Custom Hook
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    // cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

// Custom Hook 사용 예시
function WindowSizeDisplay() {
  const { width, height } = useWindowSize();

  return (
    <div style={{ padding: "20px" }}>
      <h2>윈도우 크기</h2>
      <p>너비: {width}px</p>
      <p>높이: {height}px</p>
      <p>창 크기를 조절해보세요!</p>
    </div>
  );
}

// 로컬 스토리지와 동기화하는 Custom Hook
function useLocalStorage<T>(key: string, initialValue: T) {
  // 초기값 설정
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 값 설정 함수
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// Custom Hook 사용 예시
function LocalStorageExample() {
  const [name, setName] = useLocalStorage<string>("name", "");
  const [age, setAge] = useLocalStorage<number>("age", 0);

  return (
    <div style={{ padding: "20px" }}>
      <h2>로컬 스토리지 예제</h2>
      <p>페이지를 새로고침해도 데이터가 유지됩니다!</p>

      <div style={{ marginBottom: "10px" }}>
        <label>
          이름:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>
          나이:
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </label>
      </div>

      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0" }}>
        <strong>저장된 데이터:</strong>
        <p>이름: {name || "(없음)"}</p>
        <p>나이: {age || "(없음)"}</p>
      </div>
    </div>
  );
}

// ============================================
// 8. 실습 예제: 다크 모드 토글
// ============================================

function useDarkMode() {
  const [isDark, setIsDark] = useLocalStorage<boolean>("darkMode", false);

  useEffect(() => {
    // body에 클래스 추가/제거
    if (isDark) {
      document.body.style.backgroundColor = "#1a1a1a";
      document.body.style.color = "#ffffff";
    } else {
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#000000";
    }
  }, [isDark]);

  return [isDark, setIsDark] as const;
}

function DarkModeExample() {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <div style={{ padding: "20px" }}>
      <h2>다크 모드 예제</h2>
      <p>현재 모드: {isDark ? "다크" : "라이트"}</p>

      <button
        onClick={() => setIsDark(!isDark)}
        style={{
          padding: "10px 20px",
          backgroundColor: isDark ? "#4a4a4a" : "#e0e0e0",
          color: isDark ? "#ffffff" : "#000000",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        {isDark ? "🌞 라이트 모드" : "🌙 다크 모드"}
      </button>
    </div>
  );
}

// ============================================
// 9. Hooks 사용 규칙
// ============================================

/*
Hooks의 규칙:
1. 최상위에서만 호출
   ✅ function Component() { useHook(); }
   ❌ if (condition) { useHook(); }  // 조건문 안에서 사용 금지

2. React 함수 안에서만 호출
   ✅ 함수형 컴포넌트 내부
   ✅ Custom Hook 내부
   ❌ 일반 JavaScript 함수

3. 이름은 use로 시작 (Custom Hook)
   ✅ useCustomHook
   ❌ customHook
*/

// ============================================
// 10. 실전 예제: 검색 기능
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function SearchExample() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [results, setResults] = useState<string[]>([]);

  const allItems = [
    "사과", "바나나", "오렌지", "딸기", "포도",
    "수박", "멜론", "복숭아", "자두", "망고"
  ];

  useEffect(() => {
    if (debouncedSearchTerm) {
      console.log("검색 중:", debouncedSearchTerm);
      const filtered = allItems.filter(item =>
        item.includes(debouncedSearchTerm)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>과일 검색</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="과일 이름을 입력하세요"
        style={{ padding: "10px", width: "100%", fontSize: "16px" }}
      />

      <div style={{ marginTop: "20px" }}>
        {searchTerm && (
          <>
            <p>검색 결과: {results.length}개</p>
            <ul>
              {results.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// 요약 및 다음 단계
// ============================================

/*
핵심 Hooks 정리:

1. useState
   - 상태 관리
   - const [state, setState] = useState(초기값)

2. useEffect
   - 사이드 이펙트 처리
   - useEffect(() => { ... }, [의존성])
   - cleanup: return () => { ... }

3. useRef
   - DOM 접근
   - 값 유지 (리렌더링 없음)

4. useMemo
   - 값 메모이제이션
   - 비싼 계산 최적화

5. useCallback
   - 함수 메모이제이션
   - 자식 컴포넌트 최적화

6. Custom Hooks
   - 로직 재사용
   - use로 시작하는 함수

다음 단계: 06-typescript-with-react.tsx에서
TypeScript와 React의 고급 패턴을 배워보세요!
*/

export default SearchExample;
