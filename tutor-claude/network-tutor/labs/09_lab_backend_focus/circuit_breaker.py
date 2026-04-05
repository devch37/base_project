#!/usr/bin/env python3
"""
Lab 09 - Circuit Breaker 패턴 구현 & 시뮬레이션

상태: CLOSED → OPEN → HALF_OPEN → CLOSED

실행:
    python3 circuit_breaker.py
"""

import time
import random
import threading
from enum import Enum


class State(Enum):
    CLOSED    = "CLOSED (정상)"
    OPEN      = "OPEN (차단)"
    HALF_OPEN = "HALF_OPEN (시험)"


class CircuitBreaker:
    """Circuit Breaker 구현"""

    def __init__(self,
                 failure_threshold: int = 5,
                 success_threshold: int = 2,
                 timeout: float = 10.0,
                 window_size: int = 10):
        self.failure_threshold = failure_threshold   # 연속 실패 횟수
        self.success_threshold = success_threshold   # HALF_OPEN 성공 횟수
        self.timeout = timeout                       # OPEN → HALF_OPEN 대기 시간
        self.window_size = window_size               # 슬라이딩 윈도우 크기

        self._state = State.CLOSED
        self._failures = 0
        self._successes = 0
        self._open_time = 0
        self._results: list[bool] = []
        self._lock = threading.Lock()
        self.stats = {"allowed": 0, "rejected": 0, "success": 0, "failure": 0}

    @property
    def state(self) -> State:
        return self._state

    def _failure_rate(self) -> float:
        if not self._results:
            return 0.0
        return sum(1 for r in self._results if not r) / len(self._results)

    def call(self, func, *args, **kwargs):
        """Circuit Breaker를 통해 함수 호출"""
        with self._lock:
            if self._state == State.OPEN:
                # OPEN 상태: 일정 시간 후 HALF_OPEN으로 전환
                if time.time() - self._open_time > self.timeout:
                    self._state = State.HALF_OPEN
                    self._successes = 0
                    print(f"  [CB] OPEN → HALF_OPEN (시험 시작)")
                else:
                    self.stats["rejected"] += 1
                    remaining = self.timeout - (time.time() - self._open_time)
                    raise Exception(f"CircuitBreaker OPEN ({remaining:.1f}초 후 재시도)")

            self.stats["allowed"] += 1

        # 실제 함수 호출 (lock 밖에서)
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self):
        with self._lock:
            self.stats["success"] += 1
            self._results.append(True)
            if len(self._results) > self.window_size:
                self._results.pop(0)

            if self._state == State.HALF_OPEN:
                self._successes += 1
                if self._successes >= self.success_threshold:
                    self._state = State.CLOSED
                    self._failures = 0
                    print(f"  [CB] HALF_OPEN → CLOSED ✅ (서비스 복구)")
            elif self._state == State.CLOSED:
                self._failures = 0

    def _on_failure(self):
        with self._lock:
            self.stats["failure"] += 1
            self._results.append(False)
            if len(self._results) > self.window_size:
                self._results.pop(0)
            self._failures += 1

            if self._state == State.HALF_OPEN:
                self._state = State.OPEN
                self._open_time = time.time()
                print(f"  [CB] HALF_OPEN → OPEN ❌ (여전히 장애)")
            elif (self._state == State.CLOSED and
                  self._failures >= self.failure_threshold):
                self._state = State.OPEN
                self._open_time = time.time()
                print(f"  [CB] CLOSED → OPEN ❌ ({self._failures}회 연속 실패)")

    def show_status(self):
        rate = self._failure_rate()
        print(f"  상태: {self._state.value}  실패율: {rate*100:.1f}%  "
              f"허용: {self.stats['allowed']}  거부: {self.stats['rejected']}")


# ── 불안정한 서비스 시뮬레이터 ───────────────────────────

