/*
 * 13_readfile.c — 파일 전체를 메모리로 읽기: 에러 처리 + goto cleanup 완성형
 *   ./bin/13_readfile examples/13/13_readfile.c
 *   ./bin/13_readfile /없는/파일        # errno 메시지 확인
 */
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { E_OK = 0, E_IO = -1, E_NOMEM = -2 } Err;

/* 성공 시 *out 은 호출자가 free 해야 한다 (널 종단됨). */
static Err read_whole_file(const char *path, char **out, size_t *out_len) {
    Err   rc = E_IO;
    FILE *fp = fopen(path, "rb");
    if (!fp) return E_IO;

    char *buf = NULL;
    if (fseek(fp, 0, SEEK_END) != 0) goto done;
    long size = ftell(fp);
    if (size < 0) goto done;
    rewind(fp);

    buf = malloc((size_t)size + 1);
    if (!buf) {
        rc = E_NOMEM;
        goto done;
    }
    if (fread(buf, 1, (size_t)size, fp) != (size_t)size) goto done;
    buf[size] = '\0';

    *out = buf;
    *out_len = (size_t)size;
    buf = NULL; /* 소유권 이전: 아래 free 가 방금 넘긴 걸 해제하지 않도록 */
    rc = E_OK;

done:
    free(buf);
    fclose(fp);
    return rc;
}

int main(int argc, char **argv) {
    if (argc != 2) {
        fprintf(stderr, "usage: %s <file>\n", argv[0]);
        return 2;
    }

    char  *data;
    size_t len;
    errno = 0;
    Err e = read_whole_file(argv[1], &data, &len);
    if (e != E_OK) {
        fprintf(stderr, "읽기 실패 (%d): %s\n", e, strerror(errno));
        return 1;
    }

    printf("%zu 바이트 읽음. 첫 80자:\n", len);
    fwrite(data, 1, len < 80 ? len : 80, stdout);
    putchar('\n');
    free(data);
    return 0;
}
