/*
 * 00_hello.c — 첫 C 프로그램
 *
 * 빌드:  make run NAME=00_hello
 *   또는 cc -std=c11 -Wall -Wextra 00_hello.c -o 00_hello && ./00_hello
 */

#include <stdio.h> /* printf 의 "선언"만 가져온다. 구현은 링크 단계에서 붙는다. */

int main(void) { /* OS는 프로그램을 시작할 때 main 을 호출한다. void = 인자 없음 */
    printf("안녕하세요, C의 세계에 오신 걸 환영합니다.\n");
    printf("이 문장은 컴파일러가 기계어로 번역해서, CPU가 직접 실행한 결과입니다.\n");

    /*
     * return 값은 프로세스의 "종료 코드"가 된다.
     *   0        = 성공 (관례)
     *   1..255   = 실패 (의미는 프로그램마다 정함)
     * 셸에서 `echo $?` 로 확인할 수 있다.
     */
    return 0;
}
