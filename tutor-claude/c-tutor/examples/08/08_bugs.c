/*
 * 08_bugs.c — 4대 메모리 버그. 기본은 전부 "안전"하게 꺼져 있다.
 *   BUG 매크로를 하나씩 켜서 ASan 메시지를 확인하라:
 *     cc -DBUG=1 -fsanitize=address,undefined -g examples/08/08_bugs.c -o /tmp/b && /tmp/b
 *   또는 코드에서 #define BUG 를 바꾸고  make asan NAME=08_bugs
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef BUG
#define BUG 0
#endif

int main(void) {
    printf("BUG=%d (0이면 모두 정상 동작)\n", BUG);

#if BUG == 1 /* 누수: free 를 안 한다 */
    int *p = malloc(64);
    p[0] = 1;
    printf("누수: 64바이트를 malloc 하고 free 하지 않음\n");
    return 0; /* ASan: "Direct leak of 64 byte(s)" */

#elif BUG == 2 /* use-after-free */
    int *p = malloc(sizeof *p);
    *p = 42;
    free(p);
    printf("use-after-free: *p = %d\n", *p); /* ASan: heap-use-after-free */
    return 0;

#elif BUG == 3 /* double free */
    int *p = malloc(sizeof *p);
    free(p);
    free(p); /* ASan: attempting double-free */
    return 0;

#elif BUG == 4 /* 초기화 안 한 힙 메모리 읽기 (Valgrind 가 잘 잡음) */
    int *p = malloc(sizeof *p);
    printf("초기화 안 함: *p = %d (쓰레기)\n", *p);
    free(p);
    return 0;

#else /* 정상: 모든 규칙을 지킨 버전 */
    int *p = malloc(sizeof *p);
    if (!p) return 1;
    *p = 42;
    printf("정상: *p = %d\n", *p);
    free(p);
    p = NULL; /* dangling 방지 */
    return 0;
#endif
}
