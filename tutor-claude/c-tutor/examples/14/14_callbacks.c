/*
 * 14_callbacks.c — 함수 포인터: 디스패치 테이블 + void* 컨텍스트 콜백
 *   make run NAME=14_callbacks
 */
#include <stdio.h>

/* 1) 디스패치 테이블 */
typedef double (*BinOp)(double, double);

static double op_add(double a, double b) { return a + b; }
static double op_sub(double a, double b) { return a - b; }
static double op_mul(double a, double b) { return a * b; }
static double op_div(double a, double b) { return b != 0 ? a / b : 0.0; }

static BinOp lookup(char c) {
    switch (c) {
    case '+': return op_add;
    case '-': return op_sub;
    case '*': return op_mul;
    case '/': return op_div;
    default:  return NULL;
    }
}

/* 2) void* ctx 콜백 — C엔 클로저가 없으니 상태를 ctx 로 넘긴다 */
static void array_foreach(const int *a, size_t n, void (*fn)(int, void *), void *ctx) {
    for (size_t i = 0; i < n; i++) fn(a[i], ctx);
}

struct stats { long sum; int max; };

static void visit(int v, void *ctx) {
    struct stats *s = ctx;
    s->sum += v;
    if (v > s->max) s->max = v;
}

int main(void) {
    const char ops[] = "+-*/";
    for (size_t i = 0; i < 4; i++) {
        BinOp f = lookup(ops[i]);
        printf("10 %c 3 = %.4g\n", ops[i], f(10, 3));
    }

    int data[] = {4, 8, 15, 16, 23, 42};
    struct stats s = {0, 0};
    array_foreach(data, sizeof data / sizeof data[0], visit, &s);
    printf("\nsum=%ld max=%d\n", s.sum, s.max);
    return 0;
}
