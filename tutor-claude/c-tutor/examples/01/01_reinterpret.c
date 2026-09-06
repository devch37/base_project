/*
 * 01_reinterpret.c — "타입은 비트를 읽는 렌즈일 뿐"
 *
 *   make run NAME=01_reinterpret
 *
 * 같은 메모리를 여러 타입으로 재해석하면 값이 완전히 달라진다.
 * 안전하게 재해석하는 방법은 memcpy 다 (16장의 strict aliasing 참고).
 */

#include <stdio.h>
#include <string.h>

int main(void) {
    float f = 1.0f;

    /* 방법 1: memcpy 로 비트를 그대로 복사해 정수로 본다 (합법, 이식성 있음) */
    unsigned int bits;
    memcpy(&bits, &f, sizeof bits);
    printf("float 1.0f 의 비트 패턴 : 0x%08X  (IEEE 754)\n", bits);

    /* 방법 2: 바이트 단위로 들여다보기 */
    unsigned char *p = (unsigned char *)&f;
    printf("바이트로 보면          : ");
    for (size_t i = 0; i < sizeof f; i++) {
        printf("%02X ", p[i]);
    }
    printf(" (리틀 엔디언이면 역순으로 저장됨 - 16장)\n");

    /* -1 을 부호 없는 정수로 재해석하면? (2장 예고편) */
    int neg = -1;
    unsigned int as_unsigned;
    memcpy(&as_unsigned, &neg, sizeof as_unsigned);
    printf("\nint -1 을 unsigned 로  : %u  (전부 1인 비트 = 0xFFFFFFFF)\n", as_unsigned);

    return 0;
}
