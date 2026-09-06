# 연습 문제

각 장의 `docs/NN` 안에도 "실습"이 있습니다. 여기 있는 건 **여러 장을 묶은 도전 과제**입니다.
막히면 `solutions/` 를 보되, **왜 그렇게 되는지 설명할 수 있을 때까지** 보세요.

빌드: `cc -std=c11 -Wall -Wextra -Wpedantic -g -fsanitize=address,undefined 파일.c -o x`

---

## 🟢 기초 (1~4장)

### E1. FizzBuzz + 비트
1~100 출력. 3의 배수는 Fizz, 5의 배수는 Buzz, 둘 다면 FizzBuzz.
단, `%` 를 딱 한 번만 사용 (나머지는 덧셈 카운터로).

### E2. 정수 뒤집기
`int reverse_digits(int n)` — `12345 → 54321`. 오버플로우 시 0 반환 (2장: 미리 검사).

---

## 🟡 포인터·메모리 (5~8장)

### E3. `my_strlen` / `my_strcpy` / `my_strcat`
표준 함수 없이 구현. `my_strcpy` 는 `dst` 를 반환. `const` 를 올바르게.

### E4. 동적 문자열 분할
`char **split(const char *s, char sep, size_t *count)` — `"a,b,c"` → `["a","b","c"]`.
소유권: 반환된 배열과 각 문자열을 호출자가 free. `free_split(char **, size_t)` 도 작성.
`make asan` 으로 누수 0 확인.

### E5. 링 버퍼 (원형 큐)
고정 크기 `int` 원형 버퍼. `rb_push`(가득 차면 -1), `rb_pop`(비면 -1).
`head`, `tail`, `count` 로 구현. off-by-one 조심.

---

## 🟡 구조적 프로그래밍 (9~13장)

### E6. 미니 CSV 파서
`parse_csv_line(char *line, char **fields, size_t max)` — 쉼표 분리, `field` 포인터를
`line` 안쪽을 가리키게(복사 X), 반환값은 필드 수. 따옴표 처리는 보너스.

### E7. `tail -n N`
파일의 마지막 N줄 출력. 파일을 한 번만 순회 (링 버퍼 재사용!).

### E8. INI 설정 로더
`key=value` 줄과 `[section]` 을 파싱해 `get(section, key)` 로 조회.
15장 해시맵 재사용. 주석(`#`, `;`)과 공백 처리.

---

## 🔴 고급 (14~20장)

### E9. 제네릭 정렬
`void gsort(void *base, size_t n, size_t sz, int (*cmp)(const void*, const void*))` —
qsort 를 직접 구현 (삽입 정렬 → 퀵/머지). `qsort` 와 결과 비교.

### E10. 문자열 인터너 (string interning)
같은 문자열은 한 번만 저장하고 항상 같은 포인터를 돌려주는 `intern(const char *)`.
포인터 비교(`==`)로 문자열 동등성 판단이 가능해짐. 해시맵 기반.

### E11. 미니 계산기 (재귀 하강 파서)
`"3 + 4 * (2 - 1)"` → `7`. 토크나이저 + 재귀 하강 파싱. 괄호, 우선순위, 단항 마이너스.
잘못된 입력에 크래시하지 말 것 (에러 반환). 재귀 깊이 제한 (20장).

### E12. 병렬 워드 카운트
큰 텍스트 파일을 N개 청크로 나눠 스레드가 각자 단어를 세고(로컬 해시맵),
마지막에 합침. 공유 상태 최소화 (19장). `-fsanitize=thread` 통과.

---

## 캡스톤 확장 (22장)

`capstone/` 의 KV 저장소에 TTL, prefix 스캔, 동시성, TCP 서버 중 하나를 추가.
