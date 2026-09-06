/*
 * e3_e4_e5.c — 포인터/메모리 연습 해답 (E3 문자열 함수, E4 split, E5 링 버퍼)
 *   cc -std=c11 -Wall -Wextra -Wpedantic -g -fsanitize=address,undefined \
 *      exercises/solutions/e3_e4_e5.c -o /tmp/e && /tmp/e
 */
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---------- E3 ---------- */
static size_t my_strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return (size_t)(p - s);
}
static char *my_strcpy(char *dst, const char *src) {
    char *d = dst;
    while ((*d++ = *src++)) { /* '\0' 까지 복사 */
    }
    return dst;
}

/* ---------- E4: 동적 문자열 분할 ---------- */
static char **split(const char *s, char sep, size_t *count) {
    size_t n = 1;
    for (const char *p = s; *p; p++)
        if (*p == sep) n++;

    char **out = malloc(n * sizeof *out);
    if (!out) {
        *count = 0;
        return NULL;
    }

    size_t idx = 0;
    const char *start = s;
    for (const char *p = s;; p++) {
        if (*p == sep || *p == '\0') {
            size_t len = (size_t)(p - start);
            char  *field = malloc(len + 1);
            if (!field) { /* 부분 실패: 지금까지 걸 정리 */
                for (size_t k = 0; k < idx; k++) free(out[k]);
                free(out);
                *count = 0;
                return NULL;
            }
            memcpy(field, start, len);
            field[len] = '\0';
            out[idx++] = field;
            if (*p == '\0') break;
            start = p + 1;
        }
    }
    *count = n;
    return out;
}
static void free_split(char **parts, size_t count) {
    for (size_t i = 0; i < count; i++) free(parts[i]);
    free(parts);
}

/* ---------- E5: 원형 버퍼 ---------- */
#define RB_CAP 4
typedef struct {
    int    buf[RB_CAP];
    size_t head, count;
} Ring;

static int rb_push(Ring *r, int v) {
    if (r->count == RB_CAP) return -1;
    r->buf[(r->head + r->count) % RB_CAP] = v;
    r->count++;
    return 0;
}
static int rb_pop(Ring *r, int *out) {
    if (r->count == 0) return -1;
    *out = r->buf[r->head];
    r->head = (r->head + 1) % RB_CAP;
    r->count--;
    return 0;
}

int main(void) {
    /* E3 */
    char dst[16];
    my_strcpy(dst, "hello");
    assert(my_strlen(dst) == 5 && strcmp(dst, "hello") == 0);

    /* E4 */
    size_t n;
    char **p = split("a,bb,,ccc", ',', &n);
    assert(n == 4);
    assert(strcmp(p[0], "a") == 0 && strcmp(p[2], "") == 0 && strcmp(p[3], "ccc") == 0);
    for (size_t i = 0; i < n; i++) printf("field[%zu]=\"%s\"\n", i, p[i]);
    free_split(p, n);

    /* E5 */
    Ring r = {0};
    assert(rb_push(&r, 1) == 0 && rb_push(&r, 2) == 0);
    assert(rb_push(&r, 3) == 0 && rb_push(&r, 4) == 0);
    assert(rb_push(&r, 5) == -1); /* 가득 */
    int x;
    assert(rb_pop(&r, &x) == 0 && x == 1);
    assert(rb_push(&r, 5) == 0); /* 자리 생김 → wrap */
    int seq[4], k = 0;
    while (rb_pop(&r, &seq[k]) == 0) k++;
    assert(k == 4 && seq[0] == 2 && seq[3] == 5);

    printf("E3/E4/E5 모든 assert 통과\n");
    return 0;
}
