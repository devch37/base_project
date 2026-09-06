/*
 * 15_demo.c — 동적 배열 / 연결 리스트 / 해시맵을 한 번에 사용
 *   make run  NAME=15_demo
 *   make asan NAME=15_demo     # 누수 0 을 확인
 */
#include "da.h"
#include "hashmap.h"
#include "list.h"

#include <stdio.h>

int main(void) {
    /* --- 동적 배열 --- */
    IntArray a;
    da_init(&a);
    for (int i = 0; i < 10; i++) da_push(&a, i * i);
    da_remove_unordered(&a, 2); /* 인덱스 2 (=4) 를 O(1) 로 제거, 순서 안 지킴 */
    printf("da  (len=%zu cap=%zu): ", a.len, a.cap);
    for (size_t i = 0; i < a.len; i++) printf("%d ", a.data[i]);
    putchar('\n');
    da_free(&a);

    /* --- 연결 리스트 --- */
    List l;
    list_init(&l);
    for (int i = 1; i <= 5; i++) list_push_front(&l, i); /* 5 4 3 2 1 */
    list_remove_first(&l, 3);
    printf("list (len=%zu): ", l.len);
    for (Node *n = l.head; n; n = n->next) printf("%d ", n->value);
    putchar('\n');
    list_free(&l);

    /* --- 해시맵 --- */
    HashMap m;
    hm_init(&m);
    hm_put(&m, "apple", 3);
    hm_put(&m, "banana", 7);
    hm_put(&m, "cherry", 12);
    hm_put(&m, "apple", 4); /* 갱신 */

    const char *keys[] = {"apple", "banana", "cherry", "durian"};
    for (size_t i = 0; i < 4; i++) {
        long *v = hm_get(&m, keys[i]);
        printf("hm[%s] = %s", keys[i], v ? "" : "(없음)");
        if (v) printf("%ld", *v);
        putchar('\n');
    }
    printf("hm count=%zu nbuckets=%zu\n", m.count, m.nbuckets);
    hm_free(&m);
    return 0;
}
