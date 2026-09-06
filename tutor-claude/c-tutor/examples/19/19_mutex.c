/*
 * 19_mutex.c — 뮤텍스로 임계 구역 보호
 *   make run NAME=19_mutex
 */
#include <pthread.h>
#include <stdio.h>

#define THREADS 4
#define ITERS 500000

static long            counter = 0;
static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

static void *inc(void *arg) {
    (void)arg;
    for (int i = 0; i < ITERS; i++) {
        pthread_mutex_lock(&lock);
        counter++; /* 임계 구역: 한 번에 한 스레드만 */
        pthread_mutex_unlock(&lock);
    }
    return NULL;
}

int main(void) {
    pthread_t th[THREADS];
    for (int i = 0; i < THREADS; i++) pthread_create(&th[i], NULL, inc, NULL);
    for (int i = 0; i < THREADS; i++) pthread_join(th[i], NULL);

    printf("기대값: %d\n", THREADS * ITERS);
    printf("실제값: %ld  %s\n", counter,
           counter == (long)THREADS * ITERS ? "(정확)" : "(틀림)");
    return 0;
}
