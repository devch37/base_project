/**
 * ============================================================================
 * 03. 객체와 인터페이스 (Objects & Interfaces)
 * ============================================================================
 *
 * 객체의 "모양(shape)"을 정의하는 방법을 배웁니다.
 * 두 가지 도구가 있습니다: `interface` 와 `type`.
 * (둘의 차이는 2단계 06번 레슨에서 자세히 다룹니다. 여기서는 interface 위주)
 *
 * 실행:  npx tsx src/1-basic/03-objects-and-interfaces.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 인라인 객체 타입
// ----------------------------------------------------------------------------
// 매개변수 자리에 바로 객체 모양을 적을 수 있음
function printPoint(p: { x: number; y: number }): void {
  console.log(`(${p.x}, ${p.y})`);
}

// ----------------------------------------------------------------------------
// 2) interface 로 이름 붙이기 (재사용 가능)
// ----------------------------------------------------------------------------
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;          // ? → 옵셔널 프로퍼티 (없어도 됨, 타입은 number | undefined)
  readonly createdAt: Date; // readonly → 최초 할당 후 변경 불가
}

const user: User = {
  id: 1,
  name: '홍길동',
  email: 'gildong@example.com',
  createdAt: new Date(),
  // age 는 옵셔널이라 생략 가능
};

// user.createdAt = new Date(); // ❌ readonly 라서 재할당 불가
user.name = '이름 변경'; // ✅ 일반 프로퍼티는 변경 가능

// ----------------------------------------------------------------------------
// 3) 중첩 객체 / 객체 안의 객체
// ----------------------------------------------------------------------------
interface Company {
  name: string;
  address: {
    city: string;
    zipCode: string;
  };
  employees: User[]; // User 객체들의 배열
}

// ----------------------------------------------------------------------------
// 4) 인터페이스 확장 (extends)
// ----------------------------------------------------------------------------
interface Admin extends User {
  role: 'admin' | 'superadmin';
  permissions: string[];
}

const admin: Admin = {
  id: 2,
  name: '관리자',
  email: 'admin@example.com',
  createdAt: new Date(),
  role: 'admin',
  permissions: ['read', 'write', 'delete'],
};

// ----------------------------------------------------------------------------
// 5) 인덱스 시그니처 (동적인 키를 가진 객체)
// ----------------------------------------------------------------------------
// "키는 string, 값은 number 인 아무 키나 허용"
interface ScoreBoard {
  [playerName: string]: number;
}
const scores: ScoreBoard = {
  철수: 90,
  영희: 85,
};
scores['민수'] = 100; // 새로운 키 추가 OK

// ----------------------------------------------------------------------------
// 6) 함수/메서드를 포함한 인터페이스
// ----------------------------------------------------------------------------
interface Repository<T> {
  findById(id: number): T | undefined;
  save(entity: T): void;
  // 화살표 형태로도 표현 가능 (아래는 위 findById 와 동일한 의미)
  // findById: (id: number) => T | undefined;
}

// ----------------------------------------------------------------------------
// 7) 초과 프로퍼티 검사 (excess property check)
// ----------------------------------------------------------------------------
// 객체 리터럴을 "직접" 대입할 때는 정의에 없는 프로퍼티가 있으면 에러가 남.
// const u2: User = { id: 3, name: 'x', email: 'e', createdAt: new Date(), nickname: 'oops' };
//                                                                       ^^^^ ❌ User에 없는 속성
// → 실무에서 오타를 잡아주는 유용한 기능입니다.

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 03. 객체와 인터페이스 ---');
printPoint({ x: 3, y: 4 });
console.log('user =', user);
console.log('admin =', admin);
console.log('scores =', scores);

// 간단한 인메모리 Repository 구현 예시 (클로저로 저장소를 숨김)
function createUserRepository(): Repository<User> {
  const store = new Map<number, User>();
  return {
    findById: (id) => store.get(id),
    save: (entity) => {
      store.set(entity.id, entity);
    },
  };
}

const userRepo = createUserRepository();
userRepo.save(user);
console.log('userRepo.findById(1) =', userRepo.findById(1)?.name);

export {};
