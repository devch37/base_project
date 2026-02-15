/**
 * ============================================
 * React State - 컴포넌트의 상태 관리하기
 * ============================================
 *
 * State는 컴포넌트가 "기억"하는 데이터입니다.
 * State가 변경되면 컴포넌트가 다시 렌더링됩니다.
 *
 * Props vs State:
 * - Props: 부모에게 받는 데이터 (읽기 전용)
 * - State: 컴포넌트가 관리하는 데이터 (변경 가능)
 */

import React, { useState } from 'react';

// ============================================
// 1. useState Hook 기본 사용법
// ============================================

/*
useState는 React에서 가장 기본적인 Hook입니다.

문법:
const [상태값, 상태를변경하는함수] = useState(초기값);

예시:
const [count, setCount] = useState(0);
     ↑        ↑                    ↑
   현재값   변경함수              초기값
*/

function Counter() {
  // count: 현재 카운트 값
  // setCount: count를 변경하는 함수
  // 0: 초기값
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: "20px", border: "1px solid #ddd" }}>
      <h2>카운터: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        증가
      </button>
      <button onClick={() => setCount(count - 1)}>
        감소
      </button>
      <button onClick={() => setCount(0)}>
        리셋
      </button>
    </div>
  );
}

// ============================================
// 2. 다양한 타입의 State
// ============================================

function VariousStates() {
  // 문자열 state
  const [name, setName] = useState<string>("홍길동");

  // 숫자 state
  const [age, setAge] = useState<number>(25);

  // 불리언 state
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // 배열 state
  const [items, setItems] = useState<string[]>(["사과", "바나나"]);

  // 객체 state
  const [user, setUser] = useState({
    name: "김철수",
    email: "kim@example.com",
    age: 30
  });

  return (
    <div style={{ padding: "20px" }}>
      <h3>문자열 State</h3>
      <p>이름: {name}</p>
      <button onClick={() => setName("이영희")}>이름 변경</button>

      <h3>불리언 State</h3>
      <button onClick={() => setIsVisible(!isVisible)}>
        토글
      </button>
      {isVisible && <p>보여요!</p>}

      <h3>배열 State</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <button onClick={() => setItems([...items, "오렌지"])}>
        항목 추가
      </button>
    </div>
  );
}

// ============================================
// 3. Input과 State 연동하기
// ============================================

function InputExample() {
  const [text, setText] = useState<string>("");

  // input의 값이 변경될 때마다 호출
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  return (
    <div style={{ padding: "20px" }}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="입력하세요"
        style={{ padding: "10px", fontSize: "16px" }}
      />
      <p>입력한 내용: {text}</p>
      <p>글자 수: {text.length}</p>
    </div>
  );
}

// ============================================
// 4. 여러 개의 Input 다루기
// ============================================

function FormExample() {
  // 객체로 여러 값을 한 번에 관리
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    age: ""
  });

  // 하나의 핸들러로 모든 input 처리
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    // 기존 객체를 복사하고 해당 필드만 업데이트
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // 페이지 새로고침 방지
    console.log("제출된 데이터:", formData);
    alert(`이름: ${formData.username}\n이메일: ${formData.email}\n나이: ${formData.age}`);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>회원가입 폼</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>
            이름:
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{ marginLeft: "10px", padding: "5px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            이메일:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ marginLeft: "10px", padding: "5px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            나이:
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              style={{ marginLeft: "10px", padding: "5px" }}
            />
          </label>
        </div>

        <button type="submit" style={{ padding: "10px 20px" }}>
          제출
        </button>
      </form>
    </div>
  );
}

// ============================================
// 5. 배열 State 다루기 (추가, 삭제, 수정)
// ============================================

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "React 공부하기", completed: false },
    { id: 2, text: "TypeScript 익히기", completed: false }
  ]);
  const [inputText, setInputText] = useState<string>("");

  // 할 일 추가
  const addTodo = () => {
    if (inputText.trim() === "") return;

    const newTodo: Todo = {
      id: Date.now(), // 간단한 고유 ID 생성
      text: inputText,
      completed: false
    };

    setTodos([...todos, newTodo]); // 기존 배열에 새 항목 추가
    setInputText(""); // input 초기화
  };

  // 할 일 삭제
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 완료 상태 토글
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h2>할 일 목록</h2>

      {/* 입력 영역 */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") addTodo();
          }}
          placeholder="할 일을 입력하세요"
          style={{ padding: "10px", width: "70%" }}
        />
        <button
          onClick={addTodo}
          style={{ padding: "10px 20px", marginLeft: "10px" }}
        >
          추가
        </button>
      </div>

      {/* 할 일 목록 */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              marginBottom: "5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                style={{ marginRight: "10px" }}
              />
              <span
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                  color: todo.completed ? "#999" : "#000"
                }}
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      {/* 통계 */}
      <div style={{ marginTop: "20px", color: "#666" }}>
        <p>전체: {todos.length}개</p>
        <p>완료: {todos.filter(t => t.completed).length}개</p>
        <p>미완료: {todos.filter(t => !t.completed).length}개</p>
      </div>
    </div>
  );
}

