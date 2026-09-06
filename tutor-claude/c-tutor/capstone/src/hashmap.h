/* hashmap.h — string -> string 해시맵 (체이닝 + FNV-1a + 리사이즈).
 * 소유권: 키와 값을 모두 복사해서 소유한다. 갱신 시 옛 값을 free.
 *         hm_free 가 전부 해제. (15장 해시맵을 값 타입 char* 로 확장한 것) */
#ifndef KV_HASHMAP_H
#define KV_HASHMAP_H

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

typedef struct HmEntry {
    char           *key;
    char           *value;
    struct HmEntry *next;
} HmEntry;

typedef struct {
    HmEntry **buckets;
    size_t    nbuckets;
    size_t    count;
} HashMap;

static inline char *hm__strdup(const char *s) {
    size_t n = strlen(s) + 1;
    char  *p = malloc(n);
    if (p) memcpy(p, s, n);
    return p;
}

static inline uint64_t hm__hash(const char *s) {
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

static inline void hm_free(HashMap *m) {
    if (!m->buckets) return;
    for (size_t i = 0; i < m->nbuckets; i++) {
        HmEntry *e = m->buckets[i];
        while (e) {
            HmEntry *next = e->next;
            free(e->key);
            free(e->value);
            free(e);
            e = next;
        }
    }
    free(m->buckets);
    m->buckets = NULL;
    m->nbuckets = m->count = 0;
}

static inline int hm__resize(HashMap *m, size_t new_n) {
    HmEntry **nb = calloc(new_n, sizeof *nb);
    if (!nb) return -1;
    for (size_t i = 0; i < m->nbuckets; i++) {
        HmEntry *e = m->buckets[i];
        while (e) {
            HmEntry *next = e->next;
            size_t   idx = hm__hash(e->key) & (new_n - 1);
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

/* 있으면 값 교체, 없으면 삽입. 0=성공, -1=메모리 부족(맵은 변경되지 않음). */
static inline int hm_put(HashMap *m, const char *key, const char *value) {
    size_t idx = hm__hash(key) & (m->nbuckets - 1);
    for (HmEntry *e = m->buckets[idx]; e; e = e->next) {
        if (strcmp(e->key, key) == 0) {
            char *nv = hm__strdup(value);
            if (!nv) return -1;
            free(e->value);
            e->value = nv;
            return 0;
        }
    }
    HmEntry *e = malloc(sizeof *e);
    if (!e) return -1;
    e->key = hm__strdup(key);
    e->value = hm__strdup(value);
    if (!e->key || !e->value) {
        free(e->key);
        free(e->value);
        free(e);
        return -1;
    }
    e->next = m->buckets[idx];
    m->buckets[idx] = e;
    m->count++;
    if (m->count * 4 > m->nbuckets * 3) hm__resize(m, m->nbuckets * 2);
    return 0;
}

/* 찾으면 내부 값 포인터(빌림, free 금지), 없으면 NULL. */
static inline const char *hm_get(const HashMap *m, const char *key) {
    size_t idx = hm__hash(key) & (m->nbuckets - 1);
    for (HmEntry *e = m->buckets[idx]; e; e = e->next)
        if (strcmp(e->key, key) == 0) return e->value;
    return NULL;
}

/* 있으면 제거하고 1, 없으면 0. */
static inline int hm_del(HashMap *m, const char *key) {
    size_t    idx = hm__hash(key) & (m->nbuckets - 1);
    HmEntry **pp = &m->buckets[idx];
    while (*pp) {
        HmEntry *cur = *pp;
        if (strcmp(cur->key, key) == 0) {
            *pp = cur->next;
            free(cur->key);
            free(cur->value);
            free(cur);
            m->count--;
            return 1;
        }
        pp = &cur->next;
    }
    return 0;
}

static inline void hm_foreach(const HashMap *m, void (*fn)(const char *, const char *, void *),
                              void *ctx) {
    for (size_t i = 0; i < m->nbuckets; i++)
        for (HmEntry *e = m->buckets[i]; e; e = e->next) fn(e->key, e->value, ctx);
}

#endif /* KV_HASHMAP_H */
