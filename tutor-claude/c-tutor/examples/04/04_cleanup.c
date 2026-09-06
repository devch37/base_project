/*
 * 04_cleanup.c — goto 로 자원 정리 (실무에서 goto 가 정당한 유일한 패턴)
 *   make run  NAME=04_cleanup
 *   make asan NAME=04_cleanup    # 어느 경로로 나가든 누수가 없는지 검증
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* 세 개의 자원을 순서대로 얻고, 실패하면 얻은 것만 역순으로 해제한다. */
static int build_message(size_t n, char **out) {
    int rc = -1;
    char *a = NULL, *b = NULL, *c = NULL;

    a = malloc(n);
    if (!a) goto out;

    b = malloc(n);
    if (!b) goto free_a;

    c = malloc(n);
    if (!c) goto free_b;

    snprintf(a, n, "part-A");
    snprintf(b, n, "part-B");
    snprintf(c, n, "%s+%s", a, b);

    *out = c; /* 성공: c 의 소유권을 호출자에게 넘긴다 (a, b 는 여기서 해제) */
    c = NULL; /* 아래 free(c) 가 방금 넘긴 걸 해제하지 않도록 */
    rc = 0;

free_b:
    free(c); /* 성공 시엔 NULL, free(NULL) 은 안전 */
    free(b);
free_a:
    free(a);
out:
    return rc;
}

int main(void) {
    char *msg = NULL;
    if (build_message(32, &msg) == 0) {
        printf("결과: %s\n", msg);
        free(msg); /* 호출자가 소유권을 받았으므로 호출자가 해제 */
    } else {
        printf("build_message 실패\n");
    }
    return 0;
}
