/*
 * kvstore.c — 미니 키-값 저장소 구현
 *
 * 로그 레코드 형식 (모두 빅엔디언, 이식성):
 *   +0   magic  1B  = 'K'
 *   +1   op     1B  = 'S'(set) | 'D'(del)
 *   +2   klen   4B
 *   +6   vlen   4B   (del 이면 0)
 *   +10  key    klen B
 *        val    vlen B
 *        crc32  4B   ( op..val 구간에 대한 CRC32 )
 *
 * 크래시 복구: 재생 중 잘린/손상된 레코드를 만나면 그 지점까지 파일을 잘라내고 멈춘다.
 */
/* ftruncate / fileno 는 POSIX. 시스템 헤더보다 먼저 선언해야 한다. */
#define _POSIX_C_SOURCE 200809L

#include "kvstore.h"

#include "hashmap.h"
#include "serialize.h"

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h> /* ftruncate, fileno */

#define REC_MAGIC 'K'
#define OP_SET 'S'
#define OP_DEL 'D'
#define HDR_SIZE 10
#define MAX_KEY_LEN (64u * 1024u)
#define MAX_VAL_LEN (16u * 1024u * 1024u)

struct KvStore {
    FILE   *fp;   /* append 모드로 열린 로그 파일 */
    char   *path; /* 소유 */
    HashMap idx;  /* string -> string */
};

const char *kv_strerror(KvResult r) {
    switch (r) {
    case KV_OK:           return "성공";
    case KV_ERR_IO:       return "입출력 오류";
    case KV_ERR_NOMEM:    return "메모리 부족";
    case KV_ERR_CORRUPT:  return "로그 손상";
    case KV_ERR_NOTFOUND: return "키를 찾을 수 없음";
    case KV_ERR_BADKEY:   return "잘못된 키 또는 값 (빈 키/과도한 길이)";
    }
    return "알 수 없는 오류";
}

/* op, key, val 을 하나의 레코드로 fp 끝에 기록한다. 0=성공, -1=IO 실패. */
static int write_record(FILE *fp, char op, const char *key, size_t klen, const char *val,
                        size_t vlen) {
    unsigned char hdr[HDR_SIZE];
    hdr[0] = REC_MAGIC;
    hdr[1] = (unsigned char)op;
    put_u32_be(hdr + 2, (uint32_t)klen);
    put_u32_be(hdr + 6, (uint32_t)vlen);

    uint32_t crc = 0;
    crc = crc32_update(crc, hdr + 1, HDR_SIZE - 1); /* op + klen + vlen */
    crc = crc32_update(crc, key, klen);
    if (vlen) crc = crc32_update(crc, val, vlen);

    unsigned char crc_be[4];
    put_u32_be(crc_be, crc);

    if (fwrite(hdr, 1, HDR_SIZE, fp) != HDR_SIZE) return -1;
    if (klen && fwrite(key, 1, klen, fp) != klen) return -1;
    if (vlen && fwrite(val, 1, vlen, fp) != vlen) return -1;
    if (fwrite(crc_be, 1, 4, fp) != 4) return -1;
    if (fflush(fp) != 0) return -1;
    return 0;
}

/* 로그를 처음부터 재생하여 idx 를 채운다. 손상 지점에서 truncate 후 멈춘다. */
static KvResult replay(struct KvStore *s) {
    FILE *rp = fopen(s->path, "rb");
    if (!rp) return KV_ERR_IO;

    KvResult rc = KV_OK;
    long     good = 0; /* 온전하게 읽힌 레코드들의 끝 오프셋 */
    char    *key = NULL, *val = NULL;

    for (;;) {
        unsigned char hdr[HDR_SIZE];
        size_t        got = fread(hdr, 1, HDR_SIZE, rp);
        if (got == 0) break;          /* 정상 EOF */
        if (got < HDR_SIZE) break;    /* 잘린 헤더 → 버림 */
        if (hdr[0] != REC_MAGIC) break;

        char     op = (char)hdr[1];
        uint32_t klen = get_u32_be(hdr + 2);
        uint32_t vlen = get_u32_be(hdr + 6);

        /* 20장: 파일이 주장하는 길이를 그대로 믿지 않는다 */
        if (klen == 0 || klen > MAX_KEY_LEN || vlen > MAX_VAL_LEN) break;
        if (op != OP_SET && op != OP_DEL) break;

        key = malloc(klen + 1);
        val = malloc((size_t)vlen + 1);
        if (!key || !val) {
            rc = KV_ERR_NOMEM;
            goto done;
        }
        if (fread(key, 1, klen, rp) != klen) break;
        if (vlen && fread(val, 1, vlen, rp) != vlen) break;
        key[klen] = '\0';
        val[vlen] = '\0';

        unsigned char crc_be[4];
        if (fread(crc_be, 1, 4, rp) != 4) break;

        uint32_t want = get_u32_be(crc_be);
        uint32_t have = 0;
        have = crc32_update(have, hdr + 1, HDR_SIZE - 1);
        have = crc32_update(have, key, klen);
        if (vlen) have = crc32_update(have, val, vlen);
        if (want != have) break; /* torn write → 버림 */

        if (op == OP_SET) {
            if (hm_put(&s->idx, key, val) != 0) {
                rc = KV_ERR_NOMEM;
                goto done;
            }
        } else {
            hm_del(&s->idx, key);
        }

        free(key);
        free(val);
        key = val = NULL;
        good = ftell(rp);
        if (good < 0) {
            rc = KV_ERR_IO;
            goto done;
        }
    }

    /* 손상/잔여 바이트를 잘라낸다 (크래시 복구) */
    {
        long end = 0;
        if (fseek(rp, 0, SEEK_END) == 0) end = ftell(rp);
        if (end > good) {
            fflush(s->fp);
            if (ftruncate(fileno(s->fp), good) != 0) rc = KV_ERR_IO;
        }
    }

done:
    free(key);
    free(val);
    fclose(rp);
    return rc;
}

