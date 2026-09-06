/*
 * 17_profile.c — 캐시 지역성: 연속 배열 vs 무작위로 흩어진 연결 리스트
 *   cc -O2 examples/17/17_profile.c -o bin/17_profile && ./bin/17_profile
 *
 * 같은 원소 수, 같은 O(n) 순회인데도 배열이 몇 배 빠르다 — 캐시 때문.
 * 리스트 노드를 "무작위 순서로" 연결해 포인터 추적이 메모리를 널뛰게 만든다.
 */
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

enum { N = 1000000 };

typedef struct Node {
    long         value;
    struct Node *next;
} Node;

static double now_ms(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec * 1000.0 + (double)ts.tv_nsec / 1e6;
}

int main(void) {
    long *arr = malloc(N * sizeof *arr);
    Node *pool = malloc(N * sizeof *pool);
    int  *order = malloc(N * sizeof *order);
    if (!arr || !pool || !order) return 1;

    for (int i = 0; i < N; i++) {
        arr[i] = i;
        pool[i].value = i;
        order[i] = i;
    }
    /* order 를 섞는다 (Fisher-Yates) → 리스트가 pool 을 무작위 순서로 지나가게 */
    srand(12345);
    for (int i = N - 1; i > 0; i--) {
        int j = rand() % (i + 1);
        int t = order[i];
        order[i] = order[j];
        order[j] = t;
    }
    for (int i = 0; i < N - 1; i++) pool[order[i]].next = &pool[order[i + 1]];
    pool[order[N - 1]].next = NULL;
    Node *head = &pool[order[0]];

    double t0 = now_ms();
    long   sa = 0;
    for (int r = 0; r < 6; r++)
        for (int i = 0; i < N; i++) sa += arr[i];
    double t1 = now_ms();

    long sl = 0;
    for (int r = 0; r < 6; r++)
        for (Node *n = head; n; n = n->next) sl += n->value;
    double t2 = now_ms();

    printf("배열 합  : %6.1f ms  (sum=%ld)\n", t1 - t0, sa);
    printf("리스트 합: %6.1f ms  (sum=%ld)\n", t2 - t1, sl);
    printf("리스트가 약 %.1f배 느림 — 무작위 포인터 추적으로 캐시 미스가 잦기 때문\n",
           (t2 - t1) / (t1 - t0));

    free(arr);
    free(pool);
    free(order);
    return 0;
}
