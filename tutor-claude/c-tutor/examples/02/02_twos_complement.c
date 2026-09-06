/* 02_twos_complement.c — 2의 보수: 뺄셈을 덧셈으로. */
#include <stdint.h>
#include <stdio.h>

static void print_bits8(uint8_t v) {
    for (int i = 7; i >= 0; i--) putchar((v >> i) & 1 ? '1' : '0');
}

int main(void) {
    printf("8비트 signed char 의 비트 패턴\n");
    int8_t values[] = {0, 1, 127, -128, -1, -2};
    for (size_t i = 0; i < sizeof values / sizeof values[0]; i++) {
        int8_t v = values[i];
        printf("%5d = ", v);
        print_bits8((uint8_t)v);
        putchar('\n');
    }

    /* a - b == a + (~b + 1) : CPU가 실제로 하는 계산 */
    int8_t a = 50, b = 20;
    uint8_t nb = (uint8_t)(~(unsigned)b + 1u); /* -b 를 비트 연산으로 (2의 보수) */
    int8_t neg_b = (int8_t)nb;
    printf("\n50 - 20 = %d,   50 + (~20 + 1) = %d\n", a - b, a + neg_b);

    /* 최솟값의 비대칭: -INT8_MIN 은 표현 불가 */
    printf("\nINT8_MIN = %d, INT8_MAX = %d\n", INT8_MIN, INT8_MAX);
    printf("그래서 -(INT8_MIN) 이나 abs(INT8_MIN) 은 오버플로우(UB)다.\n");
    return 0;
}
