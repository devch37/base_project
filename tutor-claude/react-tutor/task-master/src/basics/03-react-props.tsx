/**
 * ============================================
 * React Props - 컴포넌트에 데이터 전달하기
 * ============================================
 *
 * Props는 "properties"의 줄임말로, 부모 컴포넌트에서
 * 자식 컴포넌트로 데이터를 전달하는 방법입니다.
 * HTML 속성(attribute)처럼 사용합니다.
 */

import React from 'react';

// ============================================
// 1. Props의 기본 개념
// ============================================

/*
Props는 읽기 전용(read-only)입니다!
자식 컴포넌트는 받은 props를 수정할 수 없습니다.

부모 컴포넌트 → Props → 자식 컴포넌트 (단방향 데이터 흐름)
*/

// ============================================
// 2. Props 없는 컴포넌트 vs Props 있는 컴포넌트
// ============================================

// Props 없이 하드코딩된 컴포넌트
function GreetingWithoutProps() {
  return <h1>안녕하세요, 홍길동님!</h1>;
}

// Props를 받는 컴포넌트 (TypeScript 타입 정의)
interface GreetingProps {
  name: string;
}

function GreetingWithProps(props: GreetingProps) {
  // props는 객체입니다
  return <h1>안녕하세요, {props.name}님!</h1>;
}

// 구조 분해 할당(destructuring)을 사용하면 더 간결
function GreetingDestructured({ name }: GreetingProps) {
  return <h1>안녕하세요, {name}님!</h1>;
}

// ============================================
// 3. 여러 개의 Props 사용하기
// ============================================

interface UserCardProps {
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

function UserCard({ name, age, email, isActive }: UserCardProps) {
  return (
    <div style={{
      border: "2px solid #ddd",
      borderRadius: "8px",
      padding: "16px",
      margin: "10px"
    }}>
      <h2>{name}</h2>
      <p>나이: {age}세</p>
      <p>이메일: {email}</p>
      <p>
        상태: { isActive? (
          <span style={{ color: "green" }}>활성</span>
        ) : (
          <span style={{ color: "red" }}>비활성</span>
        )}
      </p>
    </div>
  );
}

// ============================================
// 4. Props의 기본값 (Default Props)
// ============================================

interface ButtonProps {
  text: string;
  color?: string;  // 물음표: 선택적 prop
  size?: "small" | "medium" | "large";
}

function Button({ text, color = "blue", size = "medium" }: ButtonProps) {
  // color와 size가 전달되지 않으면 기본값 사용

  const sizeStyles = {
    small: { padding: "5px 10px", fontSize: "12px" },
    medium: { padding: "10px 20px", fontSize: "16px" },
    large: { padding: "15px 30px", fontSize: "20px" }
  };

  return (
    <button style={{
      backgroundColor: color,
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      ...sizeStyles[size]
    }}>
      {text}
    </button>
  );
}

// ============================================
// 5. 객체와 배열을 Props로 전달하기
// ============================================

interface Product {
  id: number;
  name: string;
  price: number;
}

interface ProductCardProps {
  product: Product;  // 객체를 prop으로 전달
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <div style={{
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "16px",
      margin: "10px"
    }}>
      <h3>{product.name}</h3>
      <p>가격: {product.price.toLocaleString()}원</p>
      <button>장바구니 담기</button>
    </div>
  );
}

// 배열을 props로 전달
interface ProductListProps {
  products: Product[];  // 배열을 prop으로 전달
}

function ProductList({ products }: ProductListProps) {
  return (
    <div>
      <h2>상품 목록</h2>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// ============================================
// 6. Children Props - 컴포넌트 사이에 내용 넣기
// ============================================

interface CardProps {
  title: string;
  children: React.ReactNode;  // children은 특별한 prop
}

function Card({ title, children }: CardProps) {
  return (
    <div style={{
      border: "2px solid #3498db",
      borderRadius: "8px",
      padding: "20px",
      margin: "10px"
    }}>
      <h2>{title}</h2>
      <div>
        {children}  {/* 여기에 부모에서 전달한 내용이 들어감 */}
      </div>
    </div>
  );
}

// children 사용 예시
function ChildrenExample() {
  return (
    <div>
      <Card title="카드 1">
        <p>이것은 카드의 내용입니다.</p>
        <button>버튼</button>
      </Card>

      <Card title="카드 2">
        <ul>
          <li>항목 1</li>
          <li>항목 2</li>
        </ul>
      </Card>
    </div>
  );
}

// ============================================
// 7. 함수를 Props로 전달하기 (이벤트 핸들러)
// ============================================

interface AlertButtonProps {
  message: string;
  onClick: () => void;  // 함수를 prop으로 받음
}

function AlertButton({ message, onClick }: AlertButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
      }}
    >
      {message}
    </button>
  );
}

