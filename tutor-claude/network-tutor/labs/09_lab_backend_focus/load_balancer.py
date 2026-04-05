#!/usr/bin/env python3
"""
Lab 09 - 로드 밸런서 직접 구현

Round Robin, Weighted Round Robin, Least Connections 알고리즘
헬스체크 + 자동 서버 제외/복구

실행:
    python3 load_balancer.py

다른 터미널에서 테스트:
    for i in $(seq 1 20); do curl -s http://localhost:8888/; done
"""

import http.server
import urllib.request
import threading
import time
import random
import json
from collections import deque


# ── 백엔드 서버 정의 ──────────────────────────────────────

class Backend:
    def __init__(self, host: str, port: int, weight: int = 1):
        self.host = host
        self.port = port
        self.weight = weight
        self.active_connections = 0
        self.total_requests = 0
        self.total_errors = 0
        self.healthy = True
        self.last_check = 0
        self._lock = threading.Lock()

    @property
    def addr(self):
        return f"{self.host}:{self.port}"

    def __repr__(self):
        status = "✅" if self.healthy else "❌"
        return (f"{status} {self.addr} "
                f"(conn={self.active_connections}, "
                f"req={self.total_requests}, "
                f"err={self.total_errors})")


# ── 로드 밸런싱 알고리즘 ──────────────────────────────────

class RoundRobin:
    """순서대로 돌아가며 분배"""
    def __init__(self):
        self._index = 0
        self._lock = threading.Lock()

    def pick(self, backends: list[Backend]) -> Backend | None:
        healthy = [b for b in backends if b.healthy]
        if not healthy:
            return None
        with self._lock:
            b = healthy[self._index % len(healthy)]
            self._index += 1
        return b


class WeightedRoundRobin:
    """가중치에 비례해서 분배"""
    def __init__(self):
        self._queue: deque = deque()
        self._lock = threading.Lock()

    def pick(self, backends: list[Backend]) -> Backend | None:
        healthy = [b for b in backends if b.healthy]
        if not healthy:
            return None
        with self._lock:
            if not self._queue:
                # 가중치만큼 반복해서 큐 채우기
                for b in healthy:
                    self._queue.extend([b] * b.weight)
                random.shuffle(self._queue)  # 섞기
            return self._queue.popleft() if self._queue else healthy[0]


class LeastConnections:
    """현재 연결 수가 가장 적은 서버 선택"""
    def pick(self, backends: list[Backend]) -> Backend | None:
        healthy = [b for b in backends if b.healthy]
        if not healthy:
            return None
        return min(healthy, key=lambda b: b.active_connections)


# ── 헬스체크 ──────────────────────────────────────────────

class HealthChecker(threading.Thread):
    def __init__(self, backends: list[Backend], interval: int = 5):
        super().__init__(daemon=True)
        self.backends = backends
        self.interval = interval

    def run(self):
        while True:
            for b in self.backends:
                self._check(b)
            time.sleep(self.interval)

    def _check(self, b: Backend):
        try:
            url = f"http://{b.addr}/health"
            req = urllib.request.urlopen(url, timeout=2)
            was_healthy = b.healthy
            b.healthy = req.status == 200
            b.last_check = time.time()
            if not was_healthy and b.healthy:
                print(f"  [헬스체크] ✅ {b.addr} 복구됨")
        except Exception:
            was_healthy = b.healthy
            b.healthy = False
            if was_healthy:
                print(f"  [헬스체크] ❌ {b.addr} 장애 감지 → 제외")


# ── 로드 밸런서 HTTP 핸들러 ───────────────────────────────

class LBHandler(http.server.BaseHTTPRequestHandler):
    lb: 'LoadBalancer' = None  # 클래스 변수로 LB 참조

    def do_GET(self):
        backend = self.lb.pick()

        if backend is None:
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b'{"error": "No healthy backends"}')
            return

        with threading.Lock():
            backend.active_connections += 1
            backend.total_requests += 1

        try:
            # 백엔드에 요청 포워딩
            url = f"http://{backend.addr}{self.path}"
            req = urllib.request.urlopen(url, timeout=5)
            body = req.read()

            self.send_response(req.status)
            self.send_header("Content-Type", "application/json")
            self.send_header("X-Served-By", backend.addr)
            self.end_headers()
            self.wfile.write(body)

            print(f"  [{self.path}] → {backend.addr} ({self.lb.algo_name})")

        except Exception as e:
            backend.total_errors += 1
            self.send_response(502)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e), "backend": backend.addr}).encode())
        finally:
            backend.active_connections -= 1

    def log_message(self, format, *args):
        pass


