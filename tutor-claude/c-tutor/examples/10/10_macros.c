/*
 * 10_macros.c — 매크로 함정과 그 해결책
 *   make run NAME=10_macros
 *   cc -E examples/10/10_macros.c | grep -A1 파생   # 치환 결과를 눈으로
 */
#include <stdio.h>

/* 나쁨: 괄호 부족 */
#define SQUARE_BAD(x) x *x
/* 좋음: 인자와 전체를 괄호로 */
#define SQUARE_OK(x) ((x) * (x))

/* 나쁨: 인자 다중 평가 */
#define MAX_MACRO(a, b) ((a) > (b) ? (a) : (b))
/* 좋음: inline 함수는 인자를 한 번만 평가하고 타입 검사도 한다 */
static inline int imax(int a, int b) { return a > b ? a : b; }

/* 여러 문장 매크로는 do-while(0) 로 감싼다 */
#define SWAP_INT(a, b)                                                                              \
    do {                                                                                           \
        int tmp_ = (a);                                                                            \
        (a) = (b);                                                                                 \
        (b) = tmp_;                                                                                \
    } while (0)

int main(void) {
    printf("SQUARE_BAD(1+2) = %d  (1+2*1+2, 파생 버그)\n", SQUARE_BAD(1 + 2));
    printf("SQUARE_OK(1+2)  = %d\n", SQUARE_OK(1 + 2));

    int i = 5, j = 10;
    printf("\nMAX_MACRO(i++, j++): ");
    int m = MAX_MACRO(i++, j++);
    printf("결과=%d, 이후 i=%d j=%d  (j 가 두 번 증가!)\n", m, i, j);

    i = 5;
    j = 10;
    int m2 = imax(i++, j++);
    printf("imax(i++, j++):     결과=%d, 이후 i=%d j=%d  (각각 한 번만 증가, 정상)\n", m2, i, j);

    int a = 1, b = 2;
    SWAP_INT(a, b);
    printf("\nSWAP_INT 후: a=%d b=%d\n", a, b);
    return 0;
}
