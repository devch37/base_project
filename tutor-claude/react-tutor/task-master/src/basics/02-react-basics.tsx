/**
 * ============================================
 * React 기초 - 컴포넌트와 JSX
 * ============================================
 *
 * React는 UI를 만들기 위한 JavaScript 라이브러리입니다.
 * 컴포넌트라는 작은 단위로 UI를 구성합니다.
 */

import React from 'react';

// ============================================
// 1. JSX란 무엇인가?
// ============================================

/*
JSX는 JavaScript XML의 약자로, JavaScript 안에서 HTML처럼 보이는
문법을 사용할 수 있게 해줍니다.

HTML:     <div>안녕하세요</div>
JSX:      <div>안녕하세요</div>  (거의 동일!)

하지만 JSX는 JavaScript이므로 몇 가지 차이점이 있습니다:
- class 대신 className 사용
- style은 객체로 전달
- 모든 태그는 닫혀야 함 (<br />처럼)
*/

// ============================================
// 2. 함수형 컴포넌트 (Function Component)
// ============================================

// 가장 기본적인 컴포넌트: 함수를 만들고 JSX를 반환
function Welcome() {
  return <h1>안녕하세요!</h1>;
}

// 화살표 함수로도 만들 수 있습니다
const Greeting = () => {
  return <h2>환영합니다!</h2>;
};

// ============================================
// 3. JSX 기본 문법
// ============================================

function JSXBasics() {
  // JSX 안에서 JavaScript 표현식 사용: 중괄호 {} 사용
  const name = "홍길동";
  const age = 25;

  return (
    <div>
      {/* JSX에서 주석은 이렇게 작성합니다 */}

      {/* 1. 변수 출력 */}
      <p>이름: {name}</p>
      <p>나이: {age}세</p>

      {/* 2. 표현식 사용 */}
      <p>내년 나이: {age + 1}세</p>
      <p>성인 여부: {age >= 19 ? "성인" : "미성년자"}</p>

      {/* 3. 함수 호출 */}
      <p>대문자: {name.toUpperCase()}</p>
    </div>
  );
}

// ============================================
// 4. 여러 줄의 JSX 작성하기
// ============================================

function MultiLineJSX() {
  return (
    // 여러 줄의 JSX는 반드시 하나의 부모 요소로 감싸야 합니다
    <div className="container">
      <h1>제목</h1>
      <p>내용</p>
      <button>버튼</button>
    </div>
  );
}

// Fragment를 사용하면 불필요한 div 없이 그룹화 가능
function WithFragment() {
  return (
    <>
      {/* <> </> 는 React.Fragment의 축약형 */}
      <h1>제목</h1>
      <p>내용</p>
    </>
  );
}

// ============================================
// 5. 클래스 이름과 스타일 적용
// ============================================

function StylingExample() {
  // 인라인 스타일: JavaScript 객체로 작성
  const headingStyle = {
    color: "blue",
    fontSize: "24px",
    fontWeight: "bold",
    // CSS의 kebab-case를 camelCase로 변경
    backgroundColor: "lightgray"
  };

  return (
    <div>
      {/* className으로 CSS 클래스 지정 (class가 아님!) */}
      <h1 className="main-title">제목</h1>

      {/* style 속성에 객체 전달 */}
      <p style={headingStyle}>스타일이 적용된 텍스트</p>

      {/* 직접 객체를 넣을 수도 있습니다 */}
      <p style={{ color: "red", fontSize: "16px" }}>
        빨간 텍스트
      </p>
    </div>
  );
}

// ============================================
// 6. 조건부 렌더링 (Conditional Rendering)
// ============================================

function ConditionalExample() {
  const isLoggedIn = true;
  const userRole = "admin";

  return (
    <div>
      {/* 방법 1: 삼항 연산자 (조건 ? 참일때 : 거짓일때) */}
      {isLoggedIn ? (
        <p>환영합니다!</p>
      ) : (
        <p>로그인이 필요합니다.</p>
      )}

      {/* 방법 2: && 연산자 (조건 && 렌더링할 내용) */}
      {isLoggedIn && <p>로그인 상태입니다.</p>}

      {/* 방법 3: 여러 조건 체크 */}
      {userRole === "admin" && <button>관리자 기능</button>}
    </div>
  );
}

