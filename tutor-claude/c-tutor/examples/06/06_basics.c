/*
 * 06_basics.c — 변수 / 주소 / 포인터 / 역참조의 관계를 눈으로 확인
 *   make run NAME=06_basics
 */
#include <stdio.h>

int main(void) {
    int x = 20;
    int *p = &x; /* p 는 x 의 주소를 담는다 */

    printf("x        = %d        (값)\n", x);
    printf("&x       = %p   (x 가 사는 집 주소)\n", (void *)&x);
    printf("p        = %p   (p 안에 든 값 = x 의 주소)\n", (void *)p);
    printf("&p       = %p   (p 자신이 사는 집 주소, x 와 다름)\n", (void *)&p);
    printf("*p       = %d        (p 가 가리키는 곳의 값)\n", *p);

    *p = 99; /* p 를 통해 x 를 바꾼다 */
    printf("\n*p = 99 실행 후 -> x = %d\n", x);

    /* 포인터 산술: +1 은 sizeof(int) 만큼 이동 */
    printf("\np     = %p\n", (void *)p);
    printf("p + 1 = %p  (%zu 바이트 뒤, sizeof(int))\n", (void *)(p + 1), sizeof(int));

    /* 포인터의 크기는 타입과 무관하게 동일 */
    char *cp;
    double *dp;
    printf("\nsizeof(int*)=%zu  sizeof(char*)=%zu  sizeof(double*)=%zu\n",
           sizeof p, sizeof cp, sizeof dp);
    (void)cp;
    (void)dp;
    return 0;
}
