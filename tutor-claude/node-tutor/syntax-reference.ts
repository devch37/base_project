/**
 * ============================================
 * NestJS & TypeScript 문법 완전 가이드
 * ============================================
 *
 * 이 파일은 NestJS 학습에 필요한 모든 문법을 정리한 참고 자료입니다.
 * 각 섹션별로 실행 가능한 예제와 상세한 설명을 포함합니다.
 */

// ============================================
// 1. TypeScript 기초 문법
// ============================================

/**
 * 1.1 기본 타입 (Primitive Types)
 * - TypeScript는 JavaScript에 정적 타입을 추가한 언어
 * - 컴파일 타임에 타입 에러를 잡아낼 수 있음
 */

// 문자열 (string)
const userName: string = "홍길동";
const message: string = `안녕하세요, ${userName}님`;  // 템플릿 리터럴

// 숫자 (number) - 정수와 실수 구분 없음
const age: number = 25;
const price: number = 19.99;
const hexValue: number = 0xf00d;  // 16진수도 가능

// 불리언 (boolean)
const isActive: boolean = true;
const isCompleted: boolean = false;

// null과 undefined
const emptyValue: null = null;
const notDefined: undefined = undefined;

/**
 * 1.2 배열 (Array)
 * - 동일한 타입의 요소들을 담는 자료구조
 */

// 배열 선언 방법 1: Type[]
const numbers: number[] = [1, 2, 3, 4, 5];
const fruits: string[] = ["apple", "banana", "orange"];

// 배열 선언 방법 2: Array<Type>
const scores: Array<number> = [90, 85, 95];

// 배열 메서드 활용
const doubled = numbers.map(n => n * 2);  // [2, 4, 6, 8, 10]
const filtered = numbers.filter(n => n > 3);  // [4, 5]
const sum = numbers.reduce((acc, n) => acc + n, 0);  // 15

/**
 * 1.3 객체 (Object) 타입
 * - 인터페이스 또는 타입 별칭으로 정의
 */

// 인터페이스 정의
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;  // ? = 선택적 속성 (Optional)
}

const user: User = {
  id: 1,
  name: "김철수",
  email: "kim@example.com"
  // age는 선택사항이므로 생략 가능
};

// 타입 별칭 (Type Alias)
type Point = {
  x: number;
  y: number;
};

const point: Point = { x: 10, y: 20 };

/**
 * 1.4 함수 타입
 * - 매개변수와 반환값의 타입 지정
 */

// 기본 함수
function add(a: number, b: number): number {
  return a + b;
}

// 화살표 함수 (Arrow Function)
const subtract = (a: number, b: number): number => {
  return a - b;
};

// 간결한 화살표 함수
const multiply = (a: number, b: number): number => a * b;

// 선택적 매개변수
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

// 기본 매개변수
function createUser(name: string, role: string = "user"): User {
  return { id: 1, name, email: `${name}@example.com` };
}

// Rest 매개변수 (나머지 매개변수)
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * 1.5 제네릭 (Generics)
 * - 재사용 가능한 컴포넌트를 만들 때 사용
 * - 타입을 매개변수처럼 사용
 */

// 제네릭 함수
function identity<T>(value: T): T {
  return value;
}

const num = identity<number>(42);  // T는 number
const str = identity<string>("hello");  // T는 string

// 제네릭 인터페이스
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const userResponse: ApiResponse<User> = {
  success: true,
  data: user
};

// 제네릭 클래스
class Box<T> {
  private content: T;

  constructor(content: T) {
    this.content = content;
  }

  getContent(): T {
    return this.content;
  }
}

const numberBox = new Box<number>(123);
const stringBox = new Box<string>("hello");

/**
 * 1.6 유니온과 인터섹션 타입
 */

// Union Type (OR) - 여러 타입 중 하나
type StringOrNumber = string | number;

function printId(id: StringOrNumber): void {
  console.log(`ID: ${id}`);
}

