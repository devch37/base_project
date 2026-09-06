/*
 * 20_overflow.c — 스택 버퍼 오버플로우: 취약 버전 vs 안전 버전
 *   make run  NAME=20_overflow "그냥 짧은 입력"
 *   make asan NAME=20_overflow            # 긴 입력에서 stack-buffer-overflow 탐지
 *   ./bin/20_overflow AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
 */
#include <stdio.h>
#include <string.h>

/* 취약: 입력 길이를 검사하지 않고 고정 버퍼에 복사 */
static void vulnerable(const char *input) {
    char buf[32];
    strcpy(buf, input); /* input 이 31자를 넘으면 buf 를 침범 */
    printf("[취약] buf = %s\n", buf);
}

/* 안전: 크기를 명시하고 항상 '\0' 종단 */
static void safe(const char *input) {
    char   buf[32];
    size_t need = (size_t)snprintf(buf, sizeof buf, "%s", input);
    printf("[안전] buf = %s%s\n", buf, need >= sizeof buf ? "  (잘림)" : "");
}

int main(int argc, char **argv) {
    const char *input = (argc > 1) ? argv[1] : "hello";
    printf("입력 길이: %zu\n", strlen(input));

    safe(input);
    printf("취약 함수 호출... (긴 입력 + ASan 이면 여기서 잡힘)\n");
    vulnerable(input);
    printf("(여기까지 왔다면 스택이 조용히 손상됐거나 입력이 짧았던 것)\n");
    return 0;
}
