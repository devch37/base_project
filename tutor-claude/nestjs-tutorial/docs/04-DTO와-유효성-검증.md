# 04. DTO와 유효성 검증

## DTO란?

**DTO (Data Transfer Object)** = "이 요청/응답의 데이터 모양"을 정의한 클래스.

- 왜 `interface` 가 아니라 `class`? → 인터페이스는 컴파일되면 사라져서 런타임 검증이 불가능.
  클래스는 런타임에 남아 있어 `class-validator` 데코레이터를 붙일 수 있습니다.

`src/modules/users/dto/create-user.dto.ts`:

```ts
export class CreateUserDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '비밀번호는 영문과 숫자를 모두 포함해야 합니다.',
  })
  password: string;
}
```

---

## 검증이 실제로 도는 과정

1. `main.ts` 에서 전역 `ValidationPipe` 등록
2. 컨트롤러가 `@Body() dto: CreateUserDto` 로 받음
3. `ValidationPipe` 가:
   - 들어온 JSON을 `CreateUserDto` 인스턴스로 변환 (`class-transformer`)
   - 데코레이터 규칙을 실행 (`class-validator`)
   - 실패하면 `400 Bad Request` + 메시지 배열 반환 (컨트롤러 코드는 실행 안 됨)

실제 응답 (프로젝트에서 확인됨):
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "올바른 이메일 형식이 아닙니다.",
    "nickname must be longer than or equal to 2 characters",
    "비밀번호는 8자 이상이어야 합니다."
  ]
}
```

---

## ValidationPipe 옵션 (main.ts)

| 옵션 | 효과 | 왜 필요한가 |
|------|------|-------------|
| `whitelist: true` | DTO에 없는 속성을 **자동 제거** | 클라이언트가 `isAdmin: true` 를 몰래 끼워 넣어도 무시됨 |
| `forbidNonWhitelisted: true` | 없는 속성이 오면 **400** | 오타(`emial`)를 조용히 넘기지 않고 알려줌 |
| `transform: true` | 평범한 객체 → DTO 클래스 인스턴스 | `@Type(() => Number)` 등이 동작하려면 필수 |
| `transformOptions.enableImplicitConversion: true` | `"3"` → `3`, `"true"` → `true` 자동 | 쿼리스트링은 전부 문자열이므로 |

---

## 타입 변환 — `class-transformer`

쿼리스트링은 항상 문자열입니다. `src/common/dto/pagination-query.dto.ts`:

```ts
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)   // ← "2" 를 숫자 2로 변환
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)             // ← limit=99999 로 DB 괴롭히는 것 방지
  limit: number = 20;

  get skip(): number {  // DTO에 헬퍼 메서드도 둘 수 있음
    return (this.page - 1) * this.limit;
  }
}
```

---

## DTO 재사용 — Mapped Types

같은 필드를 여러 번 쓰지 마세요. `@nestjs/swagger` (또는 `@nestjs/mapped-types`)가 제공:

| 유틸 | 효과 | 사용처 |
|------|------|--------|
| `PartialType(X)` | X의 모든 필드를 옵셔널로 | PATCH 요청 DTO |
| `PickType(X, ['a','b'])` | X에서 a, b만 |  |
| `OmitType(X, ['password'])` | X에서 password 제외 |  |
| `IntersectionType(A, B)` | A + B 합침 |  |

`src/modules/posts/dto/update-post.dto.ts`:
```ts
export class UpdatePostDto extends PartialType(CreatePostDto) {}
// CreatePostDto의 검증 규칙을 그대로 상속하되 전부 옵셔널
```

`src/modules/users/dto/update-user.dto.ts`:
```ts
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {}  // 이메일/비번은 별도 플로우로만 변경 가능
```

`src/modules/posts/dto/query-posts.dto.ts` 는 `PaginationQueryDto` 를 상속해서
공통 페이지네이션 + 게시글 전용 필터(search, tag, authorId)를 더합니다.

---

## 중첩 객체 / 배열 검증

```ts
class AddressDto {
  @IsString() city: string;
}

class CreateOrderDto {
  @ValidateNested()          // 중첩 객체도 검증하라
  @Type(() => AddressDto)    // 어떤 클래스인지 알려줘야 함
  address: AddressDto;

  @IsArray()
  @IsString({ each: true })  // 배열의 "각" 원소를 검증
  @ArrayMaxSize(10)
  tags: string[];
}
```

`create-post.dto.ts` 의 `tags?: string[]` 가 `@IsString({ each: true })` + `@ArrayMaxSize(10)` 예시입니다.

---

## 응답 직렬화 — 민감 정보 숨기기

입력만큼 출력도 중요합니다. `user.entity.ts`:

```ts
@Exclude()                        // 직렬화 시 이 필드 제외
@Column({ select: false })        // DB 조회 시에도 기본 제외
password: string;
```

컨트롤러에 `@UseInterceptors(ClassSerializerInterceptor)` 를 붙이면 `@Exclude()` 가 적용됩니다
(`users.controller.ts` 참고). 이중 방어:
1. `select: false` → 아예 DB에서 안 가져옴
2. `@Exclude()` → 혹시 가져와도 JSON에서 빠짐

---

## 실습

1. `create-comment.dto.ts` 에 `@IsNotEmpty()` 를 추가하고, 공백만 있는 댓글(`"   "`)이
   거부되는지 확인하세요. (힌트: `@Transform(({ value }) => value?.trim())` 조합)
2. 커스텀 검증 데코레이터 `@IsStrongPassword()` 를 만들어 `create-user.dto.ts` 의
   `@Matches` 를 대체해 보세요. (`registerDecorator` 사용)

→ 다음: [05. 데이터베이스와 TypeORM](./05-데이터베이스-TypeORM.md)
