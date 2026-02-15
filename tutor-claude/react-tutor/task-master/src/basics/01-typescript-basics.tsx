/**
 * ============================================
 * TypeScript 기초 문법 학습하기
 * ============================================
 *
 * TypeScript는 JavaScript에 타입 시스템을 추가한 언어입니다.
 * 타입을 명시함으로써 코드의 안정성과 가독성을 높일 수 있습니다.
 */

// ============================================
// 1. 기본 타입 (Primitive Types)
// ============================================

// string: 문자열 타입
const userName: string = "홍길동";
const greeting: string = `안녕하세요, ${userName}님!`;

// number: 숫자 타입 (정수와 소수 모두 포함)
const age: number = 25;
const pi: number = 3.14;

// boolean: 불리언 타입 (true 또는 false)
const isStudent: boolean = true;
const isAdult: boolean = age >= 19;

// null과 undefined: 값이 없음을 나타내는 타입
const nullValue: null = null;
const undefinedValue: undefined = undefined;

// ============================================
// 2. 배열 (Array)
// ============================================

// 문자열 배열: 두 가지 방법으로 선언 가능
const fruits: string[] = ["사과", "바나나", "오렌지"];
const animals: Array<string> = ["강아지", "고양이", "토끼"];

// 숫자 배열
const numbers: number[] = [1, 2, 3, 4, 5];

// 여러 타입이 섞인 배열 (Tuple - 튜플)
const person: [string, number] = ["김철수", 30];

// ============================================
// 3. 객체 (Object)
// ============================================

// 객체의 타입을 직접 정의
const user: { name: string; age: number; email: string } = {
  name: "이영희",
  age: 28,
  email: "younghee@example.com"
};

// ============================================
// 4. 인터페이스 (Interface)
// ============================================

// 인터페이스: 객체의 구조를 정의하는 방법
interface Student {
  name: string;        // 필수 속성
  age: number;         // 필수 속성
  grade?: string;      // 선택적 속성 (물음표를 붙임)
  readonly id: string; // 읽기 전용 속성 (수정 불가)
}

// 인터페이스를 사용한 객체 생성
const student1: Student = {
  name: "박민수",
  age: 20,
  id: "2024001"
};

const student2: Student = {
  name: "최지은",
  age: 22,
  grade: "A+",
  id: "2024002"
};

// student1.id = "변경불가"; // 오류! readonly 속성은 수정 불가

// ============================================
// 5. 타입 별칭 (Type Alias)
// ============================================

// type: 타입에 이름을 붙이는 방법 (인터페이스와 유사)
type Product = {
  name: string;
  price: number;
  inStock: boolean;
};

const laptop: Product = {
  name: "맥북 프로",
  price: 2500000,
  inStock: true
};

// 유니온 타입: 여러 타입 중 하나가 될 수 있음
type Status = "pending" | "approved" | "rejected";
const orderStatus: Status = "pending";

// ============================================
// 6. 함수 (Functions)
// ============================================

// 함수의 매개변수와 반환 타입 지정
function add(a: number, b: number): number {
  return a + b;
}

// 화살표 함수 (Arrow Function)
const multiply = (a: number, b: number): number => {
  return a * b;
};

// 짧은 형태의 화살표 함수
const divide = (a: number, b: number): number => a / b;

// 반환값이 없는 함수 (void)
function printMessage(message: string): void {
  console.log(message);
}

// 선택적 매개변수 (물음표 사용)
function greet(name: string, title?: string): string {
  if (title) {
    return `안녕하세요, ${title} ${name}님!`;
  }
  return `안녕하세요, ${name}님!`;
}

// 기본 매개변수 (default parameter)
function createUser(name: string, age: number = 18): string {
  return `${name} (${age}세)`;
}

// ============================================
// 7. 제네릭 (Generics)
// ============================================

// 제네릭: 타입을 변수처럼 사용할 수 있게 해줌
// <T>는 "타입 매개변수"를 의미
function getFirstElement<T>(array: T[]): T | undefined {
  return array[0];
}

// 사용 예시
const firstNumber = getFirstElement([1, 2, 3]); // number 타입
const firstFruit = getFirstElement(["사과", "바나나"]); // string 타입

// ============================================
// 8. 열거형 (Enum)
// ============================================

// Enum: 연관된 상수들을 그룹화
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

const favoriteColor: Color = Color.Blue;

enum Direction {
  Up = 1,
  Down = 2,
  Left = 3,
  Right = 4
}

// ============================================
// 9. 클래스 (Classes)
// ============================================

// 클래스: 객체를 만드는 설계도
class Car {
  // 속성 (Properties)
  brand: string;
  model: string;
  private year: number; // private: 클래스 내부에서만 접근 가능

  // 생성자 (Constructor)
  constructor(brand: string, model: string, year: number) {
    this.brand = brand;
    this.model = model;
    this.year = year;
  }

  // 메서드 (Methods)
  getInfo(): string {
    return `${this.brand} ${this.model} (${this.year}년식)`;
  }

  // Getter: 속성처럼 접근할 수 있는 메서드
  get age(): number {
    return new Date().getFullYear() - this.year;
  }
}

// 클래스 인스턴스 생성
const myCar = new Car("현대", "아반떼", 2020);
console.log(myCar.getInfo()); // "현대 아반떼 (2020년식)"
console.log(myCar.age); // 차량 연식

// ============================================
// 10. 유용한 유틸리티 타입들
// ============================================

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Partial: 모든 속성을 선택적으로 만듦
type PartialUser = Partial<User>;
const updateUser: PartialUser = { name: "새 이름" }; // 일부만 제공해도 OK

// Pick: 특정 속성만 선택
type UserPreview = Pick<User, "name" | "email">;
const preview: UserPreview = {
  name: "김철수",
  email: "kim@example.com"
};

// Omit: 특정 속성을 제외
type UserWithoutEmail = Omit<User, "email">;

// Required: 모든 속성을 필수로 만듦
type RequiredUser = Required<PartialUser>;

// Readonly: 모든 속성을 읽기 전용으로 만듦
type ReadonlyUser = Readonly<User>;

// ============================================
// 11. 타입 가드 (Type Guards)
// ============================================

// typeof를 사용한 타입 체크
function processValue(value: string | number) {
  if (typeof value === "string") {
    // 이 블록 안에서 value는 string 타입
    return value.toUpperCase();
  } else {
    // 이 블록 안에서 value는 number 타입
    return value.toFixed(2);
  }
}

// ============================================
// 요약
// ============================================

/*
핵심 포인트:
1. 타입 명시로 코드의 안정성 향상
2. 인터페이스와 타입으로 복잡한 구조 정의
3. 제네릭으로 재사용 가능한 코드 작성
4. 클래스로 객체 지향 프로그래밍
5. 유틸리티 타입으로 편리한 타입 변환

다음 단계: 02-react-basics.tsx에서 React 기초를 배워보세요!
*/

export {};
