# 연습문제 (Exercises)

각 단계 레슨을 읽은 뒤 풀어 보세요. 정답 파일은 없습니다 —
`npm run typecheck` 가 통과하고, `npx tsx` 로 실행했을 때 의도대로 동작하면 정답입니다.

풀이용 파일을 만들어서 연습하세요:

```bash
# 예시
npx tsx exercises/my-solution.ts
```

---

## 1단계 (Basic)

1. **타입 표기**: `이름(string)`, `나이(number)`, `취미 목록(string 배열)` 을 담는
   변수 3개를 타입 표기와 함께 선언하라.
2. **함수**: 숫자 배열을 받아 평균을 반환하는 `average(nums: number[]): number` 를 작성하라.
   빈 배열이면 `0` 을 반환할 것.
3. **좁히기**: `string | string[]` 를 받아 항상 배열로 변환하는 `toArray` 를 작성하라.
4. **판별 유니온 맛보기**: `{ type: 'circle'; radius: number } | { type: 'square'; side: number }`
   를 받아 넓이를 반환하는 함수를 작성하라.

## 2단계 (Intermediate)

5. **제네릭**: 배열과 개수 `n` 을 받아 앞에서 `n` 개를 꺼낸 새 배열을 반환하는
   `take<T>(arr: T[], n: number): T[]` 를 작성하라.
6. **keyof**: 객체 배열과 키를 받아 그 키 기준으로 정렬하는
   `sortBy<T, K extends keyof T>(items: T[], key: K): T[]` 를 작성하라.
7. **타입 가드**: `unknown` 을 받아 "문자열 배열인지" 판별하는
   `isStringArray(x: unknown): x is string[]` 를 작성하라.
8. **클래스**: `Stack<T>` 를 확장해 `최대 크기` 를 갖는 `BoundedStack<T>` 를 만들어라.
   가득 차면 `push` 시 예외를 던질 것.

## 3단계 (Advanced)

9. **유틸리티 타입 재구현**: `MyPick<T, K extends keyof T>` 를 매핑된 타입으로 직접 구현하라.
10. **조건부 타입**: 함수 타입에서 "마지막 매개변수 타입" 을 뽑는 `LastParam<T>` 를 작성하라.
11. **키 리매핑**: 객체 타입 `T` 의 모든 `boolean` 값 프로퍼티만 남기는 `BooleanKeys<T>` 를 작성하라.
12. **템플릿 리터럴**: `'user.name.first'` 같은 점 경로 문자열을 받아
    유니온 `'user' | 'name' | 'first'` 로 분해하는 `Split<S, '.'>` 를 작성하라.

## 4단계 (Practical)

13. **Result**: 17번의 `Result` 를 이용해, 두 개의 `Result` 를 받아 둘 다 성공이면
    `[T1, T2]` 를, 하나라도 실패면 첫 실패를 반환하는 `combine` 을 작성하라.
14. **검증기**: 18번의 미니 검증 라이브러리에 `v.literal('admin' | ...)` 와
    `v.union(a, b)` 조합기를 추가하라.
15. **미니 프로젝트 확장**: 19번 `TaskService` 에 `assignTo(taskId, user)` 메서드와
    `TaskAssigned` 이벤트를 추가하라. 이미 done/archived 인 작업에는 배정 불가.

---

## 힌트

- 막히면 해당 레슨 파일의 같은 패턴을 찾아 복사해서 변형하세요.
- 타입 에러 메시지는 아래에서 위로 읽으면 원인이 보입니다.
- `tsc --noEmit --watch` 를 켜두면 저장할 때마다 타입 검사가 돌아 편합니다.
