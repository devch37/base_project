/*
 * 12_parsing.c — 문자열 -> 숫자: atoi(위험) vs strtol(실무)
 *   make run NAME=12_parsing
 */
#include <errno.h>
#include <limits.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>

/* 실무용 안전 파서: 성공하면 true 를 반환하고 *out 에 값을 넣는다. */
static bool parse_long(const char *s, long *out) {
    errno = 0;
    char *end;
    long  v = strtol(s, &end, 10);

    if (end == s) return false;             /* 숫자가 하나도 없음 */
    if (*end != '\0') return false;         /* 뒤에 쓰레기가 붙음 ("42abc") */
    if (errno == ERANGE) return false;      /* long 범위 초과 */

    *out = v;
    return true;
}

int main(void) {
    const char *inputs[] = {"42", "42abc", "", "  7", "99999999999999999999", "-13"};

    for (size_t i = 0; i < sizeof inputs / sizeof inputs[0]; i++) {
        const char *s = inputs[i];
        long        v;
        bool        ok = parse_long(s, &v);

        printf("%-24s  atoi=%-6d  strtol=%s",
               s[0] ? s : "(빈 문자열)", atoi(s), ok ? "" : "실패");
        if (ok) printf("%ld", v);
        putchar('\n');
    }

    /* snprintf(NULL, 0, ...) 로 필요한 길이 먼저 계산 */
    int  n = 123456;
    int  need = snprintf(NULL, 0, "value=%d", n);
    char *buf = malloc((size_t)need + 1);
    snprintf(buf, (size_t)need + 1, "value=%d", n);
    printf("\n동적 버퍼: \"%s\" (길이 %d)\n", buf, need);
    free(buf);
    return 0;
}
