/* counter.h — 불투명 포인터로 캡슐화한 카운터 모듈 (공개 인터페이스) */
#ifndef CTUTOR_COUNTER_H
#define CTUTOR_COUNTER_H

/* 불완전 타입: 사용자는 내부 필드를 볼 수 없고 포인터로만 다룬다. */
typedef struct Counter Counter;

/* 소유권: 반환된 Counter 는 호출자가 counter_free 로 해제해야 한다. NULL 이면 실패. */
Counter *counter_new(long start);
void     counter_add(Counter *c, long delta);
long     counter_value(const Counter *c);
void     counter_free(Counter *c);

#endif /* CTUTOR_COUNTER_H */
