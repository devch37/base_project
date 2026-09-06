/*
 * 05_lifetime.c — 스코프 vs 수명. static 지역 변수 vs 반환된 지역 변수 주소.
 *   make run  NAME=05_lifetime
 *   make asan NAME=05_lifetime   # ASan 이 stack-use-after-return 을 잡아냄
 */
#include <stdio.h>

/* static: 수명은 프로그램 전체, 초기화는 한 번. 호출 간에 값이 유지된다. */
static int *good_counter(void) {
    static int count = 0;
    count++;
    return &count; /* 안전: count 는 프로그램이 끝날 때까지 산다 */
}

/* 위험: local 은 함수가 return 하는 순간 사라진다 (프레임 회수). */
static int *dangling(void) {
    int local = 42;
    return &local; /* -Wreturn-stack-address 경고. 이 주소는 곧 무효 */
}

int main(void) {
    printf("[good] %d\n", *good_counter());
    printf("[good] %d\n", *good_counter());
    printf("[good] %d  (호출 간에 값 유지)\n", *good_counter());

    int *p = dangling();
    /* 다른 함수 호출이 방금 그 스택 자리를 덮어쓴다 */
    printf("[dangling] 바로 읽기: %d\n", *p);
    printf("[dangling] printf 이후 읽기: %d  (쓰레기로 바뀔 수 있음)\n", *p);
    printf("=> 일반 빌드에선 '운 좋게' 42가 보일 수 있지만 이건 UB다. asan 으로 확인하라.\n");
    return 0;
}
