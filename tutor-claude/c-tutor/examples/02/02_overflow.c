/*
 * 02_overflow.c — 부호 없는 오버플로우(정의됨) vs 부호 있는 오버플로우(UB)
 *
 *   make run   NAME=02_overflow     # 그냥 실행
 *   make ubsan NAME=02_overflow     # UBSan 이 signed overflow 를 잡아냄
 */
#include <limits.h>
#include <stdint.h>
#include <stdio.h>

/* 안전한 덧셈: 오버플로우를 "일으키지 않고" 미리 검사한다. */
static int checked_add(int a, int b, int *out) {
    if (b > 0 && a > INT_MAX - b) return 0; /* 오버플로우 예상 */
    if (b < 0 && a < INT_MIN - b) return 0; /* 언더플로우 예상 */
    *out = a + b;
    return 1;
}

int main(void) {
    unsigned int u = UINT_MAX;
    printf("unsigned: UINT_MAX + 1 = %u  (정의됨: 0으로 wrap)\n", u + 1u);

    int i = INT_MAX;
    printf("signed  : INT_MAX = %d 에 1을 더하면 UB.\n", i);
    printf("          (일반 빌드에선 %d 처럼 보이지만 믿으면 안 됨)\n", i + 1);

    int result;
    if (checked_add(INT_MAX, 1, &result))
        printf("checked_add 성공: %d\n", result);
    else
        printf("checked_add: 오버플로우를 감지하고 거부함 (이게 실무 방식)\n");

    return 0;
}
