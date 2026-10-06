# Part 0 — Computer Fundamentals

> 우선순위 `P1` · 예상 ~8h · 선수: 없음

## 목표

Java 코드 한 줄이 CPU에서 실행되기까지 어떤 일이 일어나는지 이해한다.
그리고 그 기초가 **백엔드에서 어떤 버그·함정으로 나타나는지** 안다.

## c-tutor 재사용

이 Part의 상당 부분은 이미 [`../../../c-tutor`](../../../c-tutor) 에 있다.
**중복 개념은 c-tutor로 학습**하고, 여기서는 **"Java/Spring/PostgreSQL에서 어떻게 나타나는가"** 에 집중한다.

| 모듈 | c-tutor 대응 | 여기서 추가로 다루는 것 |
|---|---|---|
| 0.1 수 체계와 비트 | `docs/02`, `docs/03` | 권한 비트마스크, Redis bitmap, `flags` 컬럼 |
| 0.2 정수 표현과 오버플로우 | `docs/02` | `Integer` 오버플로우 버그, `SERIAL` 고갈, ID 생성 전략 |
| 0.3 부동소수점 / IEEE 754 | `docs/02` | **돈은 `BigDecimal`/정수 cents**, `DOUBLE` 컬럼 함정, `==` 비교 |
| 0.4 문자 인코딩 (UTF-8) | — (신규) | `String.length()`의 거짓말, DB charset/collation, `VARCHAR(n)`, 이모지 |
| 0.5 CPU·메모리 계층 | `docs/01` 일부 | latency 숫자표, "배열 vs LinkedList", DB 순차 I/O, mechanical sympathy |
| 0.6 프로그램 실행 / syscall | `docs/00`, `docs/01` | Java I/O 1회 = syscall 1회, `strace`로 관찰, user/kernel 전환 비용 |

## 이 Part를 마치면 답할 수 있어야 한다

- [ ] `System.out.println(0.1 + 0.2)` 는 왜 `0.3` 이 아닌가? 돈 계산은 어떻게 해야 하나?
- [ ] `"까".length()` 와 이 문자열의 UTF-8 바이트 수는 각각 몇인가? 왜 다른가?
- [ ] `ArrayList` 순회가 `LinkedList` 순회보다 빠른 이유를 캐시로 설명하라.
- [ ] `new FileInputStream(...).read()` 한 번에 커널에서 무슨 일이 일어나는가?
- [ ] user mode와 kernel mode 전환은 왜 비싼가?

## 진행

Part 0.1–0.2를 c-tutor로 이미 학습했다면 `PROGRESS.md`에서 🟢 처리하고 **0.3부터** 시작.
