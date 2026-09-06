/*
 * main.c — 다중 파일 프로그램의 진입점.
 *   make 11 && ./bin/11_multifile
 *
 * main.c 는 counter/strutil 의 "선언"(헤더)만 보고 컴파일된다.
 * 실제 구현은 링크 단계에서 counter.o / strutil.o 와 연결된다.
 */
#include "counter.h"
#include "strutil.h"

#include <stdio.h>
#include <stdlib.h>

int main(void) {
    Counter *c = counter_new(100);
    if (!c) {
        fprintf(stderr, "메모리 부족\n");
        return 1;
    }
    counter_add(c, 5);
    counter_add(c, -20);
    printf("counter value = %ld\n", counter_value(c));
    counter_free(c); /* new 로 받았으니 free 로 돌려준다 */

    char *greeting = str_dup("hello, modular C");
    if (greeting) {
        printf("dup: %s\n", greeting);
        free(greeting); /* str_dup 문서: 호출자가 free */
    }

    char small[8];
    size_t need = str_copy(small, sizeof small, "this string is long");
    printf("copy: \"%s\"  (필요 길이 %zu, %s)\n", small, need,
           need >= sizeof small ? "잘림" : "OK");

    return 0;
}
