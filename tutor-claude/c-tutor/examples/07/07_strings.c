/*
 * 07_strings.c — C 문자열의 실체: char 배열 + '\0'
 *   make run NAME=07_strings
 */
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[] = "hi"; /* {'h','i','\0'} — 크기 3 */
    printf("char s[] = \"hi\";\n");
    printf("  sizeof(s) = %zu  (널 종단자 포함)\n", sizeof(s));
    printf("  strlen(s) = %zu  (널 종단자 전까지)\n", strlen(s));
    printf("  바이트: ");
    for (size_t i = 0; i < sizeof(s); i++) {
        if (s[i] == '\0') printf("\\0 ");
        else printf("%c ", s[i]);
    }
    putchar('\n');

    /* '\0'(값 0) vs '0'(문자 48) vs "0"(문자열) */
    printf("\n'\\0' = %d,  '0' = %d,  \"0\"[0] = %d\n", '\0', '0', "0"[0]);

    /* 직접 문자열 만들기: 반드시 '\0' 을 붙인다 */
    char buf[16];
    buf[0] = 'O';
    buf[1] = 'K';
    buf[2] = '\0'; /* 이게 없으면 printf("%s") 가 어디서 멈출지 모름 */
    printf("직접 만든 문자열: %s\n", buf);

    /* 안전한 복사: snprintf 는 항상 '\0' 종단 + 크기 초과 방지 */
    char dst[8];
    int n = snprintf(dst, sizeof(dst), "%s", "this-is-too-long");
    printf("snprintf: dst=\"%s\"  (원했던 길이 %d, 잘림)\n", dst, n);

    return 0;
}
