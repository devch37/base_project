/**
 * ============================================================================
 * 15. 데코레이터 (Decorators) — 레거시/실험적 데코레이터
 * ============================================================================
 *
 * 데코레이터 = 클래스/메서드/프로퍼티에 "@이름" 을 붙여 동작을 덧입히는 문법.
 * NestJS(@Controller, @Injectable, @Get), TypeORM(@Entity, @Column),
 * Angular 등이 모두 이 방식을 씁니다.
 *
 * ⚠️ 이 파일은 tsconfig의 "experimentalDecorators": true 가 필요합니다 (이미 설정됨).
 *    TS 5의 새 표준 데코레이터는 시그니처가 다릅니다(주석 하단 참고).
 *
 * 실행:  npx tsx src/3-advanced/15-decorators.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 클래스 데코레이터 — 클래스 자체를 인자로 받는다
// ----------------------------------------------------------------------------
// "이 클래스는 서비스다" 라고 표시(메타데이터)만 남기는 간단한 예
const SERVICE_REGISTRY = new Set<Function>();

function Service(target: Function): void {
  SERVICE_REGISTRY.add(target);
  console.log(`  [@Service] ${target.name} 등록됨`);
}

// ----------------------------------------------------------------------------
// 2) 데코레이터 팩토리 — 인자를 받는 데코레이터는 "함수를 반환하는 함수"
// ----------------------------------------------------------------------------
function Controller(basePath: string) {
  return function (target: Function): void {
    // 클래스에 정적 프로퍼티로 메타데이터를 심는다
    (target as any).basePath = basePath;
    console.log(`  [@Controller("${basePath}")] ${target.name}`);
  };
}

// ----------------------------------------------------------------------------
// 3) 메서드 데코레이터 — (target, 메서드명, descriptor) 를 받는다
// ----------------------------------------------------------------------------
// 실행 시간 로깅 데코레이터 (실무에서 자주 만드는 유틸)
function LogExecution(
  _target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const original = descriptor.value as (...args: unknown[]) => unknown;
  descriptor.value = function (...args: unknown[]) {
    const start = performance.now();
    const result = original.apply(this, args);
    const ms = (performance.now() - start).toFixed(2);
    console.log(`  [LogExecution] ${propertyKey}(${JSON.stringify(args)}) → ${ms}ms`);
    return result;
  };
}

// 접근 제어 데코레이터
function RequireRole(role: 'admin' | 'user') {
  return function (_target: object, propertyKey: string, descriptor: PropertyDescriptor): void {
    const original = descriptor.value as (...args: any[]) => any;
    descriptor.value = function (this: { currentRole?: string }, ...args: any[]) {
      if (this.currentRole !== role) {
        throw new Error(`권한 없음: ${propertyKey} 는 ${role} 전용`);
      }
      return original.apply(this, args);
    };
  };
}

// ----------------------------------------------------------------------------
// 4) 프로퍼티 데코레이터 — "메타데이터 수집 + 나중에 검증" 방식
// ----------------------------------------------------------------------------
// 참고: 최신 클래스 필드 문법(useDefineForClassFields)에서는 getter/setter 를
//       가로채는 옛 방식이 잘 동작하지 않습니다. 그래서 class-validator 같은
//       실무 라이브러리도 "데코레이터로 규칙만 기록해두고, validate()에서 검사"합니다.
type ValidationRule = { property: string; min: number };
const VALIDATION_RULES = new Map<Function, ValidationRule[]>();

function MinLength(min: number) {
  return function (target: object, propertyKey: string): void {
    const ctor = target.constructor;
    const rules = VALIDATION_RULES.get(ctor) ?? [];
    rules.push({ property: propertyKey, min });
    VALIDATION_RULES.set(ctor, rules);
  };
}

// 수집된 규칙으로 인스턴스를 검증하는 함수
function validate(instance: object): string[] {
  const rules = VALIDATION_RULES.get(instance.constructor) ?? [];
  const errors: string[] = [];
  for (const rule of rules) {
    const value = (instance as Record<string, unknown>)[rule.property];
    if (typeof value === 'string' && value.length < rule.min) {
      errors.push(`${rule.property} 는 최소 ${rule.min}자 이상이어야 합니다 (현재: "${value}")`);
    }
  }
  return errors;
}

// ----------------------------------------------------------------------------
// 실제 사용
// ----------------------------------------------------------------------------
console.log('--- 15. 데코레이터 ---');
console.log('클래스 정의 시점에 데코레이터가 실행됩니다:');

@Service
@Controller('/users')
class UserController {
  currentRole: 'admin' | 'user' = 'user';

  @LogExecution
  findAll(): string[] {
    return ['홍길동', '김철수'];
  }

  @RequireRole('admin')
  deleteUser(id: number): string {
    return `${id}번 사용자 삭제됨`;
  }
}

class SignupDto {
  @MinLength(4)
  username: string;

  @MinLength(8)
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}

console.log('\n실행 결과:');
const ctrl = new UserController();
console.log('  findAll() =', ctrl.findAll());
console.log('  UserController.basePath =', (UserController as any).basePath);
console.log('  SERVICE_REGISTRY 크기 =', SERVICE_REGISTRY.size);

try {
  ctrl.deleteUser(1); // currentRole 이 'user' 라서 실패
} catch (e) {
  console.log('  deleteUser 실패:', (e as Error).message);
}
ctrl.currentRole = 'admin';
console.log('  ' + ctrl.deleteUser(1)); // 이제 성공

const badDto = new SignupDto('ab', 'short');
console.log('  validate(badDto) =', validate(badDto));
const goodDto = new SignupDto('gildong', 'password123');
console.log('  validate(goodDto) =', validate(goodDto));

/**
 * ----------------------------------------------------------------------------
 * 참고: TS 5.0+ 표준(TC39) 데코레이터
 * ----------------------------------------------------------------------------
 * 시그니처가 (value, context) 형태로 완전히 바뀌었습니다.
 *
 *   function logged<T extends (...a: any[]) => any>(
 *     target: T,
 *     context: ClassMethodDecoratorContext,
 *   ) {
 *     return function (this: unknown, ...args: any[]) {
 *       console.log(`calling ${String(context.name)}`);
 *       return target.call(this, ...args);
 *     };
 *   }
 *
 * - experimentalDecorators 를 끄면 표준 데코레이터가 활성화됩니다.
 * - 아직 emitDecoratorMetadata(리플렉션) 대응이 없어, NestJS 등은 레거시를 유지 중입니다.
 * - 신규 프로젝트에서 프레임워크 의존이 없다면 표준 데코레이터를 권장.
 */

export {};
