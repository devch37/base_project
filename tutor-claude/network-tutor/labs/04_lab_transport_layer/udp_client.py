#!/usr/bin/env python3
"""
Lab 04 - UDP 에코 클라이언트

실행:
    python3 udp_client.py

실습 포인트:
  - connect() 없이 sendto()로 전송
  - 응답 없어도 오류 없음 (비신뢰성)
  - 타임아웃으로 재시도 로직 직접 구현
  - TCP vs UDP 성능 비교
"""

import socket
import time

HOST = 'localhost'
PORT = 9002
TIMEOUT = 1.0   # 응답 대기 최대 1초
RETRIES = 3


def send_with_retry(sock: socket.socket, msg: str, server_addr: tuple) -> str | None:
    """재시도 로직이 있는 UDP 전송 (신뢰성 직접 구현)"""
    for attempt in range(1, RETRIES + 1):
        sock.sendto(msg.encode(), server_addr)
        print(f"  → 전송 (시도 {attempt}/{RETRIES}): '{msg}'")

        try:
            data, _ = sock.recvfrom(4096)
            return data.decode()
        except socket.timeout:
            print(f"  ⏱  타임아웃! (1초 초과)")
            if attempt < RETRIES:
                print(f"     재시도...")

    print(f"  ❌ {RETRIES}번 모두 실패 → 손실로 간주")
    return None


def main():
    print("=" * 50)
    print(" Lab 04 — UDP 에코 클라이언트")
    print("=" * 50)
    print()

    # UDP 소켓 생성
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(TIMEOUT)

    server_addr = (HOST, PORT)

    print("━━━ UDP 기본 통신 ━━━")
    print()
    print("TCP와 달리 connect() 없이 바로 sendto() 가능")
    print("소켓 상태: CLOSED (연결 개념 없음)")
    print()

    messages = [
        "Hello UDP",
        "빠른 전송 (신뢰성 없음)",
        "패킷 손실 발생 가능",
        "재시도 로직 직접 구현 필요",
        "DNS, 게임, 스트리밍에 사용",
    ]

    success = 0
    fail = 0

    for msg in messages:
        print(f"\n[메시지] '{msg}'")
        result = send_with_retry(sock, msg, server_addr)
        if result:
            print(f"  ✅ 수신: '{result}'")
            success += 1
        else:
            fail += 1
        time.sleep(0.1)

    print(f"\n[결과] 성공: {success}, 실패(손실): {fail}")
    print(f"  손실률: {fail/(success+fail)*100:.1f}%")

    # TCP vs UDP 성능 비교
    print("\n━━━ TCP vs UDP 지연 비교 ━━━")
    print()

    # UDP 지연
    N = 10
    udp_times = []
    for i in range(N):
        t = time.monotonic()
        sock.sendto(f"perf{i}".encode(), server_addr)
        try:
            sock.recvfrom(64)
            udp_times.append(time.monotonic() - t)
        except socket.timeout:
            pass

    if udp_times:
        avg_udp = sum(udp_times) / len(udp_times) * 1000
        print(f"  UDP RTT 평균: {avg_udp:.2f}ms ({len(udp_times)}/{N} 성공)")

    # TCP 지연 (3-way handshake 포함)
    try:
        t = time.monotonic()
        tcp_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp_sock.settimeout(2)
        tcp_sock.connect((HOST, 9001))
        tcp_connect_time = (time.monotonic() - t) * 1000

        t = time.monotonic()
        tcp_sock.sendall(b"perf\n")
        tcp_sock.recv(64)
        tcp_rtt = (time.monotonic() - t) * 1000

        tcp_sock.close()

        print(f"  TCP connect 시간: {tcp_connect_time:.2f}ms (3-way handshake)")
        print(f"  TCP RTT (연결 후): {tcp_rtt:.2f}ms")
        print()
        print(f"  ▶ UDP: 연결 수립 없이 즉시 전송 → 초기 지연 없음")
        print(f"  ▶ TCP: 연결 수립(3-way) 비용 있지만 신뢰성 보장")

    except ConnectionRefusedError:
        print("  TCP 서버(9001)가 없어서 비교 생략")

    sock.close()
    print("\n✅ UDP 클라이언트 실습 완료!")


if __name__ == '__main__':
    try:
        main()
    except ConnectionRefusedError:
        # UDP는 connect() 없어서 실제로는 다른 오류지만 서버 확인 안내
        print("❌ UDP 서버 연결 실패!")
        print("   python3 udp_server.py 먼저 실행하세요")
