/*
 * 05_stack.c — 재귀 호출마다 스택 프레임이 한 방향으로 쌓이는 것을 관찰
 *   make run NAME=05_stack
 */
#include <stdio.h>

static void recurse(int depth, const void *caller_local) {
    int my_local; /* 이 호출의 프레임에 있는 지역 변수 */

    long delta = (long)caller_local - (long)(void *)&my_local;
    printf("depth=%2d  &my_local=%p  (호출자 프레임과 %ld 바이트 차이)\n",
           depth, (void *)&my_local, delta);

    if (depth >= 8) return;
    recurse(depth + 1, &my_local);
}

int main(void) {
    int start;
    printf("스택은 보통 높은 주소 -> 낮은 주소로 자란다.\n");
    printf("main &start = %p\n\n", (void *)&start);
    recurse(0, &start);

    printf("\n각 프레임 차이가 이 함수의 프레임 크기(대략)다.\n");
    printf("여기서 'int big[1000000]' 같은 큰 지역 배열을 만들면 스택 오버플로우가 난다.\n");
    return 0;
}
