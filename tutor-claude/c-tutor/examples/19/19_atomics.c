/*
 * 19_atomics.c — C11 atomics: lock 없는 카운터 + 정지 플래그
 *   make run NAME=19_atomics
 */
#include <pthread.h>
#include <stdatomic.h>
#include <stdbool.h>
#include <stdio.h>
#include <time.h>

#define THREADS 4

static atomic_long counter = 0;
static atomic_bool stop = false;

static void *work(void *arg) {
    (void)arg;
    long local = 0;
    while (!atomic_load(&stop)) {
        atomic_fetch_add(&counter, 1); /* 원자적 증가, lock 불필요 */
        local++;
    }
    return (void *)local;
}

int main(void) {
    pthread_t th[THREADS];
    for (int i = 0; i < THREADS; i++) pthread_create(&th[i], NULL, work, NULL);

    struct timespec ts = {.tv_sec = 0, .tv_nsec = 50 * 1000 * 1000}; /* 50ms */
    nanosleep(&ts, NULL);
    atomic_store(&stop, true); /* 모든 스레드에 정지 신호 */

    long sum_local = 0;
    for (int i = 0; i < THREADS; i++) {
        void *r;
        pthread_join(th[i], &r);
        sum_local += (long)r;
    }

    printf("atomic counter = %ld\n", atomic_load(&counter));
    printf("스레드별 로컬 합 = %ld  (%s)\n", sum_local,
           sum_local == atomic_load(&counter) ? "일치" : "불일치");
    return 0;
}
