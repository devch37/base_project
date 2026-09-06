/*
 * 17_crash.c — 일부러 NULL 역참조로 죽는다. 디버거 연습용.
 *   cc -g -O0 examples/17/17_crash.c -o bin/17_crash
 *   lldb ./bin/17_crash        (macOS)   -> run -> bt -> frame select N -> p node
 *   gdb  ./bin/17_crash        (Linux)   -> run -> bt -> frame N -> print node
 *   make asan NAME=17_crash    -> SEGV on unknown address 0x000000000000
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int          value;
    struct Node *next;
} Node;

static Node *make_list(int n) {
    Node *head = NULL;
    for (int i = 0; i < n; i++) {
        Node *nd = malloc(sizeof *nd);
        nd->value = i;
        nd->next = head;
        head = nd;
    }
    return head;
}

/* 버그: 마지막 노드의 next(NULL)까지 역참조한다 (<= 대신 조건 오류) */
static int sum_buggy(Node *head, int count) {
    int s = 0;
    Node *cur = head;
    for (int i = 0; i <= count; i++) { /* <-- i < count 여야 한다 */
        s += cur->value;               /* i == count 일 때 cur == NULL → 크래시 */
        cur = cur->next;
    }
    return s;
}

int main(void) {
    Node *list = make_list(5);
    printf("합 계산 시작...\n");
    int s = sum_buggy(list, 5);
    printf("합 = %d\n", s); /* 여기 못 옴 */
    return 0;
}
