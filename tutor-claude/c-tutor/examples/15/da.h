/* da.h — int 동적 배열 (헤더 라이브러리, static 함수).
 * 소유권: da_free 로 해제. push 후 예전 원소 포인터는 무효(realloc). 인덱스로 저장하라. */
#ifndef CTUTOR_DA_H
#define CTUTOR_DA_H

#include <stdlib.h>

typedef struct {
    int   *data;
    size_t len;
    size_t cap;
} IntArray;

static inline void da_init(IntArray *a) {
    a->data = NULL;
    a->len = a->cap = 0;
}

static inline int da_push(IntArray *a, int v) {
    if (a->len == a->cap) {
        size_t nc = a->cap ? a->cap * 2 : 8;
        int   *t = realloc(a->data, nc * sizeof *t);
        if (!t) return -1; /* a->data 는 아직 유효 */
        a->data = t;
        a->cap = nc;
    }
    a->data[a->len++] = v;
    return 0;
}

/* 순서를 유지하지 않는 O(1) 삭제: 마지막 원소를 i 자리로 옮긴다. */
static inline void da_remove_unordered(IntArray *a, size_t i) {
    if (i >= a->len) return;
    a->data[i] = a->data[--a->len];
}

static inline void da_free(IntArray *a) {
    free(a->data);
    da_init(a);
}

#endif /* CTUTOR_DA_H */