class LoadBalancer:
    def __init__(self, port: int, backends: list[Backend], algo="round_robin"):
        self.port = port
        self.backends = backends
        self.algo_name = algo

        algorithms = {
            "round_robin": RoundRobin(),
            "weighted":    WeightedRoundRobin(),
            "least_conn":  LeastConnections(),
        }
        self._algo = algorithms.get(algo, RoundRobin())

    def pick(self) -> Backend | None:
        return self._algo.pick(self.backends)

    def status(self):
        print(f"\n  [로드 밸런서 현황 - {self.algo_name}]")
        for b in self.backends:
            print(f"    {b}")


# ── 더미 백엔드 서버들 ────────────────────────────────────

def start_dummy_backend(port: int, name: str, slow: bool = False):
    """LB 뒤에서 응답하는 더미 서버"""

    class DummyHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/health':
                body = b'{"status":"UP"}'
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(body)
                return

            if slow:
                time.sleep(random.uniform(0.1, 0.5))  # 느린 서버

            body = json.dumps({
                "server": name,
                "port": port,
                "path": self.path,
                "time": time.time(),
            }).encode()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, f, *a):
            pass

    s = http.server.HTTPServer(('localhost', port), DummyHandler)
    t = threading.Thread(target=s.serve_forever, daemon=True)
    t.start()
    return s


# ── 메인 ──────────────────────────────────────────────────

def main():
    # 백엔드 서버 3개 실행
    backends_config = [
        (9010, "Server-A", False, 3),   # 빠름, 가중치 3
        (9011, "Server-B", False, 2),   # 빠름, 가중치 2
        (9012, "Server-C", True,  1),   # 느림, 가중치 1
    ]

    print("백엔드 서버 시작 중...")
    backends = []
    for port, name, slow, weight in backends_config:
        start_dummy_backend(port, name, slow)
        b = Backend("localhost", port, weight=weight)
        backends.append(b)
        print(f"  {name}: :{port} (weight={weight}{', 느림' if slow else ''})")

    time.sleep(0.3)

    # 알고리즘 선택
    print("\n로드 밸런싱 알고리즘:")
    print("  1. Round Robin (기본)")
    print("  2. Weighted Round Robin")
    print("  3. Least Connections")
    choice = input("선택 (1-3, 기본=1): ").strip() or "1"
    algo = {"1": "round_robin", "2": "weighted", "3": "least_conn"}.get(choice, "round_robin")

    # 로드 밸런서 시작
    lb = LoadBalancer(port=8888, backends=backends, algo=algo)

    # 헬스체크 시작
    hc = HealthChecker(backends, interval=5)
    hc.start()

    # HTTP 핸들러에 LB 연결
    LBHandler.lb = lb
    server = http.server.HTTPServer(('localhost', 8888), LBHandler)

    print(f"""
╔══════════════════════════════════════════════╗
║       로드 밸런서 실행 중 (:{8888})           ║
╠══════════════════════════════════════════════╣
║  알고리즘: {algo:<35}║
║                                              ║
║  테스트 (다른 터미널):                        ║
║    curl -s http://localhost:8888/ | python3 -m json.tool
║                                              ║
║  20개 연속 요청:                              ║
║    for i in $(seq 1 20); do \\               ║
║      curl -s http://localhost:8888/ | \\     ║
║      python3 -m json.tool; done             ║
║                                              ║
║  헬스체크: 5초마다 자동 실행                  ║
║  종료: Ctrl+C                                ║
╚══════════════════════════════════════════════╝
""")

    # 상태 출력 스레드
    def print_status():
        while True:
            time.sleep(10)
            lb.status()

    t = threading.Thread(target=print_status, daemon=True)
    t.start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n종료. 최종 통계:")
        for b in backends:
            print(f"  {b}")


if __name__ == '__main__':
    main()