KvStore *kv_open(const char *path) {
    if (!path) return NULL;

    struct KvStore *s = calloc(1, sizeof *s);
    if (!s) return NULL;

    s->path = malloc(strlen(path) + 1);
    if (!s->path) {
        free(s);
        return NULL;
    }
    strcpy(s->path, path);

    if (hm_init(&s->idx) != 0) {
        free(s->path);
        free(s);
        return NULL;
    }

    /* "a+b": 없으면 생성, 쓰기는 항상 파일 끝에 */
    s->fp = fopen(path, "a+b");
    if (!s->fp) {
        hm_free(&s->idx);
        free(s->path);
        free(s);
        return NULL;
    }

    if (replay(s) != KV_OK) {
        kv_close(s);
        return NULL;
    }
    return s;
}

void kv_close(KvStore *s) {
    if (!s) return;
    if (s->fp) fclose(s->fp);
    hm_free(&s->idx);
    free(s->path);
    free(s);
}

static int valid_key(const char *k) { return k && k[0] != '\0' && strlen(k) <= MAX_KEY_LEN; }

KvResult kv_set(KvStore *s, const char *key, const char *value) {
    if (!s || !value) return KV_ERR_BADKEY;
    if (!valid_key(key)) return KV_ERR_BADKEY;
    size_t vlen = strlen(value);
    if (vlen > MAX_VAL_LEN) return KV_ERR_BADKEY;

    if (write_record(s->fp, OP_SET, key, strlen(key), value, vlen) != 0) return KV_ERR_IO;
    if (hm_put(&s->idx, key, value) != 0) return KV_ERR_NOMEM;
    return KV_OK;
}

KvResult kv_get(KvStore *s, const char *key, char **out_value) {
    if (!s || !valid_key(key) || !out_value) return KV_ERR_BADKEY;
    const char *v = hm_get(&s->idx, key);
    if (!v) return KV_ERR_NOTFOUND;

    char *copy = malloc(strlen(v) + 1);
    if (!copy) return KV_ERR_NOMEM;
    strcpy(copy, v);
    *out_value = copy; /* 소유권: 호출자가 free */
    return KV_OK;
}

KvResult kv_del(KvStore *s, const char *key) {
    if (!s || !valid_key(key)) return KV_ERR_BADKEY;
    if (!hm_get(&s->idx, key)) return KV_ERR_NOTFOUND;

    if (write_record(s->fp, OP_DEL, key, strlen(key), NULL, 0) != 0) return KV_ERR_IO;
    hm_del(&s->idx, key);
    return KV_OK;
}

size_t kv_count(const KvStore *s) { return s ? s->idx.count : 0; }

void kv_foreach(const KvStore *s, void (*fn)(const char *, const char *, void *), void *ctx) {
    if (s && fn) hm_foreach(&s->idx, fn, ctx);
}

struct compact_ctx {
    FILE *out;
    int   err;
};

static void compact_emit(const char *k, const char *v, void *p) {
    struct compact_ctx *c = p;
    if (c->err) return;
    if (write_record(c->out, OP_SET, k, strlen(k), v, strlen(v)) != 0) c->err = 1;
}

KvResult kv_compact(KvStore *s) {
    if (!s) return KV_ERR_BADKEY;

    size_t tmplen = strlen(s->path) + 5;
    char  *tmp = malloc(tmplen);
    if (!tmp) return KV_ERR_NOMEM;
    snprintf(tmp, tmplen, "%s.tmp", s->path);

    FILE *out = fopen(tmp, "wb");
    if (!out) {
        free(tmp);
        return KV_ERR_IO;
    }

    struct compact_ctx c = {out, 0};
    hm_foreach(&s->idx, compact_emit, &c);

    if (c.err || fflush(out) != 0 || fclose(out) != 0) {
        remove(tmp);
        free(tmp);
        return KV_ERR_IO;
    }

    /* 기존 로그를 새 로그로 원자적 교체 */
    fclose(s->fp);
    s->fp = NULL;
    if (rename(tmp, s->path) != 0) {
        remove(tmp);
        free(tmp);
        s->fp = fopen(s->path, "a+b"); /* 원상 복구 시도 */
        return KV_ERR_IO;
    }
    free(tmp);

    s->fp = fopen(s->path, "a+b");
    return s->fp ? KV_OK : KV_ERR_IO;
}
