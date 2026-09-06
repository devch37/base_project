/*
 * 09_layout.c — 구조체 메모리 레이아웃: 패딩과 정렬
 *   make run NAME=09_layout
 */
#include <stdalign.h>
#include <stddef.h>
#include <stdio.h>

struct Bad {
    char a;
    int  b;
    char c;
};

struct Good {
    int  b;
    char a;
    char c;
};

/* 레이아웃이 실수로 바뀌면 컴파일 실패시키기 (실무에서 프로토콜 구조체에 자주 씀) */
_Static_assert(sizeof(struct Good) == 8, "Good 레이아웃이 예상과 다름");

int main(void) {
    printf("struct Bad  (char, int, char)\n");
    printf("  offsetof(a)=%zu  offsetof(b)=%zu  offsetof(c)=%zu\n",
           offsetof(struct Bad, a), offsetof(struct Bad, b), offsetof(struct Bad, c));
    printf("  sizeof = %zu  alignof = %zu   <- 패딩 %zu 바이트 낭비\n\n",
           sizeof(struct Bad), alignof(struct Bad),
           sizeof(struct Bad) - (sizeof(char) * 2 + sizeof(int)));

    printf("struct Good (int, char, char)  <- 큰 멤버부터\n");
    printf("  offsetof(b)=%zu  offsetof(a)=%zu  offsetof(c)=%zu\n",
           offsetof(struct Good, b), offsetof(struct Good, a), offsetof(struct Good, c));
    printf("  sizeof = %zu  alignof = %zu\n", sizeof(struct Good), alignof(struct Good));

    printf("\n교훈: 멤버를 크기 내림차순으로 배치하면 패딩이 줄고 캐시 효율이 오른다.\n");
    return 0;
}
