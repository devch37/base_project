/*
 * 12_stdlib_tour.c — qsort / bsearch / strtok_r / clock 빠른 맛보기
 *   make run NAME=12_stdlib_tour
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

/* qsort/bsearch 비교 함수: const void * 두 개를 받아 <0 / 0 / >0 반환 */
static int cmp_int(const void *pa, const void *pb) {
    int a = *(const int *)pa;
    int b = *(const int *)pb;
    return (a > b) - (a < b); /* 뺄셈(a-b)은 오버플로우 위험 → 이 관용구 사용 */
}

int main(void) {
    int v[] = {42, 7, 13, 99, 1, 55, 8};
    size_t n = sizeof v / sizeof v[0];

    qsort(v, n, sizeof v[0], cmp_int);
    printf("정렬: ");
    for (size_t i = 0; i < n; i++) printf("%d ", v[i]);
    putchar('\n');

    int key = 55;
    int *found = bsearch(&key, v, n, sizeof v[0], cmp_int);
    printf("bsearch(55): %s\n", found ? "찾음" : "없음");

    /* strtok_r: 재진입 가능한 토크나이저 (strtok 은 정적 상태 때문에 위험) */
    char line[] = "name,age,city,country";
    char *save = NULL;
    printf("CSV 분리: ");
    for (char *tok = strtok_r(line, ",", &save); tok; tok = strtok_r(NULL, ",", &save))
        printf("[%s] ", tok);
    putchar('\n');

    /* clock(): 간단한 벤치마크 */
    clock_t t0 = clock();
    volatile long acc = 0;
    for (long i = 0; i < 20000000L; i++) acc += i;
    clock_t t1 = clock();
    printf("루프 시간: %.1f ms\n", 1000.0 * (double)(t1 - t0) / CLOCKS_PER_SEC);
    return 0;
}
