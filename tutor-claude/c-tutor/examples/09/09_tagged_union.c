/*
 * 09_tagged_union.c — 태그 유니온: "여러 타입 중 하나"를 안전하게 표현
 *   make run NAME=09_tagged_union
 *
 * tag 로 "지금 무엇인지"를 기록하고, 읽기 전에 반드시 tag 를 확인한다.
 * 이 패턴은 22장 캡스톤의 값 저장에 그대로 쓰인다.
 */
#include <stdio.h>

typedef enum { V_NULL, V_INT, V_STR } ValueTag;

typedef struct {
    ValueTag tag;
    union {
        long        as_int;
        const char *as_str;
    };
} Value;

static Value make_int(long n) { return (Value){.tag = V_INT, .as_int = n}; }
static Value make_str(const char *s) { return (Value){.tag = V_STR, .as_str = s}; }
static Value make_null(void) { return (Value){.tag = V_NULL}; }

static void print_value(Value v) {
    switch (v.tag) {
    case V_NULL: printf("null\n"); break;
    case V_INT:  printf("int: %ld\n", v.as_int); break;
    case V_STR:  printf("str: \"%s\"\n", v.as_str); break;
    default:     printf("<알 수 없는 tag %d>\n", v.tag); break;
    }
}

int main(void) {
    Value vs[] = {make_int(42), make_str("hello"), make_null()};
    for (size_t i = 0; i < sizeof vs / sizeof vs[0]; i++) print_value(vs[i]);

    printf("\nsizeof(Value) = %zu (tag + 가장 큰 멤버 + 패딩)\n", sizeof(Value));
    return 0;
}
