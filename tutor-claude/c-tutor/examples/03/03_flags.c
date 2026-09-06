/*
 * 03_flags.c — 비트 플래그: 하나의 정수를 스위치 묶음으로 사용
 *   make run NAME=03_flags
 */
#include <stdio.h>

enum {
    PERM_READ  = 1 << 0, /* 0b001 */
    PERM_WRITE = 1 << 1, /* 0b010 */
    PERM_EXEC  = 1 << 2, /* 0b100 */
};

static void show(const char *label, unsigned f) {
    printf("%-14s [%c%c%c] (0x%X)\n", label,
           (f & PERM_READ) ? 'r' : '-',
           (f & PERM_WRITE) ? 'w' : '-',
           (f & PERM_EXEC) ? 'x' : '-', f);
}

int main(void) {
    unsigned flags = 0;
    show("초기", flags);

    flags |= PERM_READ | PERM_WRITE; /* set */
    show("R|W set", flags);

    flags &= ~PERM_WRITE; /* clear */
    show("W clear", flags);

    flags ^= PERM_EXEC; /* toggle */
    show("X toggle", flags);
    flags ^= PERM_EXEC;
    show("X toggle again", flags);

    /* 관용구들 */
    unsigned x = 0xB4; /* 1011 0100 (C23 전에는 0b 리터럴이 비표준이라 hex 사용) */
    printf("\nx            = 0x%02X\n", x);
    printf("x & (x-1)    = 0x%02X  (최하위 1비트 제거)\n", x & (x - 1));
    printf("x & -x       = 0x%02X  (최하위 1비트만)\n", x & (unsigned)(-(int)x));
    printf("13을 8의 배수로 올림 = %u\n", (13u + 7u) & ~7u);
    printf("우선순위 함정: (x & 4) == 0 은 %d, x & 4 == 0 은 %d (다르다!)\n",
           (x & 4) == 0, x & (4 == 0));
    return 0;
}