printId(101);  // OK
printId("ABC");  // OK

// Intersection Type (AND) - 모든 타입의 속성을 포함
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

const person: Person = {
  name: "이영희",
  age: 30
};

/**
 * 1.7 Enum (열거형)
 * - 관련된 상수들의 집합
 */

enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST"
}

function checkPermission(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * 1.8 Type Assertions (타입 단언)
 * - 컴파일러에게 타입을 알려줌
 */

const someValue: unknown = "this is a string";
const strLength: number = (someValue as string).length;

// ============================================
// 2. TypeScript 고급 기능
// ============================================

/**
 * 2.1 클래스 (Class)
 * - 객체지향 프로그래밍의 핵심
 */

class Animal {
  // 속성 (Properties)
  private name: string;  // private: 클래스 내부에서만 접근
  protected age: number;  // protected: 상속받은 클래스에서도 접근
  public species: string;  // public: 어디서나 접근 (기본값)

  // 생성자 (Constructor)
  constructor(name: string, age: number, species: string) {
    this.name = name;
    this.age = age;
    this.species = species;
  }

  // 메서드 (Methods)
  public makeSound(): string {
    return "Some generic sound";
  }

  // Getter
  public getName(): string {
    return this.name;
  }

  // Setter
  public setName(name: string): void {
    this.name = name;
  }
}

// 상속 (Inheritance)
class Dog extends Animal {
  private breed: string;

  constructor(name: string, age: number, breed: string) {
    super(name, age, "Dog");  // 부모 클래스 생성자 호출
    this.breed = breed;
  }

  // 메서드 오버라이딩 (Override)
  public makeSound(): string {
    return "멍멍!";
  }

  // 추가 메서드
  public getBreed(): string {
    return this.breed;
  }
}

// 간결한 생성자 문법 (Constructor Shorthand)
class Cat {
  constructor(
    private name: string,
    private age: number
  ) {
    // this.name과 this.age가 자동으로 생성됨
  }

  public meow(): string {
    return `${this.name}: 야옹!`;
  }
}

/**
 * 2.2 추상 클래스 (Abstract Class)
 * - 인스턴스화할 수 없는 기본 클래스
 * - 상속받는 클래스가 반드시 구현해야 할 메서드 정의
 */

abstract class Shape {
  constructor(protected color: string) {}

  // 추상 메서드 - 반드시 구현해야 함
  abstract calculateArea(): number;

  // 일반 메서드 - 기본 구현 제공
  public getColor(): string {
    return this.color;
  }
}

class Circle extends Shape {
  constructor(
    color: string,
    private radius: number
  ) {
    super(color);
  }

  // 추상 메서드 구현
  calculateArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

/**
 * 2.3 인터페이스 구현 (Interface Implementation)
 * - 클래스가 특정 구조를 따르도록 강제
 */

interface Flyable {
  fly(): void;
  altitude: number;
}

interface Swimmable {
  swim(): void;
}

// 여러 인터페이스 구현 가능
class Duck implements Flyable, Swimmable {
  altitude: number = 0;

  fly(): void {
    this.altitude += 10;
    console.log(`날고 있습니다. 고도: ${this.altitude}m`);
  }

  swim(): void {
    console.log("수영하고 있습니다.");
  }
}

/**
 * 2.4 Decorators (데코레이터)
 * - 클래스, 메서드, 속성, 매개변수에 메타데이터 추가
 * - NestJS의 핵심 기능!
 */

// 클래스 데코레이터
function Component(target: Function) {
  console.log(`Component created: ${target.name}`);
}

// 메서드 데코레이터
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`Result:`, result);
    return result;
  };

  return descriptor;
}

// 속성 데코레이터
function Required(target: any, propertyKey: string) {
  console.log(`${propertyKey} is required`);
}

// 매개변수 데코레이터
function Inject(target: any, propertyKey: string, parameterIndex: number) {
  console.log(`Injecting parameter at index ${parameterIndex}`);
}