// 매개변수가 있는 함수를 props로 전달
interface UserListItemProps {
  user: {
    id: number;
    name: string;
  };
  onDelete: (id: number) => void;
}

function UserListItem({ user, onDelete }: UserListItemProps) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "10px",
      border: "1px solid #ddd",
      margin: "5px 0"
    }}>
      <AlertButton message='test' onClick={() => { console.log('TEST CHECK !!!!') }}></AlertButton>
      <span>{user.name}</span>
      <button onClick={() => onDelete(user.id)}>
        삭제
      </button>
    </div>
  );
}

// ============================================
// 8. Props 유효성 검사 (TypeScript로 자동!)
// ============================================

interface AgeDisplayProps {
  age: number;  // TypeScript가 자동으로 타입 체크
}

function AgeDisplay({ age }: AgeDisplayProps) {
  // age는 반드시 number 타입
  // 문자열이나 다른 타입을 전달하면 컴파일 에러!
  return <p>나이: {age}세</p>;
}

// ============================================
// 9. 실습 예제: 종합적인 Props 활용
// ============================================

interface CommentProps {
  author: string;
  text: string;
  date: Date;
  likes: number;
  onLike: () => void;
  onDelete: () => void;
}

function Comment({ author, text, date, likes, onLike, onDelete }: CommentProps) {
  // 날짜 포맷팅
  const formattedDate = date.toLocaleDateString('ko-KR');

  return (
    <div style={{
      border: "1px solid #e1e8ed",
      borderRadius: "8px",
      padding: "16px",
      margin: "10px 0",
      backgroundColor: "#f8f9fa"
    }}>
      {/* 작성자 정보 */}
      <div style={{ marginBottom: "10px" }}>
        <strong>{author}</strong>
        <span style={{ color: "#657786", marginLeft: "10px", fontSize: "14px" }}>
          {formattedDate}
        </span>
      </div>

      {/* 댓글 내용 */}
      <p style={{ margin: "10px 0" }}>{text}</p>

      {/* 액션 버튼들 */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onLike}
          style={{
            padding: "5px 10px",
            backgroundColor: "#1da1f2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          👍 좋아요 ({likes})
        </button>
        <button
          onClick={onDelete}
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
      </div>
    </div>
  );
}

// 부모 컴포넌트에서 사용
function CommentList() {
  const comments = [
    {
      id: 1,
      author: "김철수",
      text: "React 정말 재미있어요!",
      date: new Date("2024-01-15"),
      likes: 5
    },
    {
      id: 2,
      author: "이영희",
      text: "Props 개념이 이해되기 시작했습니다.",
      date: new Date("2024-01-16"),
      likes: 3
    }
  ];

  const handleLike = (id: number) => {
    console.log(`댓글 ${id}에 좋아요!`);
  };

  const handleDelete = (id: number) => {
    console.log(`댓글 ${id} 삭제`);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2>댓글 목록</h2>
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          author={comment.author}
          text={comment.text}
          date={comment.date}
          likes={comment.likes}
          onLike={() => handleLike(comment.id)}
          onDelete={() => handleDelete(comment.id)}
        />
      ))}
    </div>
  );
}

// ============================================
// 10. Props 전달 패턴 - Spread Operator
// ============================================

interface PersonProps {
  name: string;
  age: number;
  city: string;
}

function PersonInfo({ name, age, city }: PersonProps) {
  return (
    <div>
      <p>이름: {name}</p>
      <p>나이: {age}</p>
      <p>도시: {city}</p>
    </div>
  );
}

// Spread operator로 한 번에 전달
function SpreadExample() {
  const person = {
    name: "박민수",
    age: 28,
    city: "서울"
  };

  return (
    <div>
      {/* 일일이 전달하는 방식 */}
      <PersonInfo name={person.name} age={person.age} city={person.city} />

      {/* Spread operator 사용 (더 간결!) */}
      <PersonInfo {...person} />
    </div>
  );
}

// ============================================
// 요약 및 다음 단계
// ============================================

/*
핵심 포인트:
1. Props는 부모 → 자식으로 데이터를 전달하는 방법
2. Props는 읽기 전용 (수정 불가)
3. TypeScript로 props의 타입을 정의
4. 구조 분해 할당으로 간결하게 사용
5. children은 특별한 prop (컴포넌트 사이의 내용)
6. 함수도 props로 전달 가능 (이벤트 핸들러)
7. 기본값 설정 가능 (? 와 = 사용)
8. Spread operator로 props 일괄 전달

Props 흐름:
<Parent>
  ↓ (props 전달)
<Child props={data}>
  ↓ (읽기만 가능)
  props 사용

다음 단계: 04-react-state.tsx에서 State를 배워보세요!
State는 컴포넌트가 "기억"하고 "변경"할 수 있는 데이터입니다.
*/

export default CommentList;
