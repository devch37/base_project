/*
 * main.c — kv CLI
 *
 *   kv [-f store.db] set <key> <value>
 *   kv [-f store.db] get <key>
 *   kv [-f store.db] del <key>
 *   kv [-f store.db] list
 *   kv [-f store.db] compact
 *
 * 종료 코드: 0 성공, 1 키 없음/실패, 2 사용법 오류.
 */
#include "kvstore.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void print_kv(const char *k, const char *v, void *ctx) {
    (void)ctx;
    printf("%s=%s\n", k, v);
}

static int usage(void) {
    fprintf(stderr,
            "사용법:\n"
            "  kv [-f 파일] set <key> <value>\n"
            "  kv [-f 파일] get <key>\n"
            "  kv [-f 파일] del <key>\n"
            "  kv [-f 파일] list\n"
            "  kv [-f 파일] compact\n");
    return 2;
}

int main(int argc, char **argv) {
    const char *path = "store.db";
    int         i = 1;

    if (i + 1 < argc && strcmp(argv[i], "-f") == 0) {
        path = argv[i + 1];
        i += 2;
    }
    if (i >= argc) return usage();

    const char *cmd = argv[i++];

    KvStore *s = kv_open(path);
    if (!s) {
        fprintf(stderr, "'%s' 열기 실패\n", path);
        return 1;
    }

    int rc = 0;

    if (strcmp(cmd, "set") == 0) {
        if (i + 2 != argc) {
            rc = usage();
        } else {
            KvResult r = kv_set(s, argv[i], argv[i + 1]);
            if (r != KV_OK) {
                fprintf(stderr, "set 실패: %s\n", kv_strerror(r));
                rc = 1;
            }
        }
    } else if (strcmp(cmd, "get") == 0) {
        if (i + 1 != argc) {
            rc = usage();
        } else {
            char    *val = NULL;
            KvResult r = kv_get(s, argv[i], &val);
            if (r == KV_OK) {
                printf("%s\n", val);
                free(val);
            } else if (r == KV_ERR_NOTFOUND) {
                fprintf(stderr, "(없음)\n");
                rc = 1;
            } else {
                fprintf(stderr, "get 실패: %s\n", kv_strerror(r));
                rc = 1;
            }
        }
    } else if (strcmp(cmd, "del") == 0) {
        if (i + 1 != argc) {
            rc = usage();
        } else {
            KvResult r = kv_del(s, argv[i]);
            if (r != KV_OK) {
                fprintf(stderr, "del 실패: %s\n", kv_strerror(r));
                rc = 1;
            }
        }
    } else if (strcmp(cmd, "list") == 0) {
        kv_foreach(s, print_kv, NULL);
        fprintf(stderr, "(%zu개)\n", kv_count(s));
    } else if (strcmp(cmd, "compact") == 0) {
        KvResult r = kv_compact(s);
        if (r != KV_OK) {
            fprintf(stderr, "compact 실패: %s\n", kv_strerror(r));
            rc = 1;
        } else {
            fprintf(stderr, "compact 완료 (%zu개 유지)\n", kv_count(s));
        }
    } else {
        rc = usage();
    }

    kv_close(s);
    return rc;
}