// ============================================
// 7. 리스트 렌더링 (List Rendering)
// ============================================

function ListExample() {
  // 배열 데이터
  const fruits = ["사과", "바나나", "오렌지", "딸기"];
  const users = [
    { id: 1, name: "김철수", age: 25 },
    { id: 2, name: "이영희", age: 30 },
    { id: 3, name: "박민수", age: 28 }
  ];

  return (
    <div>
      {/* map을 사용해서 배열을 JSX로 변환 */}
      <h3>과일 목록</h3>
      <ul>
        {fruits.map((fruit, index) => (
          // key는 각 항목을 구별하기 위해 필요 (고유한 값 사용)
          <li key={index}>{fruit}</li>
        ))}
      </ul>

      <h3>사용자 목록</h3>
      <ul>
        {users.map((user) => (
          // 객체가 id를 가지고 있다면 그것을 key로 사용 (인덱스보다 권장)
          <li key={user.id}>
            {user.name} ({user.age}세)
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// 8. 이벤트 핸들링 (Event Handling)
// ============================================

function EventExample() {
  // 이벤트 핸들러 함수
  const handleClick = () => {
    alert("버튼이 클릭되었습니다!");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // event.target.value로 입력값 가져오기
    console.log("입력값:", event.target.value);
  };

  return (
    <div>
      {/* onClick에 함수를 전달 (함수 호출이 아님!) */}
      <button onClick={handleClick}>클릭하세요</button>

      {/* 직접 화살표 함수 사용도 가능 */}
      <button onClick={() => alert("직접 실행!")}>
        또 다른 버튼
      </button>

      {/* input의 onChange 이벤트 */}
      <input
        type="text"
        onChange={handleInputChange}
        placeholder="입력해보세요"
      />
    </div>
  );
}

// ============================================
// 9. 컴포넌트 조합하기
// ============================================

// 작은 컴포넌트들
function Header() {
  return (
    <header>
      <h1>나의 웹사이트</h1>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <p>&copy; 2024 All rights reserved</p>
    </footer>
  );
}

// 큰 컴포넌트에서 작은 컴포넌트들을 조합
function Layout() {
  return (
    <div className="layout">
      <Header />
      <main>
        <p>메인 콘텐츠</p>
      </main>
      <Footer />
    </div>
  );
}

// ============================================
// 10. 실습 예제: 간단한 프로필 카드
// ============================================

function ProfileCard() {
  const user = {
    name: "김개발",
    job: "프론트엔드 개발자",
    skills: ["React", "TypeScript", "JavaScript"],
    isAvailable: true
  };

  return (
    <div className="profile-card" style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "20px",
      maxWidth: "300px"
    }}>
      {/* 프로필 이미지 */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          backgroundColor: "#3498db",
          margin: "0 auto"
        }} />
      </div>

      {/* 사용자 정보 */}
      <h2>{user.name}</h2>
      <p style={{ color: "#666" }}>{user.job}</p>

      {/* 상태 표시 */}
      {user.isAvailable ? (
        <span style={{ color: "green" }}>✓ 연락 가능</span>
      ) : (
        <span style={{ color: "red" }}>✗ 연락 불가</span>
      )}

      {/* 스킬 목록 */}
      <h3>보유 스킬</h3>
      <ul>
        {user.skills.map((skill, index) => (
          <li key={index}>{skill}</li>
        ))}
      </ul>

      {/* 버튼 */}
      <button
        onClick={() => alert(`${user.name}에게 연락하기`)}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        연락하기
      </button>
    </div>
  );
}

// ============================================
// 요약 및 다음 단계
// ============================================

/*
핵심 포인트:
1. React는 컴포넌트 기반 (Component-based)
2. JSX는 JavaScript + HTML 같은 문법
3. {} 안에 JavaScript 표현식 사용
4. className, style로 스타일링
5. map으로 배열을 JSX로 변환
6. key는 리스트 항목의 고유 식별자
7. onClick, onChange 등으로 이벤트 처리
8. 작은 컴포넌트들을 조합해서 큰 UI 만들기

다음 단계: 03-react-props.tsx에서 Props를 배워보세요!
*/

// 실습을 위해 ProfileCard를 기본 내보내기
export default ProfileCard;
