/*
 * 10_xmacro.c — X-macro: 데이터 목록 하나로 enum + 이름 테이블을 동시 생성
 *   make run NAME=10_xmacro
 *
 * 새 항목을 추가할 때 COLOR_LIST 한 줄만 고치면 된다.
 */
#include <stdio.h>

#define COLOR_LIST(X)                                                                               \
    X(RED, "red")                                                                                   \
    X(GREEN, "green")                                                                               \
    X(BLUE, "blue")

/* 1) enum 생성 */
typedef enum {
#define X(name, str) COLOR_##name,
    COLOR_LIST(X)
#undef X
        COLOR_COUNT
} Color;

/* 2) 이름 테이블 생성 */
static const char *color_name(Color c) {
    switch (c) {
#define X(name, str)                                                                                \
    case COLOR_##name:                                                                              \
        return str;
        COLOR_LIST(X)
#undef X
    default:
        return "?";
    }
}

int main(void) {
    printf("색 개수: %d\n", COLOR_COUNT);
    for (Color c = 0; c < COLOR_COUNT; c++) {
        printf("  %d -> %s\n", c, color_name(c));
    }
    return 0;
}