@Component
class Calculator {
  @Required
  name: string = "Calculator";

  @Log
  add(@Inject a: number, b: number): number {
    return a + b;
  }
}

// ============================================
// 3. 비동기 프로그래밍 (Async Programming)
// ============================================

/**
 * 3.1 Promise
 * - 비동기 작업의 완료 또는 실패를 나타내는 객체
 */

// Promise 생성
function fetchUserData(userId: number): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId > 0) {
        resolve({
          id: userId,
          name: "사용자",
          email: "user@example.com"
        });
      } else {
        reject(new Error("Invalid user ID"));
      }
    }, 1000);
  });
}

// Promise 사용 - then/catch
fetchUserData(1)
  .then(user => {
    console.log("User:", user);
    return user.id;
  })
  .then(id => {
    console.log("User ID:", id);
  })
  .catch(error => {
    console.error("Error:", error.message);
  })
  .finally(() => {
    console.log("작업 완료");
  });

/**
 * 3.2 Async/Await
 * - Promise를 더 동기적으로 보이게 작성
 * - NestJS에서 가장 많이 사용하는 패턴
 */

async function getUserProfile(userId: number): Promise<void> {
  try {
    // await: Promise가 완료될 때까지 대기
    const user = await fetchUserData(userId);
    console.log("User:", user);

    // 순차 실행
    const posts = await fetchUserPosts(user.id);
    console.log("Posts:", posts);

  } catch (error) {
    console.error("Error:", error);
  }
}

// 여러 Promise 병렬 실행
async function fetchMultipleUsers(): Promise<void> {
  try {
    // Promise.all: 모든 Promise가 완료될 때까지 대기
    const users = await Promise.all([
      fetchUserData(1),
      fetchUserData(2),
      fetchUserData(3)
    ]);

    console.log("All users:", users);

  } catch (error) {
    // 하나라도 실패하면 catch
    console.error("Error:", error);
  }
}

// Promise.race: 가장 먼저 완료된 것만 반환
async function raceExample(): Promise<void> {
  const fastest = await Promise.race([
    fetchUserData(1),
    fetchUserData(2)
  ]);
  console.log("Fastest:", fastest);
}

/**
 * 3.3 실전 async/await 패턴
 */

// 에러 처리가 중요한 비동기 함수
async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("Operation failed:", error);
    return defaultValue;
  }
}

// 재시도 로직
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
      await delay(1000 * (i + 1));  // 지수 백오프
    }
  }

  throw lastError!;
}

// 유틸리티: delay 함수
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 4. ES6+ 모던 JavaScript 문법
// ============================================

/**
 * 4.1 구조 분해 할당 (Destructuring)
 */

// 객체 구조 분해
const userObj = { id: 1, name: "홍길동", email: "hong@example.com" };
const { id, name } = userObj;  // id와 name 변수 생성

// 별칭 사용
const { name: userName2, email: userEmail } = userObj;

// 기본값 설정
const { age: userAge = 25 } = userObj;

// 배열 구조 분해
const numbers2 = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers2;
// first = 1, second = 2, rest = [3, 4, 5]

/**
 * 4.2 스프레드 연산자 (Spread Operator)
 */

// 배열 복사 및 합치기
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];  // [1, 2, 3, 4, 5, 6]

// 객체 복사 및 병합
const baseUser = { name: "김철수", age: 30 };
const updatedUser = { ...baseUser, age: 31 };  // age만 변경

// 함수 인자로 펼치기
const nums = [1, 2, 3, 4, 5];
console.log(Math.max(...nums));  // 5

/**
 * 4.3 Rest 매개변수
 */

function logAll(...items: any[]): void {
  items.forEach(item => console.log(item));
}

logAll(1, "hello", true, { x: 10 });

