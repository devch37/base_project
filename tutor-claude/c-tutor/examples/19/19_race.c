/*
 * 19_race.c — 데이터 레이스: 동기화 없이 공유 변수를 증가 (UB)
 *   make run NAME=19_race        # 여러 번 실행하면 매번 다른 결과
 *   cc -fsanitize=thread -g examples/19/19_race.c -lpthread -o /tmp/r && /tmp/r
 */
#include <pthread.h>
#include <stdio.h>

#define THREADS 4
#define ITERS 1000000

static long counter = 0; /* 보호받지 않는 공유 상태 */

static void *inc(void *arg) {
    (void)arg;
    for (int i = 0; i < ITERS; i++)
        counter++; /* 읽기-증가-쓰기 3단계 → 레이스 */
    return NULL;
}

int main(void) {
    pthread_t th[THREADS];
    for (int i = 0; i < THREADS; i++) pthread_create(&th[i], NULL, inc, NULL);
    for (int i = 0; i < THREADS; i++) pthread_join(th[i], NULL);

    printf("기대값: %d\n", THREADS * ITERS);
    printf("실제값: %ld  %s\n", counter,
           counter == (long)THREADS * ITERS ? "" : "<- 증가가 유실됨 (레이스)");
    return 0;
}
