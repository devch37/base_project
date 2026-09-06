/*
 * 02_conversions.c — 암묵적 형 변환의 3대 함정
 *   1) 정수 승격 (char/short -> int)
 *   2) 부호 있음 + 부호 없음 -> 부호 없음
 *   3) 큰 타입 -> 작은 타입 대입 시 값 잘림
 */
#include <stdio.h>

int main(void) {
    /* 함정 1: 승격 */
    unsigned char a = 200, b = 100;
    printf("[승격] a + b (식은 int) = %d\n", a + b);          /* 300 */
    unsigned char c = (unsigned char)(a + b);
    printf("[승격] unsigned char 에 담으면       = %d\n", c);  /* 44 (300 % 256) */

    /* 함정 2: signed/unsigned 비교 */
    int i = -1;
    unsigned int u = 1;
    /* 의도적으로 남겨 둔 줄: 여기서 -Wsign-compare 경고가 나는 게 정상이다.
     * 컴파일러가 "이 비교 위험해요"라고 알려 주는 것. */
    printf("\n[비교] (-1 < 1u) 의 결과 = %s\n", (i < u) ? "참" : "거짓(!!)");
    printf("       이유: -1 이 unsigned 로 변환되어 %u 가 됨\n", (unsigned)i);

    /* 실무 버그: 부호 없는 뺄셈 언더플로우 */
    size_t len = 0;
    printf("\n[언더플로우] size_t 0 - 1 = %zu  (거대한 수)\n", len - 1);
    printf("  그래서 `for (size_t i = 0; i <= len - 1; i++)` 는 폭주한다.\n");

    /* 함정 3: 잘림 */
    long big = 0x100000001L; /* 2^32 + 1 */
    int narrowed = (int)big;
    printf("\n[잘림] long 0x100000001 -> int = %d\n", narrowed); /* 1 */

    /* float -> int 는 버림(0 방향) */
    printf("\n[실수->정수] (int)3.99 = %d, (int)-3.99 = %d\n", (int)3.99, (int)-3.99);
    return 0;
}