/**
 * 4.4 Optional Chaining (?.)
 * - 중첩된 객체 속성에 안전하게 접근
 */

interface Post {
  id: number;
  author?: {
    name?: string;
    email?: string;
  };
}

const post: Post = { id: 1 };

// 기존 방식 (복잡함)
const authorName1 = post.author && post.author.name;

// Optional Chaining (간결함)
const authorName2 = post.author?.name;  // undefined if author is null/undefined

// 메서드 호출에도 사용 가능
const result = post.author?.getName?.();

/**
 * 4.5 Nullish Coalescing (??)
 * - null 또는 undefined일 때만 기본값 사용
 */

const value1 = null ?? "default";  // "default"
const value2 = undefined ?? "default";  // "default"
const value3 = 0 ?? "default";  // 0 (|| 연산자와 다른 점!)
const value4 = "" ?? "default";  // "" (빈 문자열은 falsy지만 null이 아님)

/**
 * 4.6 템플릿 리터럴 (Template Literals)
 */

const name2 = "이영희";
const age2 = 28;

// 문자열 보간
const intro = `안녕하세요, 제 이름은 ${name2}이고 ${age2}살입니다.`;

// 여러 줄 문자열
const multiLine = `
  첫 번째 줄
  두 번째 줄
  세 번째 줄
`;

// 표현식 사용
const mathResult = `2 + 2 = ${2 + 2}`;

/**
 * 4.7 객체 속성 축약 (Property Shorthand)
 */

const name3 = "박민수";
const age3 = 35;

// 기존 방식
const user1 = { name: name3, age: age3 };

// 축약 문법
const user2 = { name3, age3 };  // 변수명과 속성명이 같으면 생략 가능

/**
 * 4.8 계산된 속성명 (Computed Property Names)
 */

const dynamicKey = "email";
const user3 = {
  name: "홍길동",
  [dynamicKey]: "hong@example.com"  // 동적으로 속성명 지정
};

// ============================================
// 5. Node.js 핵심 개념
// ============================================

/**
 * 5.1 모듈 시스템 (CommonJS)
 * - require/module.exports 방식
 */

// 모듈 내보내기 (export)
// --- user.service.ts ---
class UserService {
  getUser(id: number) {
    return { id, name: "User" };
  }
}
// module.exports = UserService;  // CommonJS
// export default UserService;    // ES6 (TypeScript에서 권장)

// 모듈 가져오기 (import)
// const UserService = require('./user.service');  // CommonJS
// import UserService from './user.service';       // ES6

/**
 * 5.2 ES6 모듈 (ESM)
 * - import/export 방식 (TypeScript 권장)
 */

// Named Export (여러 개 내보내기)
// export class UserService { }
// export function getUser() { }
// export const API_URL = "http://api.example.com";

// Named Import
// import { UserService, getUser } from './module';

// Default Export (하나만 내보내기)
// export default UserService;

// Default Import
// import UserService from './module';

// 전체 import
// import * as UserModule from './module';

/**
 * 5.3 환경 변수 (Environment Variables)
 */

// process.env를 통해 접근
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || "development";
const databaseUrl = process.env.DATABASE_URL;

// 타입 안전한 환경 변수
interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
}

function getEnvConfig(): EnvConfig {
  return {
    PORT: parseInt(process.env.PORT || "3000", 10),
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
    DATABASE_URL: process.env.DATABASE_URL || ""
  };
}

// ============================================
// 6. NestJS 핵심 데코레이터
// ============================================

/**
 * 6.1 클래스 데코레이터
 */

// @Module(): 모듈 정의
// @Module({
//   imports: [OtherModule],
//   controllers: [AppController],
//   providers: [AppService],
//   exports: [AppService]
// })
// class AppModule {}

// @Controller(): 컨트롤러 정의
// @Controller('users')  // /users 경로
// class UsersController {}

// @Injectable(): 의존성 주입 가능한 클래스
// @Injectable()
// class UsersService {}

