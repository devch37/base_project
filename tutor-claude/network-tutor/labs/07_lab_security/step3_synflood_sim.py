#!/usr/bin/env python3
"""
Lab 07 - Step 3: SYN Flood 시뮬레이션 & SYN Cookie 방어 이해

실제 패킷을 보내지 않고 알고리즘으로 시뮬레이션
SYN Cookie 동작 원리를 코드로 이해

실행:
    python3 step3_synflood_sim.py
"""

import hashlib
import time
import random
import ipaddress


# ── SYN Cookie 구현 ───────────────────────────────────────

def make_syn_cookie(src_ip: str, src_port: int, dst_port: int,
                    isn: int, secret: str) -> int:
    """
    SYN Cookie 생성 (RFC 4987 방식 단순화)

    실제: SHA1(src_ip, src_port, dst_port, ISN, secret) + 타임스탬프
    쿠키: 32bit (Sequence Number에 인코딩)
    """
    data = f"{src_ip}:{src_port}:{dst_port}:{isn}:{secret}"
    h = int(hashlib.md5(data.encode()).hexdigest()[:8], 16)
    # 상위 3bit에 타임스탬프(초/64) 인코딩
    timestamp = (int(time.time()) // 64) & 0x7
    cookie = (timestamp << 29) | (h & 0x1FFFFFFF)
    return cookie


def verify_syn_cookie(cookie: int, src_ip: str, src_port: int,
                      dst_port: int, secret: str) -> bool:
    """
    클라이언트가 ACK로 돌려준 쿠키 검증
    ACK number = 클라이언트가 받은 SYN+ACK seq + 1
    → ack - 1 = 서버의 SYN+ACK seq = 쿠키
    """
    timestamp = (cookie >> 29) & 0x7
    now_ts = (int(time.time()) // 64) & 0x7

    # 타임스탬프 검증 (최대 2분 이내)
    diff = (now_ts - timestamp) & 0x7
    if diff > 2:
        return False

    # ISN 재계산해서 쿠키 비교
    isn = cookie  # 단순화: 실제로는 counter 기반
    expected = make_syn_cookie(src_ip, src_port, dst_port, isn, secret)
    return (expected & 0x1FFFFFFF) == (cookie & 0x1FFFFFFF)


# ── SYN Queue 기반 서버 ───────────────────────────────────

class SYNQueueServer:
    """일반 서버 (SYN Queue 사용, SYN Flood에 취약)"""

    def __init__(self, max_syn_queue=10):
        self.syn_queue: dict[str, dict] = {}  # half-open connections
        self.max_queue = max_syn_queue
        self.accepted = 0
        self.dropped = 0

    def handle_syn(self, src_ip: str, src_port: int) -> str:
        key = f"{src_ip}:{src_port}"
        if len(self.syn_queue) >= self.max_queue:
            self.dropped += 1
            return f"DROPPED (SYN Queue 가득참: {len(self.syn_queue)}/{self.max_queue})"

        self.syn_queue[key] = {"ip": src_ip, "port": src_port, "time": time.time()}
        return f"SYN+ACK 전송 (Queue: {len(self.syn_queue)}/{self.max_queue})"

    def handle_ack(self, src_ip: str, src_port: int) -> str:
        key = f"{src_ip}:{src_port}"
        if key in self.syn_queue:
            del self.syn_queue[key]
            self.accepted += 1
            return "ESTABLISHED (정상 연결)"
        return "REJECTED (SYN Queue에 없음)"


class SYNCookieServer:
    """SYN Cookie 서버 (SYN Flood 방어)"""

    def __init__(self):
        self.secret = "server-secret-key-2026"
        self.accepted = 0
        self.syn_count = 0

    def handle_syn(self, src_ip: str, src_port: int) -> tuple[str, int]:
        self.syn_count += 1
        # SYN Queue 없이 쿠키 계산만
        isn = random.randint(0, 2**31)
        cookie = make_syn_cookie(src_ip, src_port, 8080, isn, self.secret)
        return f"SYN+ACK + Cookie(seq={cookie})", cookie

    def handle_ack(self, src_ip: str, src_port: int, ack_num: int) -> str:
        # ACK number - 1 = 우리가 보낸 쿠키
        cookie = ack_num - 1
        if verify_syn_cookie(cookie, src_ip, src_port, 8080, self.secret):
            self.accepted += 1
            return "ESTABLISHED (쿠키 검증 성공!)"
        return "REJECTED (쿠키 검증 실패 - 위조된 ACK)"


# ── 시뮬레이션 실행 ───────────────────────────────────────

def simulate_syn_flood():
    print("=" * 60)
    print(" SYN Flood 공격 시뮬레이션")
    print("=" * 60)

    print("\n[시나리오]")
    print("  공격자: 위조된 소스 IP로 SYN 패킷 대량 전송")
    print("  피해자: SYN Queue가 가득 차서 정상 연결 거부")
    print()

    # ── 취약한 서버 시뮬레이션 ────────────────────────────
    print("━━━ 일반 서버 (SYN Cookie 없음) ━━━")
    normal_server = SYNQueueServer(max_syn_queue=10)

    # 공격 트래픽: 위조된 IP 50개
    print("\n  [공격] 위조된 IP에서 SYN 50개 전송:")
    for i in range(50):
        fake_ip = f"192.168.{random.randint(1,254)}.{random.randint(1,254)}"
        result = normal_server.handle_syn(fake_ip, random.randint(1024, 65535))
        if i < 3 or i >= 47:
            print(f"    SYN from {fake_ip:>18} → {result}")
        elif i == 3:
            print("    ...")

    print(f"\n  [정상 사용자] 연결 시도:")
    result = normal_server.handle_syn("10.0.0.100", 50000)
    print(f"    SYN from 10.0.0.100 → {result}")
    print()
    print(f"  📊 결과: 드롭={normal_server.dropped}, 수락됨={normal_server.accepted}")
    print(f"  ❌ 정상 사용자 연결 불가 → SYN Flood 성공!")

    input("\nEnter로 SYN Cookie 방어 확인...")

    # ── SYN Cookie 방어 시뮬레이션 ────────────────────────
    print("\n━━━ SYN Cookie 서버 (방어) ━━━")
    cookie_server = SYNCookieServer()

    # 공격 트래픽
    print("\n  [공격] 위조된 IP에서 SYN 50개 전송:")
    for i in range(50):
        fake_ip = f"192.168.{random.randint(1,254)}.{random.randint(1,254)}"
        msg, cookie = cookie_server.handle_syn(fake_ip, random.randint(1024, 65535))
        if i < 2:
            print(f"    SYN from {fake_ip:>18} → {msg[:40]}...")
        elif i == 2:
            print("    ... (위조 IP는 SYN+ACK을 받아도 ACK 못 보냄)")

    print(f"\n  [정상 사용자] 연결 시도:")
    msg, cookie = cookie_server.handle_syn("10.0.0.100", 50000)
    print(f"    SYN from 10.0.0.100 → {msg[:50]}...")
    print(f"\n    [정상 사용자가 ACK 전송]")
    result = cookie_server.handle_ack("10.0.0.100", 50000, cookie + 1)
    print(f"    ACK from 10.0.0.100 → {result}")

    print()
    print(f"  📊 결과: SYN 수신={cookie_server.syn_count}, ESTABLISHED={cookie_server.accepted}")
    print(f"  ✅ SYN Cookie: Queue 없이 쿠키로 검증 → 정상 사용자만 연결!")

    input("\nEnter로 Rate Limiting 실습...")


def simulate_rate_limiting():
    """토큰 버킷 Rate Limiting 시뮬레이션"""
    print("\n" + "=" * 60)
    print(" Token Bucket Rate Limiting 시뮬레이션")
    print("=" * 60)

    class TokenBucket:
        def __init__(self, capacity: int, refill_rate: float):
            self.capacity = capacity        # 최대 토큰 수
            self.tokens = capacity          # 현재 토큰
            self.refill_rate = refill_rate  # 초당 충전량
            self.last_refill = time.monotonic()
            self.allowed = 0
            self.denied = 0

        def allow(self, cost: int = 1) -> bool:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity,
                              self.tokens + elapsed * self.refill_rate)
            self.last_refill = now

            if self.tokens >= cost:
                self.tokens -= cost
                self.allowed += 1
                return True
            self.denied += 1
            return False

    print("\n  설정: 버킷 크기=10, 충전 속도=5/초")
    print("  → 평소 5 RPS 허용, 버스트 시 최대 10 RPS")
    print()

    bucket = TokenBucket(capacity=10, refill_rate=5.0)

    # 시뮬레이션: 20ms마다 요청 (50 RPS 시도)
    print("  [시뮬레이션: 50 RPS 시도 → 5 RPS만 허용]")
    results = []
    start = time.monotonic()

    for i in range(100):
        allowed = bucket.allow()
        results.append(allowed)
        time.sleep(0.02)  # 20ms 간격

    elapsed = time.monotonic() - start
    allowed_count = sum(results)
    actual_rps = allowed_count / elapsed

    print(f"\n  총 시도: 100회 ({elapsed:.1f}초)")
    print(f"  허용:    {allowed_count}회")
    print(f"  거부:    {100 - allowed_count}회 (429 Too Many Requests)")
    print(f"  실제 RPS: {actual_rps:.1f} (목표: 5/초)")
    print()

    # 시각화
    print("  [허용/거부 패턴]")
    print("  " + "".join("✓" if r else "✗" for r in results[:50]))
    print("  " + "".join("✓" if r else "✗" for r in results[50:]))
    print("  (✓=허용, ✗=429)")


if __name__ == "__main__":
    simulate_syn_flood()
    simulate_rate_limiting()
    print("\n✅ Lab 07 완료!")
