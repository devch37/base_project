/*
 * 01_memory_map.c — 실행 중인 프로그램의 메모리 구역별 실제 주소를 찍어 본다.
 *
 *   make run NAME=01_memory_map
 *
 * 관찰 포인트:
 *   - text < data < bss < heap  <<<<  stack  (주소가 이 순서로 커진다)
 *   - 여러 번 실행하면 주소가 바뀐다 (ASLR: Address Space Layout Randomization)
 */

#include <stdio.h>
#include <stdlib.h>

int   initialized_global = 42; /* Data 세그먼트 (초기값이 있음) */
int   zero_global;             /* BSS 세그먼트 (0으로 시작) */
const char *literal = "리터럴 문자열"; /* 문자열 자체는 읽기 전용(rodata), 포인터는 Data */

static void some_function(void) { /* 함수 코드는 Text 세그먼트 */
}

int main(void) {
    int local = 1;                 /* 스택 */
    int *heap = malloc(sizeof *heap); /* heap 이 가리키는 대상은 힙, heap 변수 자체는 스택 */

    printf("== 낮은 주소 → 높은 주소 순서 ==\n");
    printf("[Text ] 함수 코드          : %p\n", (void *)&some_function);
    printf("[rodata] 문자열 리터럴     : %p\n", (void *)literal);
    printf("[Data ] 초기화된 전역      : %p\n", (void *)&initialized_global);
    printf("[BSS  ] 0으로 시작하는 전역: %p\n", (void *)&zero_global);
    printf("[Heap ] malloc 받은 메모리 : %p\n", (void *)heap);
    printf("[Stack] 지역 변수          : %p\n", (void *)&local);

    printf("\n스택과 힙 주소 차이(대략 얼마나 떨어져 있나): %ld MB\n",
           ((long)(void *)&local - (long)(void *)heap) / (1024 * 1024));

    free(heap);
    return 0;
}
