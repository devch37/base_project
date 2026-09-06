# 08. 동적 메모리 (malloc / free)

> 목표: 힙이 무엇인지, `malloc/calloc/realloc/free` 의 정확한 계약,
> **소유권(ownership)** 규칙, 그리고 4대 메모리 버그와 도구로 잡는 법.

---

## 0. 초등학생 버전 비유

스택은 **학교 사물함** — 자동 배정, 하교하면 자동 반납, 크기 제한.
힙은 **셀프 창고** — 필요할 때 원하는 크기로 빌리고(`malloc`), **다 쓰면 직접 반납해야**(`free`) 합니다.

셀프 창고의 규칙:
- 반납 안 하면 계속 요금이 나갑니다 (메모리 누수).
- 반납한 창고에 다시 들어가면 안 됩니다 (use-after-free).
- 같은 창고를 두 번 반납하려 하면 관리소가 화냅니다 (double free).
- **"이 창고는 누가 반납할 책임이 있나?"** 를 항상 명확히 해야 합니다 (소유권).

---

## 1. 네 개의 함수

```c
#include <stdlib.h>

void *malloc(size_t size);
//  size 바이트를 확보. 내용은 초기화 안 됨(쓰레기). 실패 시 NULL.

void *calloc(size_t n, size_t size);
//  n * size 바이트를 확보하고 0으로 채움. n*size 오버플로우를 내부에서 검사(안전).

void *realloc(void *p, size_t new_size);
//  p 블록을 new_size 로 조정. 내용 보존. 옮겨질 수 있어 "새 주소"를 반환.
//  실패 시 NULL 반환하고 "원본 p 는 그대로 유효". → 아래 함정 참고.

void free(void *p);
//  p 블록을 반납. p 가 NULL 이면 아무것도 안 함(안전).
//  free 후 p 는 dangling. 재사용 금지.
```

### 표준 사용 패턴

```c
int *arr = malloc(n * sizeof *arr);   // sizeof *arr : 타입이 바뀌어도 안전. 캐스트 안 함
if (arr == NULL) { /* 실패 처리 */ return -1; }

/* ... 사용 ... */

free(arr);
arr = NULL;                            // dangling 방지 습관
```

- `malloc(n * sizeof *arr)` 에서 `n` 이 크면 **곱셈 오버플로우**가 날 수 있습니다.
  개수가 외부 입력이면 `calloc(n, sizeof *arr)` 를 쓰거나 직접 검사하세요 (20장).

### realloc 함정

```c
p = realloc(p, bigger);       // 나쁨! 실패하면 p 가 NULL 이 되어 원본 블록을 잃음 → 누수
// 좋음:
void *tmp = realloc(p, bigger);
if (!tmp) { /* p 는 아직 유효. 정리 후 실패 반환 */ return -1; }
p = tmp;
```

`./bin/08_dynamic_array` 가 `realloc` 으로 자라는 배열을 올바르게 구현합니다.

---

## 2. 힙은 어떻게 동작하나 (개념)

- `malloc` 은 OS에서 큰 덩어리(`brk`/`mmap`)를 받아 **할당자(allocator)** 가 잘게 쪼개 나눠 줍니다.
- 각 블록 앞뒤에 **메타데이터**(크기, 상태)가 숨어 있습니다. 그래서 경계를 넘어 쓰면
  이 메타데이터가 깨져 다음 `malloc/free` 가 이상해집니다 ("힙 오염").
- `free` 는 블록을 "빈 목록"에 돌려놓습니다. 인접한 빈 블록과 합칩니다(coalescing).
- 할당/해제를 반복하면 **단편화(fragmentation)** — 총 여유는 있는데 연속 공간이 없어 실패.
- 그래서 **스택보다 느립니다**. 성능이 중요하면 재사용/풀링/arena 를 씁니다 (19장 arena).

---

## 3. 소유권(ownership) — C에서 가장 중요한 "비공식 규칙"

C에는 소유권을 강제하는 문법이 없습니다. **주석과 명명 규칙으로 약속**합니다.

