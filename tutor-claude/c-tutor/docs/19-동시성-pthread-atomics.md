# 19. 동시성 (pthread · atomics)

> 목표: 스레드 생성/조인, 데이터 레이스가 **왜** 위험한지, mutex·조건변수,
> C11 atomics, 그리고 실무 동시성 규칙.

C11에는 `<threads.h>` 가 있지만 지원이 고르지 않아, 실무는 여전히 **POSIX `<pthread.h>`**
(리눅스/macOS) 또는 Windows 스레드를 씁니다. 이 장은 pthread 기준.

---

## 0. 초등학생 버전 비유

주방에 요리사 4명이 있고 **공용 냄비 하나**가 있어요.
- 아무 규칙 없이 동시에 재료를 넣으면 → 국물이 넘치거나, 한 명이 넣는 사이 다른 명이
  냄비를 옮겨서 재료가 바닥에 쏟아짐 (**데이터 레이스**).
- **뮤텍스** = 냄비에 손잡이가 하나뿐. 손잡이를 잡은 사람만 냄비를 만짐. 다 쓰면 놓음.
- **조건 변수** = "물이 끓으면 알려줘" 라고 부탁하고 잠들기. 끓으면 누가 깨워 줌.
- **원자적 연산** = "숫자 하나 +1" 은 손잡이 없이도 안전하게 해 주는 특수 도구.

---

## 1. 스레드 생성과 조인

```c
#include <pthread.h>

void *worker(void *arg) {
    long id = (long)arg;
    printf("스레드 %ld 시작\n", id);
    return (void *)(id * 10);         // 반환값은 void *
}

int main(void) {
    pthread_t th[4];
    for (long i = 0; i < 4; i++)
        pthread_create(&th[i], NULL, worker, (void *)i);

    for (int i = 0; i < 4; i++) {
        void *ret;
        pthread_join(th[i], &ret);     // 스레드가 끝날 때까지 대기 + 반환값 회수
        printf("스레드 결과: %ld\n", (long)ret);
    }
}
```

- `pthread_create(&tid, attr, fn, arg)` — `fn` 은 `void *(*)(void *)` 시그니처 고정.
- **인자 전달 함정**: 루프 변수 `&i` 를 넘기면 모든 스레드가 같은 `i` 를 봅니다(그리고 i가 변함).
  값을 캐스트해 넘기거나, 스레드별 구조체 배열을 만드세요.
- `pthread_join` 안 하면: 자원 누수(detached 아니면). `pthread_detach` 로 "알아서 정리"도 가능.

컴파일: `cc prog.c -lpthread` (리눅스). 이 코스 `make 19` 가 자동으로 붙입니다.

---

## 2. 데이터 레이스 — UB입니다

**두 스레드가 같은 메모리를 동시에 접근하고, 그중 하나가 쓰기이며, 동기화가 없으면** → UB.

```c
long counter = 0;
void *inc(void *_) {
    for (int i = 0; i < 1000000; i++) counter++;   // 레이스!
    return NULL;
}
// 스레드 4개 실행 후 counter 는 4000000 이 아니다. 매번 다르다.
```

`counter++` 은 **읽기 → +1 → 쓰기** 3단계입니다. 두 스레드가 같은 값을 읽고 각자 +1 하면
증가가 하나 사라집니다. `./bin/19_race` 가 이걸 재현합니다.
`cc -fsanitize=thread` (TSan)로 빌드하면 정확한 레이스 위치를 알려 줍니다.

---

## 3. 뮤텍스 (mutual exclusion)

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

void *inc(void *_) {
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&lock);
        counter++;                     // 임계 구역(critical section): 한 번에 한 스레드만
        pthread_mutex_unlock(&lock);
    }
    return NULL;
}
```

규칙:
- **임계 구역은 최대한 짧게.** lock 잡은 채로 I/O·malloc·긴 계산을 하면 병렬성이 죽습니다.
- lock 순서를 프로그램 전체에서 **일관되게**. A→B로 잠그는 곳과 B→A로 잠그는 곳이 있으면 **데드락**.
- 잠근 뒤 `return`/`goto`/예외 경로에서 `unlock` 을 빠뜨리지 마라 (C엔 RAII 없음 → 주의).
- `pthread_mutex_trylock` — 못 잡으면 즉시 실패(대기 안 함).
- 재귀 lock, 읽기-쓰기 lock(`pthread_rwlock_t`)도 있음.

`./bin/19_mutex` 가 레이스 버전과 lock 버전의 결과를 나란히 보여 줍니다.

---

## 4. 조건 변수 — "어떤 조건이 될 때까지 대기"

생산자-소비자 큐의 핵심.

```c
pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t  cv = PTHREAD_COND_INITIALIZER;
int ready = 0;