// ============================================
// 6. State 업데이트 주의사항
// ============================================

function StateUpdateExample() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: "김철수", age: 25 });

  // ❌ 잘못된 방법: 직접 수정 (React가 감지 못함)
  const wrongWay = () => {
    // count = count + 1;  // 오류! state를 직접 수정하면 안됨
    // user.age = 26;      // 오류! 객체를 직접 수정하면 안됨
  };

  // ✅ 올바른 방법: setState 함수 사용
  const correctWay = () => {
    // 숫자, 문자열 등 원시값: 새 값으로 교체
    setCount(count + 1);

    // 객체: 전개 연산자로 복사 후 수정
    setUser({ ...user, age: user.age + 1 });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>카운트: {count}</h3>
      <h3>사용자: {user.name} ({user.age}세)</h3>
      <button onClick={correctWay}>나이 증가</button>
    </div>
  );
}

// ============================================
// 7. 이전 State 기반으로 업데이트하기
// ============================================

function CounterWithPrevState() {
  const [count, setCount] = useState(0);

  // 일반적인 방법
  const increment1 = () => {
    setCount(count + 1);
  };

  // 이전 state를 인자로 받는 함수형 업데이트
  // 연속적인 업데이트가 필요할 때 사용
  const increment2 = () => {
    setCount(prevCount => prevCount + 1);
  };

  // 차이점 확인
  const handleMultipleUpdates = () => {
    // 방법 1: 같은 값으로 3번 설정 → 1만 증가
    // setCount(count + 1);
    // setCount(count + 1);
    // setCount(count + 1);

    // 방법 2: 이전 값 기반으로 업데이트 → 3 증가
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>카운트: {count}</h2>
      <button onClick={increment1}>+1 (일반)</button>
      <button onClick={increment2}>+1 (함수형)</button>
      <button onClick={handleMultipleUpdates}>+3 (연속)</button>
    </div>
  );
}

// ============================================
// 8. 실습 예제: 쇼핑 카트
// ============================================

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

function ShoppingCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const products = [
    { id: 1, name: "노트북", price: 1500000 },
    { id: 2, name: "마우스", price: 30000 },
    { id: 3, name: "키보드", price: 80000 }
  ];

  // 장바구니에 추가
  const addToCart = (product: { id: number; name: string; price: number }) => {
    // 이미 장바구니에 있는지 확인
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      // 있으면 수량만 증가
      setCart(
        cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // 없으면 새로 추가
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // 수량 감소
  const decreaseQuantity = (id: number) => {
    const item = cart.find(item => item.id === id);
    if (item && item.quantity > 1) {
      setCart(
        cart.map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      // 수량이 1이면 삭제
      removeFromCart(id);
    }
  };

  // 장바구니에서 제거
  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // 총 금액 계산
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>상품 목록</h2>
      <div style={{ marginBottom: "30px" }}>
        {products.map(product => (
          <div
            key={product.id}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              marginBottom: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <strong>{product.name}</strong>
              <p>{product.price.toLocaleString()}원</p>
            </div>
            <button
              onClick={() => addToCart(product)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              담기
            </button>
          </div>
        ))}
      </div>

      <h2>장바구니 ({cart.length})</h2>
      {cart.length === 0 ? (
        <p>장바구니가 비어있습니다.</p>
      ) : (
        <>
          {cart.map(item => (
            <div
              key={item.id}
              style={{
                padding: "10px",
                border: "1px solid #ddd",
                marginBottom: "10px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.price.toLocaleString()}원 x {item.quantity}</p>
                </div>
                <div>
                  <button onClick={() => decreaseQuantity(item.id)}>-</button>
                  <span style={{ margin: "0 10px" }}>{item.quantity}</span>
                  <button onClick={() => addToCart(item)}>+</button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{ marginLeft: "10px", color: "red" }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "20px", fontSize: "20px", fontWeight: "bold" }}>
            총 금액: {totalPrice.toLocaleString()}원
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// 요약 및 다음 단계
// ============================================

/*
핵심 포인트:
1. useState로 state 생성: const [state, setState] = useState(초기값)
2. state가 변경되면 컴포넌트 재렌더링
3. setState 함수로만 state 변경 가능 (직접 수정 ❌)
4. 배열/객체는 복사 후 수정 (불변성 유지)
5. 함수형 업데이트: setState(prev => 새값)
6. input과 연동: value={state} onChange={e => setState(e.target.value)}

State 업데이트 패턴:
- 숫자/문자열: setState(새값)
- 배열 추가: setState([...arr, 새항목])
- 배열 삭제: setState(arr.filter(item => item.id !== id))
- 배열 수정: setState(arr.map(item => item.id === id ? 수정된값 : item))
- 객체 수정: setState({...obj, 변경할속성: 새값})

다음 단계: 05-react-hooks.tsx에서 더 많은 Hooks를 배워보세요!
*/

export default ShoppingCart;
