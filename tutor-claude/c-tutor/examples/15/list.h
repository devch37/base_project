/* list.h — 단일 연결 리스트 (헤더 라이브러리).
 * 소유권: list_free 가 모든 노드를 해제. 값은 int(스칼라)라 깊은 해제 불필요. */
#ifndef CTUTOR_LIST_H
#define CTUTOR_LIST_H

#include <stdbool.h>
#include <stdlib.h>

typedef struct Node {
    int          value;
    struct Node *next;
} Node;

typedef struct {
    Node  *head;
    size_t len;
} List;

static inline void list_init(List *l) {
    l->head = NULL;
    l->len = 0;
}

static inline int list_push_front(List *l, int v) {
    Node *n = malloc(sizeof *n);
    if (!n) return -1;
    n->value = v;
    n->next = l->head;
    l->head = n;
    l->len++;
    return 0;
}

/* "이전 노드의 next 를 가리키는 이중 포인터" 관용구:
 * head 삭제와 중간 삭제를 분기 없이 처리한다. */
static inline bool list_remove_first(List *l, int target) {
    Node **pp = &l->head;
    while (*pp) {
        Node *cur = *pp;
        if (cur->value == target) {
            *pp = cur->next;
            free(cur);
            l->len--;
            return true;
        }
        pp = &cur->next;
    }
    return false;
}

static inline void list_free(List *l) {
    Node *cur = l->head;
    while (cur) {
        Node *next = cur->next; /* free 전에 next 를 저장 (use-after-free 방지) */
        free(cur);
        cur = next;
    }
    list_init(l);
}

#endif /* CTUTOR_LIST_H */
