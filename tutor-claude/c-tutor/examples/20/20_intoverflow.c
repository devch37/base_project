/*
 * 20_intoverflow.c — 할당 크기 계산의 정수 오버플로우
 *   make run NAME=20_intoverflow
 */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* 취약: n * elem 이 오버플로우하면 아주 작은 버퍼가 잡힌다 */
static void *alloc_bad(size_t n, size_t elem) {
    return malloc(n * elem);
}

/* 안전: 곱셈 전에 오버플로우를 검사 */
static void *alloc_ok(size_t n, size_t elem) {
    if (elem != 0 && n > SIZE_MAX / elem) {
        return NULL; /* 오버플로우 예상 → 거부 */
    }
    return malloc(n * elem);
}

int main(void) {
    /* SIZE_MAX/2 + 1 개 * 2바이트 = 오버플로우 → 실제로는 아주 작게 할당됨 */
    size_t n = SIZE_MAX / 2 + 1;
    size_t elem = 2;

    printf("요청: %zu개 * %zu바이트 = %zu (오버플로우된 값!)\n", n, elem, n * elem);

    void *p = alloc_bad(n, elem);
    printf("alloc_bad: %s  <- 성공하면 위험 (요청보다 훨씬 작은 버퍼)\n",
           p ? "malloc 성공" : "malloc 실패(NULL)");
    free(p);

    void *q = alloc_ok(n, elem);
    printf("alloc_ok : %s  <- 오버플로우를 미리 감지해 거부\n", q ? "성공" : "거부(NULL)");
    free(q);

    /* calloc 은 이 검사를 내부에서 해 준다 */
    void *r = calloc(n, elem);
    printf("calloc   : %s  <- 내부적으로 오버플로우 검사\n", r ? "성공" : "거부(NULL)");
    free(r);
    return 0;
}