// 소비자
pthread_mutex_lock(&m);
while (!ready)                          // while! (if 아님 — spurious wakeup 대비)
    pthread_cond_wait(&cv, &m);        // m 을 풀고 잠듦, 깨면 다시 m 을 잡음
consume();
pthread_mutex_unlock(&m);

// 생산자
pthread_mutex_lock(&m);
ready = 1;
pthread_cond_signal(&cv);              // 대기 중인 스레드 하나를 깨움 (broadcast 는 전부)
pthread_mutex_unlock(&m);
```

**항상 `while` 로 조건 재확인.** `pthread_cond_wait` 는 이유 없이 깨어날 수 있고(spurious),
깨어난 사이 다른 스레드가 조건을 다시 거짓으로 만들 수도 있습니다.

---

## 5. C11 Atomics — lock 없이 안전한 연산

```c
#include <stdatomic.h>

atomic_long counter = 0;
atomic_fetch_add(&counter, 1);          // 원자적 증가. lock 불필요
counter++;                              // atomic_ 타입이면 이것도 원자적
long v = atomic_load(&counter);

atomic_bool stop = false;               // 스레드 간 플래그로 흔히 사용
```

- 단순 카운터/플래그엔 atomics가 mutex보다 빠릅니다. 복합 연산(여러 변수 일관 갱신)엔 mutex.
- **메모리 순서(memory order)**: `atomic_fetch_add(&x, 1, memory_order_relaxed)` 등.
  기본값 `seq_cst`(순차 일관성)이 가장 안전하고 이해하기 쉽습니다. 성능 튜닝 전엔 건드리지 마세요.
- `volatile` 은 **스레드 동기화 도구가 아닙니다.** (컴파일러 최적화만 억제; 하드웨어 메모리
  가시성/원자성 보장 없음.) 스레드엔 atomic 또는 mutex를 쓰세요. `volatile` 은 MMIO/시그널 핸들러용
  (`volatile sig_atomic_t`).

`./bin/19_atomics` 가 atomic 카운터와 정지 플래그를 보여 줍니다.

---

## 6. 실무 동시성 규칙

1. **공유를 줄여라.** 가장 빠르고 안전한 동시성은 "스레드마다 자기 데이터"입니다.
   마지막에 결과만 합칩니다 (map-reduce).
2. **불변 데이터는 공유해도 안전.** 읽기만 하면 레이스 없음.
3. 공유 가변 상태는 **반드시** mutex 또는 atomic으로 보호. "짧으니까 괜찮겠지"는 UB.
4. lock 순서를 문서화하고 지켜라 (데드락 방지).
5. 스레드 안전하지 않은 표준 함수 주의: `strtok`, `localtime`, `rand`, `strerror`,
   `errno`(는 TLS라 안전), 정적 버퍼 반환 함수들 → `_r` 버전 사용.
6. 스레드보다 상위 추상(스레드 풀, 메시지 큐, `OpenMP`)을 우선 고려.
7. 테스트를 `-fsanitize=thread` 로도 돌려라 (느리지만 레이스를 실제로 잡음).

---

## 7. 실습

1. `19_race.c` 를 여러 번 실행해 매번 다른 결과를 확인하세요.
2. `make asan NAME=19_race` 대신 직접 `cc -fsanitize=thread -g examples/19/19_race.c -lpthread`
   로 빌드해 TSan 리포트를 읽으세요.
3. `19_mutex.c` 에서 임계 구역을 루프 **밖**으로 빼면(한 번만 lock) 성능이 어떻게 변하나요?
4. `19_atomics.c` 의 `atomic_long` 을 그냥 `long` 으로 바꿔 레이스를 재현하세요.
5. 생산자 1 : 소비자 N 인 정수 큐를 조건 변수로 구현하세요.

---

## 다음 장

[20. 보안 코딩](./20-보안-코딩.md)
