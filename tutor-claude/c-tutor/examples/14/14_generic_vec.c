/*
 * 14_generic_vec.c — void* + elem_size 로 타입을 지운 동적 배열
 *   make run  NAME=14_generic_vec
 *   make asan NAME=14_generic_vec
 *
 * 하나의 구현으로 int 든 구조체든 담는다. 대가: 타입 안전성 없음, memcpy 비용.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    void  *data;
    size_t len, cap, elem;
} GVec;

static int gvec_init(GVec *v, size_t elem_size) {
    v->data = NULL;
    v->len = v->cap = 0;
    v->elem = elem_size;
    return 0;
}

static int gvec_push(GVec *v, const void *elem) {
    if (v->len == v->cap) {
        size_t nc = v->cap ? v->cap * 2 : 4;
        void  *t = realloc(v->data, nc * v->elem);
        if (!t) return -1;
        v->data = t;
        v->cap = nc;
    }
    memcpy((char *)v->data + v->len * v->elem, elem, v->elem);
    v->len++;
    return 0;
}

static void *gvec_at(const GVec *v, size_t i) {
    return (char *)v->data + i * v->elem; /* char* 로 캐스트해 바이트 단위 이동 */
}

static void gvec_free(GVec *v) {
    free(v->data);
    v->data = NULL;
    v->len = v->cap = 0;
}

typedef struct {
    char name[8];
    int  score;
} Player;

int main(void) {
    /* int 로 사용 */
    GVec ints;
    gvec_init(&ints, sizeof(int));
    for (int i = 0; i < 6; i++) gvec_push(&ints, &(int){i * i});
    printf("ints: ");
    for (size_t i = 0; i < ints.len; i++) printf("%d ", *(int *)gvec_at(&ints, i));
    putchar('\n');
    gvec_free(&ints);

    /* 구조체로 사용 — 같은 코드 */
    GVec players;
    gvec_init(&players, sizeof(Player));
    gvec_push(&players, &(Player){"alice", 90});
    gvec_push(&players, &(Player){"bob", 75});
    printf("players:\n");
    for (size_t i = 0; i < players.len; i++) {
        Player *p = gvec_at(&players, i);
        printf("  %s: %d\n", p->name, p->score);
    }
    gvec_free(&players);
    return 0;
}
