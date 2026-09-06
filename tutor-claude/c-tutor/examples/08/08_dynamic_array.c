/*
 * 08_dynamic_array.c — realloc 로 자라는 동적 배열 (올바른 패턴)
 *   make run  NAME=08_dynamic_array
 *   make asan NAME=08_dynamic_array
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int   *data;
    size_t len;   /* 현재 원소 수 */
    size_t cap;   /* 확보된 용량 */
} Vec;

/* 반환값 0=성공, -1=실패. 실패해도 v 는 유효 상태를 유지한다. */
static int vec_push(Vec *v, int value) {
    if (v->len == v->cap) {
        size_t new_cap = (v->cap == 0) ? 4 : v->cap * 2;
        void  *tmp = realloc(v->data, new_cap * sizeof *v->data);
        if (!tmp) return -1;            /* v->data 는 아직 유효 → 누수 없음 */
        v->data = tmp;
        v->cap  = new_cap;
        printf("  (용량 확장: %zu)\n", new_cap);
    }
    v->data[v->len++] = value;
    return 0;
}

static void vec_free(Vec *v) {
    free(v->data);
    v->data = NULL;
    v->len = v->cap = 0;
}

int main(void) {
    Vec v = {0};                       /* 모든 필드 0/NULL 로 초기화 */

    for (int i = 1; i <= 10; i++) {
        if (vec_push(&v, i * i) != 0) {
            fprintf(stderr, "out of memory\n");
            vec_free(&v);
            return 1;
        }
    }

    printf("len=%zu cap=%zu -> ", v.len, v.cap);
    for (size_t i = 0; i < v.len; i++) printf("%d ", v.data[i]);
    putchar('\n');

    vec_free(&v);                       /* 짝이 되는 free. 잊으면 누수 */
    return 0;
}
