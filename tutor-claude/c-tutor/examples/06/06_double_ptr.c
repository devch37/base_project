/*
 * 06_double_ptr.c — 함수가 호출자의 "포인터 자체"를 바꾸려면 이중 포인터가 필요하다.
 *   make run NAME=06_double_ptr
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* 실패 버전: char * 를 값으로 받는다. 함수 안의 out 은 복사본이라
 * out 을 바꿔도 main 의 s 는 그대로다. */
static void alloc_broken(char *out) {
    out = malloc(16); /* main 의 s 가 아니라 지역 복사본만 바뀜 */
    if (out) strcpy(out, "hello");
    /* 게다가 이 malloc 은 아무도 free 못 함 → 누수 */
    free(out);
}

/* 올바른 버전: char ** 를 받아 *out 에 써서 main 의 s 를 바꾼다. */
static int alloc_ok(char **out) {
    char *buf = malloc(16);
    if (!buf) return -1;
    strcpy(buf, "hello");
    *out = buf; /* 여기서 호출자의 포인터가 갱신됨 */
    return 0;
}

int main(void) {
    char *s = NULL;

    alloc_broken(s);
    printf("alloc_broken 후 s = %s\n", s ? s : "(NULL 그대로!)");

    if (alloc_ok(&s) == 0) {
        printf("alloc_ok    후 s = %s\n", s);
        free(s);
    }
    return 0;
}
