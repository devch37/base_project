/* hashmap.h — 문자열 키 -> long 값. 체이닝 + FNV-1a + load-factor 리사이즈.
 * 소유권: 키 문자열을 복사해서 소유한다. hm_free 가 전부 해제.
 *         hm_get 이 반환한 포인터는 다음 hm_put(리사이즈 가능) 전까지만 유효. */
#ifndef CTUTOR_HASHMAP_H
#define CTUTOR_HASHMAP_H

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

typedef struct HmEntry {
    char           *key;
    long            value;
    struct HmEntry *next;
} HmEntry;

typedef struct {
    HmEntry **buckets;
    size_t    nbuckets; /* 항상 2의 거듭제곱 */
    size_t    count;
} HashMap;

/* strdup 은 POSIX 라서 -std=c11 -Wpedantic 에선 안 보일 수 있다. 직접 만든다. */
static inline char *hm__strdup(const char *s) {
    size_t n = strlen(s) + 1;
    char  *p = malloc(n);
    if (p) memcpy(p, s, n);
    return p;
}

static inline uint64_t hm__fnv1a(const char *s) {
    uint64_t h = 1469598103934665603ULL;
    for (; *s; s++) {
        h ^= (unsigned char)*s;
        h *= 1099511628211ULL;
    }
    return h;
}

static inline int hm_init(HashMap *m) {
    m->nbuckets = 16;
    m->count = 0;
    m->buckets = calloc(m->nbuckets, sizeof *m->buckets);
    return m->buckets ? 0 : -1;
}

static inline int hm__resize(HashMap *m, size_t new_n) {
    HmEntry **nb = calloc(new_n, sizeof *nb);
    if (!nb) return -1;
    for (size_t i = 0; i < m->nbuckets; i++) {
        HmEntry *e = m->buckets[i];
        while (e) {
            HmEntry *next = e->next;
            size_t   idx = hm__fnv1a(e->key) & (new_n - 1);
            e->next = nb[idx];
            nb[idx] = e;
            e = next;
        }
    }
    free(m->buckets);
    m->buckets = nb;
    m->nbuckets = new_n;
    return 0;
}

/* 있으면 값 갱신, 없으면 삽입. 0=성공, -1=메모리 부족. */
static inline int hm_put(HashMap *m, const char *key, long value) {
    size_t   idx = hm__fnv1a(key) & (m->nbuckets - 1);
    for (HmEntry *e = m->buckets[idx]; e; e = e->next) {
        if (strcmp(e->key, key) == 0) {
            e->value = value;
            return 0;
        }
    }
    HmEntry *e = malloc(sizeof *e);
    if (!e) return -1;
    e->key = hm__strdup(key); /* 키를 복사해서 소유 */
    if (!e->key) {
        free(e);
        return -1;
    }
    e->value = value;
    e->next = m->buckets[idx];
    m->buckets[idx] = e;
    m->count++;

    if (m->count * 4 > m->nbuckets * 3) /* load factor > 0.75 */
        hm__resize(m, m->nbuckets * 2);
    return 0;
}

/* 찾으면 값 포인터, 없으면 NULL. */
static inline long *hm_get(HashMap *m, const char *key) {
    size_t idx = hm__fnv1a(key) & (m->nbuckets - 1);
    for (HmEntry *e = m->buckets[idx]; e; e = e->next)
        if (strcmp(e->key, key) == 0) return &e->value;
    return NULL;
}

static inline void hm_free(HashMap *m) {
    for (size_t i = 0; i < m->nbuckets; i++) {
        HmEntry *e = m->buckets[i];
        while (e) {
            HmEntry *next = e->next;
            free(e->key);
            free(e);
            e = next;
        }
    }
    free(m->buckets);
    m->buckets = NULL;
    m->nbuckets = m->count = 0;
}

#endif /* CTUTOR_HASHMAP_H */
