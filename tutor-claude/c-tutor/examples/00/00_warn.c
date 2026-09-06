/*
 * 00_warn.c — "경고 없이 컴파일하면 위험한" 흔한 초보 실수 3개
 *
 *   cc 00_warn.c -o x                       # 조용함 (나쁨)
 *   cc -Wall -Wextra -Wpedantic 00_warn.c   # 경고 3개
 *
 * 이 파일은 일부러 잘못 짠 것이다. 경고를 읽고 무엇이 위험한지 이해하는 게 목적.
 */

#include <stdio.h>

int add(int a, int b) {
    int result = a + b;
    /* 실수 1: 값을 돌려주기로 해놓고 return 을 빠뜨림 → -Wreturn-type */
}

int main(void) {
    /* 실수 2: %d 는 int 를 기대하는데 double 을 넘김 → -Wformat.
     *         메모리에서 double(8바이트)을 int(4바이트)로 잘못 읽어 쓰레기 값이 나온다. */
    printf("%d\n", 3.14);

    /* 실수 3: 초기화하지 않은 변수를 읽음 → -Wuninitialized.
     *         x 에는 그 스택 위치에 남아 있던 이전 값(쓰레기)이 들어 있다. */
    int x;
    printf("x = %d\n", x);

    /* 실수 1의 결과: add 의 반환값은 정의되지 않음(UB). */
    printf("add(2,3) = %d\n", add(2, 3));

    return 0;
}
