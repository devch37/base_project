/*
 * 07_array_decay.c — 배열은 함수로 넘어갈 때 포인터로 "붕괴"한다.
 *   make run NAME=07_array_decay
 */
#include <stdio.h>

/* 매개변수의 int a[10] 은 사실 int *a 다. sizeof(a) 는 포인터 크기. */
static void takes_array(int a[10]) {
    printf("함수 안:  sizeof(a) = %zu  (포인터라서 8)\n", sizeof(a));
    printf("함수 안:  이 안에선 배열 길이를 알 수 없다 -> 따로 넘겨야 한다\n");
}

/* 실무 표준 시그니처: 포인터 + 길이 */
static long sum(const int *a, size_t len) {
    long s = 0;
    for (size_t i = 0; i < len; i++) s += a[i];
    return s;
}

int main(void) {
    int a[10] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    printf("main 안:  sizeof(a)      = %zu  (전체 40바이트)\n", sizeof(a));
    printf("main 안:  sizeof(a[0])   = %zu\n", sizeof(a[0]));
    printf("main 안:  길이 = %zu\n\n", sizeof(a) / sizeof(a[0]));

    takes_array(a);

    printf("\nsum = %ld\n", sum(a, sizeof(a) / sizeof(a[0])));

    /* a[i] == *(a+i) == i[a]  (전부 같은 뜻) */
    printf("a[3]=%d  *(a+3)=%d  3[a]=%d\n", a[3], *(a + 3), 3[a]);

    /* a + 10 (마지막 다음)은 만들어도 되지만 역참조는 UB */
    int *end = a + 10;
    printf("포인터 차이 end - a = %td (원소 개수)\n", end - a);
    return 0;
}
