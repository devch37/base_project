/*
 * 21_style.c — "좋은 습관"이 적용된 작은 파일의 예 (프로젝트가 다르게 정하면 그걸 따른다)
 *   make run NAME=21_style
 *
 * 포인트:
 *   - 헬퍼는 static
 *   - const 적극 사용
 *   - early return 으로 중첩 줄이기
 *   - 매직 넘버 대신 명명 상수
 *   - 모든 malloc 에 소유권 주석과 짝 free
 *   - 경고 0 (-Wall -Wextra -Wpedantic)
 */
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { MAX_WORD_LEN = 64 };

/* 문자열이 팰린드롬인지 (영문자만, 대소문자 무시). early return 으로 평탄하게. */
static int is_palindrome(const char *s) {
    if (s == NULL) return 0;

    size_t i = 0;
    size_t j = strlen(s);
    if (j == 0) return 1;
    j--;

    while (i < j) {
        while (i < j && !isalpha((unsigned char)s[i])) i++; /* ctype 엔 unsigned char */
        while (i < j && !isalpha((unsigned char)s[j])) j--;
        if (tolower((unsigned char)s[i]) != tolower((unsigned char)s[j])) return 0;
        i++;
        j--;
    }
    return 1;
}

/* 소유권: 반환된 문자열은 호출자가 free 해야 한다. 실패 시 NULL. */
static char *shout(const char *s) {
    size_t n = strlen(s);
    char  *out = malloc(n + 1);
    if (out == NULL) return NULL;
    for (size_t k = 0; k < n; k++) out[k] = (char)toupper((unsigned char)s[k]);
    out[n] = '\0';
    return out;
}

int main(void) {
    const char *tests[] = {"level", "A man, a plan, a canal: Panama", "hello", ""};

    for (size_t t = 0; t < sizeof tests / sizeof tests[0]; t++) {
        char *loud = shout(tests[t]);
        if (loud == NULL) {
            fprintf(stderr, "메모리 부족\n");
            return 1;
        }
        printf("%-40s palindrome=%d  shout=%s\n", tests[t], is_palindrome(tests[t]), loud);
        free(loud); /* shout 의 짝 free */
    }
    return 0;
}
