/*
 * kvstore.h — 디스크에 영속되는 미니 키-값 저장소 (공개 API)
 *
 * 설계: append-only 로그 파일 + 인메모리 해시맵 인덱스.
 *       (Bitcask / Redis AOF 의 축소판. 자세한 건 docs/22 참고)
 */
#ifndef KVSTORE_H
#define KVSTORE_H

#include <stddef.h>

/* 불투명 포인터: 내부 구조는 kvstore.c 만 안다 (11장). */
typedef struct KvStore KvStore;

typedef enum {
    KV_OK = 0,
    KV_ERR_IO = -1,       /* 파일 입출력 실패 (errno 참고) */
    KV_ERR_NOMEM = -2,    /* 메모리 부족 */
    KV_ERR_CORRUPT = -3,  /* 로그 파일 손상 (복구 불가한 형태) */
    KV_ERR_NOTFOUND = -4, /* 키 없음 */
    KV_ERR_BADKEY = -5,   /* 빈 키, 또는 너무 긴 키/값 */
} KvResult;

/* 로그를 열고(없으면 생성) 재생하여 인덱스를 만든다. 실패 시 NULL. */
KvStore *kv_open(const char *path);

/* 모든 자원 해제. s 가 NULL 이면 아무것도 안 함. */
void kv_close(KvStore *s);

/* key -> value 설정 (덮어쓰기). 로그에 즉시 flush. */
KvResult kv_set(KvStore *s, const char *key, const char *value);

/* 성공 시 *out_value 에 값의 복사본을 넣는다. 호출자가 free 해야 한다. */
KvResult kv_get(KvStore *s, const char *key, char **out_value);

/* 키 삭제. 없으면 KV_ERR_NOTFOUND. */
KvResult kv_del(KvStore *s, const char *key);

/* 현재 저장된 키 개수. */
size_t kv_count(const KvStore *s);

/* 모든 (키, 값) 쌍에 대해 fn 호출. 순서는 보장되지 않는다. */
void kv_foreach(const KvStore *s, void (*fn)(const char *k, const char *v, void *ctx), void *ctx);

/* 로그를 현재 인덱스만으로 다시 써서 죽은 레코드를 제거한다. */
KvResult kv_compact(KvStore *s);

/* KvResult 를 사람이 읽는 문자열로. */
const char *kv_strerror(KvResult r);

#endif /* KVSTORE_H */
