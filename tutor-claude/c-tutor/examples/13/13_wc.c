/*
 * 13_wc.c — 'wc' 클론: 줄/단어/바이트 수 세기
 *   make run NAME=13_wc              (stdin 에서 읽음, Ctrl-D 로 종료)
 *   ./bin/13_wc examples/13/13_wc.c  (파일 인자)
 */
#include <ctype.h>
#include <stdio.h>

static void count_stream(FILE *fp, const char *name) {
    long lines = 0, words = 0, bytes = 0;
    int  c, in_word = 0;

    while ((c = fgetc(fp)) != EOF) {
        bytes++;
        if (c == '\n') lines++;
        if (isspace(c)) {
            in_word = 0;
        } else if (!in_word) {
            in_word = 1;
            words++;
        }
    }
    if (ferror(fp)) {
        perror(name);
        return;
    }
    printf("%8ld %8ld %8ld  %s\n", lines, words, bytes, name);
}

int main(int argc, char **argv) {
    if (argc < 2) {
        count_stream(stdin, "(stdin)");
        return 0;
    }
    for (int i = 1; i < argc; i++) {
        FILE *fp = fopen(argv[i], "rb");
        if (!fp) {
            perror(argv[i]);
            continue;
        }
        count_stream(fp, argv[i]);
        fclose(fp);
    }
    return 0;
}
