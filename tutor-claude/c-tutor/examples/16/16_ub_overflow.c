/*
 * 16_ub_overflow.c — 부호 있는 오버플로우 UB 가 최적화 레벨에 따라 다르게 동작
 *
 *   cc -O0 examples/16/16_ub_overflow.c -o /tmp/o0 && /tmp/o0
 *   cc -O2 examples/16/16_ub_overflow.c -o /tmp/o2 && /tmp/o2   # 결과가 다를 수 있음!
 *   make ubsan NAME=16_ub_overflow                               # 정확히 잡아냄
 */
#include <limits.h>
#include <stdio.h>

/* 컴파일러는 "부호 있는 오버플로우는 안 일어난다"고 가정한다.
 * 그래서 -O2 에서 이 함수가 통째로 'return 1;' 이 되기도 한다. */
static int always_true_question_mark(int a) {
    return a + 1 > a;
}

/* 루프 상한이 오버플로우하면 -O2 에서 무한 루프가 되기도 한다 (여기선 안전하게 축소). */
static long sum_to(int n) {
    long s = 0;
    for (int i = 1; i <= n; i++) s += i;
    return s;
}

int main(void) {
    printf("always_true(INT_MAX) = %d\n", always_true_question_mark(INT_MAX));
    printf("  -> -O0 에선 0 (실제로 오버플로우해서 음수가 됨),\n");
    printf("  -> -O2 에선 1 (컴파일러가 UB 를 '안 일어난다'고 최적화)\n\n");

    printf("sum_to(100) = %ld\n", sum_to(100));
    printf("\n교훈: UB 는 '크래시'가 아니라 '컴파일러가 코드를 다르게 해석'하는 것이다.\n");
    return 0;
}
