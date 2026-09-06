/* 02_sizes.c — 이 시스템에서 각 타입의 실제 크기와 범위. */
#include <float.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>

int main(void) {
    printf("타입          크기(byte)   범위\n");
    printf("char          %zu           %d .. %d\n", sizeof(char), CHAR_MIN, CHAR_MAX);
    printf("short         %zu           %d .. %d\n", sizeof(short), SHRT_MIN, SHRT_MAX);
    printf("int           %zu           %d .. %d\n", sizeof(int), INT_MIN, INT_MAX);
    printf("long          %zu           %ld .. %ld\n", sizeof(long), LONG_MIN, LONG_MAX);
    printf("long long     %zu           %lld .. %lld\n", sizeof(long long), LLONG_MIN, LLONG_MAX);
    printf("float         %zu\n", sizeof(float));
    printf("double        %zu\n", sizeof(double));
    printf("void *        %zu   (포인터는 시스템 워드 크기)\n", sizeof(void *));
    printf("size_t        %zu   (SIZE_MAX = %zu)\n", sizeof(size_t), SIZE_MAX);

    printf("\nchar 는 이 시스템에서 %s\n",
           (CHAR_MIN < 0) ? "signed (부호 있음)" : "unsigned (부호 없음)");
    printf("float  유효숫자 약 %d 자리\n", FLT_DIG);
    printf("double 유효숫자 약 %d 자리\n", DBL_DIG);
    return 0;
}
