/*
 * test_kvstore.c — assert 기반 단위 테스트 (외부 프레임워크 없음)
 *   make test
 */
#include "kvstore.h"

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TEST_DB "test_store.db"

static int check_count = 0;
#define CHECK(cond)                                                                                 \
    do {                                                                                            \
        check_count++;                                                                              \
        if (!(cond)) {                                                                              \
            fprintf(stderr, "FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond);                         \
            exit(1);                                                                                \
        }                                                                                           \
    } while (0)

static char *get_dup(KvStore *s, const char *k) {
    char *v = NULL;
    return kv_get(s, k, &v) == KV_OK ? v : NULL;
}

static void test_basic(void) {
    remove(TEST_DB);
    KvStore *s = kv_open(TEST_DB);
    CHECK(s != NULL);

    CHECK(kv_set(s, "a", "1") == KV_OK);
    CHECK(kv_set(s, "b", "hello world") == KV_OK);
    CHECK(kv_count(s) == 2);

    char *v = get_dup(s, "a");
    CHECK(v && strcmp(v, "1") == 0);
    free(v);
    v = get_dup(s, "b");
    CHECK(v && strcmp(v, "hello world") == 0);
    free(v);

    /* 덮어쓰기 */
    CHECK(kv_set(s, "a", "42") == KV_OK);
    v = get_dup(s, "a");
    CHECK(v && strcmp(v, "42") == 0);
    free(v);
    CHECK(kv_count(s) == 2);

    /* 삭제 */
    CHECK(kv_del(s, "b") == KV_OK);
    CHECK(kv_get(s, "b", &v) == KV_ERR_NOTFOUND);
    CHECK(kv_del(s, "b") == KV_ERR_NOTFOUND);
    CHECK(kv_count(s) == 1);

    /* 잘못된 키/값 */
    CHECK(kv_set(s, "", "x") == KV_ERR_BADKEY);
    CHECK(kv_get(s, "", &v) == KV_ERR_BADKEY);

    kv_close(s);
}

static void test_persistence(void) {
    /* 위 test_basic 이 남긴 파일을 다시 연다: a=42 만 살아 있어야 */
    KvStore *s = kv_open(TEST_DB);
    CHECK(s != NULL);
    CHECK(kv_count(s) == 1);
    char *v = get_dup(s, "a");
    CHECK(v && strcmp(v, "42") == 0);
    free(v);
    CHECK(kv_get(s, "b", &v) == KV_ERR_NOTFOUND);
    kv_close(s);
}

static void test_compact(void) {
    remove(TEST_DB);
    KvStore *s = kv_open(TEST_DB);
    for (int i = 0; i < 100; i++) {
        char key[16], val[16];
        snprintf(key, sizeof key, "k%d", i % 10); /* 같은 10개 키를 반복 갱신 */
        snprintf(val, sizeof val, "v%d", i);
        CHECK(kv_set(s, key, val) == KV_OK);
    }
    CHECK(kv_count(s) == 10);

    FILE *f = fopen(TEST_DB, "rb");
    fseek(f, 0, SEEK_END);
    long before = ftell(f);
    fclose(f);

    CHECK(kv_compact(s) == KV_OK);
    CHECK(kv_count(s) == 10);

    f = fopen(TEST_DB, "rb");
    fseek(f, 0, SEEK_END);
    long after = ftell(f);
    fclose(f);

    CHECK(after < before); /* compact 이 파일을 줄였다 */

    char *v = get_dup(s, "k3");
    CHECK(v && strcmp(v, "v93") == 0); /* 마지막 값 (i=93 -> k3=v93) */
    free(v);
    kv_close(s);

    /* compact 후에도 재오픈되는지 */
    s = kv_open(TEST_DB);
    CHECK(s && kv_count(s) == 10);
    kv_close(s);
}

static void test_crash_recovery(void) {
    remove(TEST_DB);
    KvStore *s = kv_open(TEST_DB);
    CHECK(kv_set(s, "safe", "value") == KV_OK);
    kv_close(s);

    /* 로그 끝에 쓰레기 바이트를 붙인다 (torn write 시뮬레이션) */
    FILE *f = fopen(TEST_DB, "ab");
    const unsigned char junk[] = {'K', 'S', 0, 0, 0, 5, 0, 0, 0, 9, 'x'};
    fwrite(junk, 1, sizeof junk, f);
    fclose(f);

    /* 재오픈: 손상된 꼬리를 잘라내고 정상 복구되어야 */
    s = kv_open(TEST_DB);
    CHECK(s != NULL);
    CHECK(kv_count(s) == 1);
    char *v = get_dup(s, "safe");
    CHECK(v && strcmp(v, "value") == 0);
    free(v);

    /* 그리고 이후 쓰기가 정상 동작 */
    CHECK(kv_set(s, "after", "recovery") == KV_OK);
    kv_close(s);

    s = kv_open(TEST_DB);
    CHECK(kv_count(s) == 2);
    kv_close(s);
}

int main(void) {
    test_basic();
    test_persistence();
    test_compact();
    test_crash_recovery();
    remove(TEST_DB);
    printf("모든 테스트 통과 (%d checks)\n", check_count);
    return 0;
}
