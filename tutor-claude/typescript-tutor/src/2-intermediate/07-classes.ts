/**
 * ============================================================================
 * 07. 클래스 (Classes)
 * ============================================================================
 *
 * TypeScript 클래스는 JS 클래스에 "접근 제어자"와 "타입"을 더한 것입니다.
 * 백엔드(NestJS 등)에서 서비스/엔티티를 만들 때 많이 씁니다.
 *
 * 실행:  npx tsx src/2-intermediate/07-classes.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 기본 클래스 + 접근 제어자
// ----------------------------------------------------------------------------
class BankAccount {
  //  public    : 어디서나 접근 (기본값)
  //  private   : 클래스 내부에서만 접근
  //  protected : 클래스 내부 + 자식 클래스에서 접근
  //  readonly  : 생성자에서 한 번만 할당 가능

  public readonly owner: string;
  private balance: number;
  protected bankName = 'TS Bank';

  constructor(owner: string, initialBalance: number) {
    this.owner = owner;
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('입금액은 0보다 커야 합니다');
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error('잔액 부족');
    this.balance -= amount;
  }

  // getter — 프로퍼티처럼 접근되지만 계산/보호가 가능
  get currentBalance(): number {
    return this.balance;
  }
}

// ----------------------------------------------------------------------------
// 2) 파라미터 프로퍼티 (Parameter Properties) — 보일러플레이트 제거
// ----------------------------------------------------------------------------
// 생성자 매개변수 앞에 접근 제어자를 붙이면
// "필드 선언 + this 할당"을 자동으로 해준다. (실무에서 자주 사용)
class Point {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  distanceTo(other: Point): number {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}
// 위 Point는 아래 장황한 코드와 동일하다:
//   class Point {
//     public readonly x: number;
//     public readonly y: number;
//     constructor(x: number, y: number) { this.x = x; this.y = y; }
//   }

// ----------------------------------------------------------------------------
// 3) 추상 클래스 (abstract) — 직접 인스턴스화 불가, 상속 전용 뼈대
// ----------------------------------------------------------------------------
abstract class Shape {
  abstract area(): number; // 구현 없음 → 자식이 반드시 구현해야 함

  // 구현이 있는 메서드도 가질 수 있음
  describe(): string {
    return `이 도형의 넓이는 ${this.area().toFixed(2)} 입니다.`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  // override → 부모에 실제로 존재하는 멤버를 재정의함을 명시 (오타 방지)
  override area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(
    private width: number,
    private height: number,
  ) {
    super();
  }
  override area(): number {
    return this.width * this.height;
  }
}

// ----------------------------------------------------------------------------
// 4) implements — 클래스가 특정 인터페이스 "계약"을 지키도록 강제
// ----------------------------------------------------------------------------
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[Console] ${message}`);
  }
}

class PrefixLogger implements Logger {
  constructor(private prefix: string) {}
  log(message: string): void {
    console.log(`[${this.prefix}] ${message}`);
  }
}

// 인터페이스에 의존하면 구현체를 자유롭게 교체할 수 있다 (의존성 역전)
function runJob(logger: Logger): void {
  logger.log('작업 시작');
  logger.log('작업 완료');
}

// ----------------------------------------------------------------------------
// 5) static 멤버 — 인스턴스가 아니라 클래스 자체에 속함
// ----------------------------------------------------------------------------
class IdGenerator {
  private static counter = 0;
  static next(): number {
    return ++IdGenerator.counter;
  }
}

// ----------------------------------------------------------------------------
// 6) # 프라이빗 필드 (JS 표준) vs private (TS 전용)
// ----------------------------------------------------------------------------
// private 는 컴파일 후 사라지는 "타입 레벨" 보호 → 런타임엔 접근 가능.
// #field 는 런타임에도 진짜 캡슐화됨. 새 코드는 # 사용을 권장.
class Secret {
  #token = 'super-secret';
  reveal(): string {
    return this.#token;
  }
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 07. 클래스 ---');
const acc = new BankAccount('홍길동', 10000);
acc.deposit(5000);
acc.withdraw(3000);
console.log(`${acc.owner}님 잔액:`, acc.currentBalance);

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
console.log('두 점 사이 거리 =', p1.distanceTo(p2));

const shapes: Shape[] = [new Circle(2), new Rectangle(3, 4)];
shapes.forEach((s) => console.log(s.describe()));

runJob(new ConsoleLogger());
runJob(new PrefixLogger('JOB'));

console.log('IdGenerator:', IdGenerator.next(), IdGenerator.next(), IdGenerator.next());
console.log('Secret.reveal() =', new Secret().reveal());

export {};
