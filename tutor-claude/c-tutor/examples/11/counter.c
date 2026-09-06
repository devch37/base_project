/* counter.c — counter 모듈 구현 (비공개). 내부 구조는 여기서만 안다. */
#include "counter.h"

#include <stdlib.h>

struct Counter {
    long value;
    long ops; /* 나중에 필드를 추가해도 main.c 는 재컴파일 불필요 */
};

/* 이 파일 전용 헬퍼: static 을 반드시 붙인다 (다른 파일과 이름 충돌 방지). */
static void bump_ops(struct Counter *c) { c->ops++; }

Counter *counter_new(long start) {
    Counter *c = malloc(sizeof *c);
    if (!c) return NULL;
    c->value = start;
    c->ops = 0;
    return c;
}

void counter_add(Counter *c, long delta) {
    c->value += delta;
    bump_ops(c);
}

long counter_value(const Counter *c) { return c->value; }

void counter_free(Counter *c) { free(c); /* free(NULL) 은 안전 */ }
