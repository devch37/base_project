/* strutil.c — strutil 모듈 구현 */
#include "strutil.h"

#include <stdlib.h>
#include <string.h>

char *str_dup(const char *src) {
    size_t n = strlen(src) + 1;
    char  *p = malloc(n);
    if (!p) return NULL;
    memcpy(p, src, n);
    return p;
}

size_t str_copy(char *dst, size_t dst_size, const char *src) {
    size_t src_len = strlen(src);
    if (dst_size == 0) return src_len;

    size_t n = (src_len < dst_size - 1) ? src_len : dst_size - 1;
    memcpy(dst, src, n);
    dst[n] = '\0';
    return src_len; /* 호출자가 src_len >= dst_size 인지로 잘림 판단 */
}
