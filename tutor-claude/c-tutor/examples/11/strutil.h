/* strutil.h — 작은 문자열 유틸 (공개 인터페이스) */
#ifndef CTUTOR_STRUTIL_H
#define CTUTOR_STRUTIL_H

#include <stddef.h>

/* src 를 새 버퍼에 복사해 반환한다.
 * 소유권: 호출자가 free 해야 한다. 실패(메모리 부족) 시 NULL. */
char *str_dup(const char *src);

/* dst(크기 dst_size)에 src 를 안전하게 복사한다. 항상 '\0' 종단.
 * 반환: 잘림 없이 복사됐으면 복사한 길이, 잘렸으면 필요한 전체 길이. */
size_t str_copy(char *dst, size_t dst_size, const char *src);

#endif /* CTUTOR_STRUTIL_H */
