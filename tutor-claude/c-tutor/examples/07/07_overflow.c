/*
 * 07_overflow.c — off-by-one 경계 초과. 일부러 버그를 넣어 두었다.
 *   make run  NAME=07_overflow    # 일반 빌드: '운 좋게' 통과하거나 이상 동작
 *   make asan NAME=07_overflow    # ASan 이 정확한 줄과 함께 잡아냄
 *
 * 실습: 아래 '<' 를 '<=' 로 바꿔서 확실한 오버플로우를 만들어 보라.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    /* 스택 배열 경계 */
    int a[8];
    for (int i = 0; i < 8; i++) a[i] = i * i;
    printf("a[7] = %d\n", a[7]);
    /* a[8] = 999;  <-- 주석을 풀면 stack-buffer-overflow */

    /* 힙 버퍼 경계 */
    char *buf = malloc(8);
    strcpy(buf, "1234567"); /* 7글자 + '\0' = 8바이트, 딱 맞음 */
    printf("buf = %s\n", buf);
    /* strcpy(buf, "12345678");  <-- 주석을 풀면 heap-buffer-overflow (9바이트 필요) */
    free(buf);

    printf("주석 처리된 두 줄을 풀고 'make asan NAME=07_overflow' 로 확인하라.\n");
    return 0;
}