class UnstableService:
    """장애가 발생하는 불안정한 서비스"""

    def __init__(self):
        self.is_down = False
        self.call_count = 0

    def call(self, data: str) -> str:
        self.call_count += 1
        if self.is_down:
            raise Exception(f"Service Unavailable (503)")
        # 정상일 때도 20% 오류
        if random.random() < 0.2:
            raise Exception("Timeout")
        return f"OK: {data} (call #{self.call_count})"

    def break_service(self):
        self.is_down = True
        print("\n  💥 서비스 장애 발생!")

    def recover_service(self):
        self.is_down = False
        print("\n  🔧 서비스 복구!")


# ── 시뮬레이션 ────────────────────────────────────────────

def simulate_circuit_breaker():
    print("=" * 60)
    print(" Circuit Breaker 패턴 시뮬레이션")
    print("=" * 60)

    print("\n[설정]")
    print("  실패 임계값:  5회 연속 실패 시 OPEN")
    print("  OPEN 타임아웃: 5초 후 HALF_OPEN")
    print("  복구 임계값:  2회 연속 성공 시 CLOSED")
    print()

    cb = CircuitBreaker(
        failure_threshold=5,
        success_threshold=2,
        timeout=5.0,
        window_size=10
    )
    service = UnstableService()

    def try_call(label: str):
        try:
            result = cb.call(service.call, label)
            print(f"  ✅ {label}: {result}")
        except Exception as e:
            print(f"  ❌ {label}: {e}")

    input("Enter로 시뮬레이션 시작...")

    # Phase 1: 정상 동작
    print("\n── Phase 1: 정상 동작 (간헐적 오류 있음) ──")
    for i in range(10):
        try_call(f"req-{i+1}")
        time.sleep(0.1)
    cb.show_status()

    input("\nEnter로 장애 시뮬레이션...")

    # Phase 2: 서비스 장애
    print("\n── Phase 2: 서비스 장애 발생 ──")
    service.break_service()

    for i in range(12):
        try_call(f"fail-{i+1}")
        time.sleep(0.1)
        if i == 4:
            print(f"  → 5회 실패 → Circuit OPEN!")
    cb.show_status()

    input("\n서킷 OPEN 상태에서 요청이 즉시 거부되는 것 확인. Enter로 계속...")

    # Phase 3: 서비스 복구 시도
    print(f"\n── Phase 3: {cb.timeout}초 대기 후 HALF_OPEN ──")
    service.recover_service()
    print(f"  {cb.timeout}초 대기 중...")
    time.sleep(cb.timeout + 0.5)

    print("\n  HALF_OPEN 상태에서 요청 시도:")
    for i in range(5):
        try_call(f"recovery-{i+1}")
        time.sleep(0.3)
    cb.show_status()

    print("\n[최종 통계]")
    print(f"  허용: {cb.stats['allowed']}, 거부: {cb.stats['rejected']}")
    print(f"  성공: {cb.stats['success']}, 실패: {cb.stats['failure']}")


def demonstrate_cascading_failure():
    """Circuit Breaker 없을 때의 Cascading Failure"""
    print("\n" + "=" * 60)
    print(" Circuit Breaker 없을 때: Cascading Failure")
    print("=" * 60)

    print("""
  서비스 구조:
    API 서버 → 결제 서비스 → 외부 PG사

  시나리오: 외부 PG사 응답 지연 (10초)

  [Circuit Breaker 없을 때]
    요청 1:  API → 결제 → PG사 [10초 대기] → 스레드 블록
    요청 2:  API → 결제 → PG사 [10초 대기] → 스레드 블록
    ...
    요청 N:  스레드 풀 고갈 → API 서버 전체 응답 불가!

  [Circuit Breaker 있을 때]
    요청 1~5:  실패 → 5번째에 Circuit OPEN
    요청 6~N:  즉시 거부(fallback 응답) → 스레드 낭비 없음
    10초 후:   HALF_OPEN → 복구 확인
""")


if __name__ == "__main__":
    simulate_circuit_breaker()
    demonstrate_cascading_failure()
    print("✅ Lab 09 Circuit Breaker 완료!")
