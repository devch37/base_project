/*
 * 04_switch.c — switch 폴스루로 문자 분류하기
 *   make run NAME=04_switch
 */
#include <stdio.h>
#include <string.h>

int main(void) {
    const char *text = "Hello, C World!\n\tTabs and 123 digits.";
    int vowels = 0, consonants = 0, digits = 0, whitespace = 0, other = 0;

    for (const char *p = text; *p; p++) {
        char c = *p;
        switch (c) {
        case 'a': case 'e': case 'i': case 'o': case 'u':
        case 'A': case 'E': case 'I': case 'O': case 'U':
            vowels++;
            break;
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            digits++;
            break;
        case ' ': case '\t': case '\n':
            whitespace++;
            break;
        default:
            /* case 안에서 변수 선언은 블록으로 감싼다 */
            {
                int is_alpha = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
                if (is_alpha) consonants++;
                else other++;
            }
            break;
        }
    }

    printf("모음=%d 자음=%d 숫자=%d 공백=%d 기타=%d\n",
           vowels, consonants, digits, whitespace, other);
    return 0;
}