```c
/* 반환값은 호출자가 소유한다. 다 쓰면 free() 해야 한다. */
char *str_dup(const char *s);

/* out 에 새 버퍼를 넣어 준다. 성공 시 호출자가 *out 을 free 해야 한다. */
int read_file(const char *path, char **out, size_t *out_len);

/* 이 함수는 node 를 소유한다(리스트에 편입). 호출자는 이후 node 를 건드리지 마라. */
void list_push(List *lst, Node *node);

/* borrowed: 이 포인터는 잠깐 빌려 쓰는 것. free 하지 마라. 수명은 lst 에 달림. */
const char *list_get(const List *lst, size_t i);
```

**실무 3원칙**:
1. `malloc` 을 보면 즉시 "짝이 되는 `free` 는 어디?"를 찾아라. 없으면 버그.
2. 함수가 메모리를 반환하면 문서에 "누가 free 하는가"를 반드시 적어라.
3. 한 레이어에서 할당하고 다른 레이어에서 해제하는 설계를 피하라. 짝을 가깝게.

---

## 4. 4대 메모리 버그 (전부 `08_bugs.c` 에서 재현)

| 버그 | 코드 | ASan 메시지 | 결과 |
|---|---|---|---|
| **누수 (leak)** | `malloc` 하고 `free` 안 함 | `Direct leak of N byte(s)` | 장시간 실행 시 메모리 고갈 |
| **use-after-free** | `free(p); use(p);` | `heap-use-after-free` | 조용한 오염 → 나중에 크래시 |
| **double free** | `free(p); free(p);` | `attempting double-free` | 힙 오염, 보안 취약점 |
| **초기화 안 함** | `malloc` 후 읽기 | (Valgrind) `uninitialised value` | 비결정적 동작 |

```bash
make asan NAME=08_bugs      # use-after-free / double free 등을 잡음
# 누수(leak)는:
#   Linux  : 위 asan 이 자동으로 잡음
#   macOS  : make leaks NAME=08_bugs   (LeakSanitizer 미지원 → Xcode leaks 도구)
```
`08_bugs.c` 안의 `#define BUG 0` 을 1~4로 바꿔 각 버그를 하나씩 켜세요.

### free 후 NULL 대입이 왜 도움이 되나

```c
free(p);
p = NULL;
/* ... 나중에 ... */
free(p);      // free(NULL) 은 안전 → double free 가 무해해짐
*p = 1;       // NULL 역참조 → 즉시 크래시 (조용한 오염보다 100배 낫다)
```

---

## 5. `malloc` 실패는 정말 신경 써야 하나?

- 데스크톱 리눅스는 **overcommit** 때문에 `malloc` 이 잘 실패하지 않습니다(대신 OOM killer).
- 하지만: 임베디드, 큰 할당(`malloc(user_size)`), 라이브러리 코드에서는 **반드시** 검사합니다.
- 라이브러리라면 실패를 호출자에게 전파. 애플리케이션이라면 로그 남기고 깔끔히 종료(`abort`)도 선택지.
- **절대 하지 말 것**: 검사 없이 바로 역참조. `-Wanalyzer` / Coverity 가 잡습니다.

---

## 6. 실습

1. `08_dynamic_array.c` 에서 성장 배수를 2배 → 1.5배로 바꾸고 `realloc` 호출 횟수를 비교하세요.
2. `08_bugs.c` 의 누수 케이스를 켜고 `make asan NAME=08_bugs` 로 누수 스택 트레이스를 확인하세요.
3. `str_dup` 를 직접 구현하세요 (`strlen` + `malloc` + `memcpy`). 소유권 주석을 다세요.
4. `free(p); p = NULL;` 를 매크로 `FREE(p)` 로 만들어 보세요. 왜 `do { ... } while (0)` 로 감싸야 하나요? (10장)
5. `realloc(p, 0)` 의 동작은? (구현 정의 — C17에서 명확화됨) 문서를 찾아보세요.

---

## 다음 장

[09. 구조체·공용체·열거형·메모리 정렬](./09-구조체-공용체-열거형-정렬.md)