/**
 * 6.2 메서드 데코레이터 (HTTP 메서드)
 */

// @Get(), @Post(), @Put(), @Patch(), @Delete()
// @Controller('posts')
// class PostsController {
//   @Get()  // GET /posts
//   findAll() {}
//
//   @Get(':id')  // GET /posts/123
//   findOne(@Param('id') id: string) {}
//
//   @Post()  // POST /posts
//   create(@Body() createDto: CreatePostDto) {}
//
//   @Put(':id')  // PUT /posts/123
//   update(@Param('id') id: string, @Body() updateDto: UpdatePostDto) {}
//
//   @Delete(':id')  // DELETE /posts/123
//   remove(@Param('id') id: string) {}
// }

/**
 * 6.3 매개변수 데코레이터
 */

// @Param(): URL 파라미터 추출
// @Get(':id/:slug')
// findPost(@Param() params: any) {}
// findPost(@Param('id') id: string) {}

// @Body(): 요청 본문 추출
// @Post()
// create(@Body() createDto: any) {}

// @Query(): 쿼리 파라미터 추출
// @Get()
// search(@Query('keyword') keyword: string) {}
// search(@Query() query: any) {}

// @Headers(): HTTP 헤더 추출
// @Get()
// getUser(@Headers('authorization') auth: string) {}

// @Req(), @Res(): Request, Response 객체
// @Get()
// handle(@Req() request: Request, @Res() response: Response) {}

/**
 * 6.4 기타 유용한 데코레이터
 */

// @HttpCode(): HTTP 상태 코드 설정
// @Post()
// @HttpCode(201)
// create() {}

// @Header(): 응답 헤더 설정
// @Get()
// @Header('Cache-Control', 'no-cache')
// getData() {}

// @Redirect(): 리다이렉트
// @Get()
// @Redirect('https://example.com', 301)
// redirect() {}

// ============================================
// 7. 유틸리티 타입 (Utility Types)
// ============================================

/**
 * TypeScript에서 제공하는 유용한 타입 조작 도구
 */

interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

// Partial<T>: 모든 속성을 선택적으로
type PartialTodo = Partial<Todo>;
// { id?: number; title?: string; ... }

// Required<T>: 모든 속성을 필수로
type RequiredTodo = Required<PartialTodo>;

// Readonly<T>: 모든 속성을 읽기 전용으로
type ReadonlyTodo = Readonly<Todo>;

// Pick<T, K>: 특정 속성만 선택
type TodoPreview = Pick<Todo, 'id' | 'title'>;
// { id: number; title: string; }

// Omit<T, K>: 특정 속성 제외
type TodoWithoutId = Omit<Todo, 'id'>;
// { title: string; description: string; completed: boolean; }

// Record<K, T>: 키-값 쌍의 타입
type UserRoles = Record<string, string>;
// { [key: string]: string; }

// ReturnType<T>: 함수의 반환 타입 추출
function createUser2() {
  return { id: 1, name: "User" };
}
type User2 = ReturnType<typeof createUser2>;
// { id: number; name: string; }

// ============================================
// 8. 실전 패턴 예제
// ============================================

/**
 * 8.1 Repository 패턴 인터페이스
 */

interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

/**
 * 8.2 Result 패턴 (에러 처리)
 */

type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUserSafely(id: number): Promise<Result<User>> {
  try {
    const user = await fetchUserData(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// 사용 예
async function handleUser() {
  const result = await fetchUserSafely(1);

  if (result.success) {
    console.log("User:", result.data);
  } else {
    console.error("Error:", result.error.message);
  }
}

/**
 * 8.3 Builder 패턴
 */

class QueryBuilder {
  private query: string = "";
  private params: any[] = [];

  select(fields: string[]): this {
    this.query += `SELECT ${fields.join(', ')} `;
    return this;
  }

  from(table: string): this {
    this.query += `FROM ${table} `;
    return this;
  }

  where(condition: string, value: any): this {
    this.query += `WHERE ${condition} `;
    this.params.push(value);
    return this;
  }

  build(): { query: string; params: any[] } {
    return { query: this.query, params: this.params };
  }
}

// 사용
const { query, params } = new QueryBuilder()
  .select(['id', 'name'])
  .from('users')
  .where('age > ?', 18)
  .build();

/**
 * 8.4 Type Guard (타입 가드)
 */

// 타입 좁히기
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function processValue(value: string | number) {
  if (isString(value)) {
    // 여기서 value는 string으로 추론됨
    console.log(value.toUpperCase());
  } else {
    // 여기서 value는 number로 추론됨
    console.log(value.toFixed(2));
  }
}

// ============================================
// 9. 헬퍼 함수 모음
// ============================================

// 실무에서 자주 사용하는 유틸리티 함수들

// Mock 함수들 (실제로는 데이터베이스나 API 호출)
function fetchUserPosts(userId: number): Promise<any[]> {
  return Promise.resolve([
    { id: 1, title: "Post 1", userId },
    { id: 2, title: "Post 2", userId }
  ]);
}

/**
 * 안전한 JSON 파싱
 */
function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Debounce (디바운스)
 * - 연속된 호출을 하나로 그룹화
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle (쓰로틀)
 * - 일정 시간 동안 최대 한 번만 실행
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 깊은 복사 (Deep Clone)
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 배열 청크 (Chunk)
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 고유 값 추출 (Unique)
 */
function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * 객체에서 특정 키 제거
 */
function omitKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

/**
 * 객체에서 특정 키만 선택
 */
function pickKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

// ============================================
// 10. 실전 예제: NestJS 서비스 클래스
// ============================================

/**
 * 실제 NestJS 서비스처럼 작성된 예제
 */

// DTO (Data Transfer Object)
class CreateUserDto {
  name: string;
  email: string;
  age?: number;
}

class UpdateUserDto {
  name?: string;
  email?: string;
  age?: number;
}

// Entity
class UserEntity {
  id: number;
  name: string;
  email: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Service
class UsersServiceExample {
  private users: UserEntity[] = [];
  private currentId: number = 1;

  /**
   * 모든 사용자 조회
   */
  async findAll(): Promise<UserEntity[]> {
    return this.users;
  }

  /**
   * 특정 사용자 조회
   */
  async findOne(id: number): Promise<UserEntity> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * 사용자 생성
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const newUser: UserEntity = {
      id: this.currentId++,
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(newUser);
    return newUser;
  }

  /**
   * 사용자 수정
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto, {
      updatedAt: new Date()
    });

    return user;
  }

  /**
   * 사용자 삭제
   */
  async remove(id: number): Promise<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found`);
    }

    this.users.splice(index, 1);
  }

  /**
   * 이메일로 사용자 검색
   */
  async findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.users.find(u => u.email === email);
  }

  /**
   * 페이지네이션
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: UserEntity[]; total: number; page: number; limit: number }> {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      data: this.users.slice(startIndex, endIndex),
      total: this.users.length,
      page,
      limit
    };
  }
}

// ============================================
// 마치며
// ============================================

/**
 * 이 파일은 NestJS 학습에 필요한 모든 TypeScript와 Node.js 문법을 다룹니다.
 *
 * 다음 단계:
 * 1. 이 파일을 천천히 읽으며 각 개념 이해하기
 * 2. 코드를 직접 타이핑해보며 익숙해지기
 * 3. 1-basic/ 폴더부터 실제 NestJS 예제 학습 시작
 *
 * 막히는 부분이 있다면:
 * - 이 파일로 돌아와서 해당 문법 확인
 * - TypeScript 공식 문서 참고
 * - NestJS 공식 문서 참고
 *
 * 행운을 빕니다! 🚀
 */

export {};  // 이 파일을 모듈로 만들기 위한 export
