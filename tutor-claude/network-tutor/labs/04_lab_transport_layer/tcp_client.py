#!/usr/bin/env python3
"""
Lab 04 - TCP 에코 클라이언트

실행:
    python3 tcp_client.py

실습 내용:
  - connect() → 3-way handshake 발생
  - 데이터 전송 후 서버 에코 수신
  - close() → 4-way handshake + TIME_WAIT 전환
  - TCP 소켓 옵션 확인 (Keep-Alive, Nagle)
"""

import socket
import time

HOST = 'localhost'
PORT = 9001


def basic_communication():
    print("━━━ 기본 TCP 통신 ━━━\n")

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    print(f"[1] socket() 생성 → fd={sock.fileno()}")
    print(f"    로컬 포트: 아직 미지정")

    print(f"\n[2] connect({HOST}:{PORT}) → 3-Way Handshake 시작!")
    t_start = time.time()
    sock.connect((HOST, PORT))
    t_end = time.time()

    local = sock.getsockname()
    remote = sock.getpeername()
    print(f"    연결 완료 ({(t_end-t_start)*1000:.1f}ms)")
    print(f"    내 소켓:  {local[0]}:{local[1]}")
    print(f"    서버:     {remote[0]}:{remote[1]}")
    print(f"    5-tuple:  TCP/{local[0]}:{local[1]}/{remote[0]}:{remote[1]}")

    messages = ["Hello, TCP!", "Network Lab", "마지막 메시지"]

    for msg in messages:
        print(f"\n[3] send: '{msg}'")
        sock.sendall(f"{msg}\n".encode())

        echo = sock.recv(1024).decode().strip()
        print(f"    recv: '{echo}'")
        time.sleep(0.3)

    print(f"\n[4] close() → 4-Way Handshake 시작 → TIME_WAIT")
    sock.close()
    print(f"    소켓 닫힘. 이 포트는 잠시 TIME_WAIT 상태 유지")


def check_socket_options():
    """TCP 소켓 옵션 확인 및 설정"""
    print("\n━━━ TCP 소켓 옵션 실습 ━━━\n")

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Keep-Alive 설정
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

    # Keep-Alive 세부 파라미터 (Linux만 지원)
    try:
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)    # 60초 후 Probe 시작
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)   # 10초 간격
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 5)      # 5번 후 종료
        print("  Keep-Alive 설정:")
        print("    TCP_KEEPIDLE:  60초 (유휴 후 Probe 시작)")
        print("    TCP_KEEPINTVL: 10초 (Probe 간격)")
        print("    TCP_KEEPCNT:   5회 (최대 실패 횟수)")
    except AttributeError:
        print("  Keep-Alive: SOL_SOCKET 레벨만 설정 (macOS)")

    # Nagle 알고리즘 비활성화 (TCP_NODELAY)
    # 기본: 작은 패킷을 모아서 전송 (대기 시간 증가)
    # 비활성화: 즉시 전송 (실시간 게임, gRPC, 키 입력 등에 사용)
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    print("\n  TCP_NODELAY: 활성화 (Nagle 알고리즘 비활성화)")
    print("    → 작은 패킷도 즉시 전송 (지연 감소, 트래픽 증가)")

    # 수신/송신 버퍼 크기
    recv_buf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
    send_buf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
    print(f"\n  SO_RCVBUF (수신 버퍼): {recv_buf:,} bytes")
    print(f"  SO_SNDBUF (송신 버퍼): {send_buf:,} bytes")
    print(f"  → 이 값이 TCP Window Size의 기반")

    sock.close()


def test_connection_states():
    """소켓 상태 변화 관찰"""
    print("\n━━━ 연결 상태 관찰 ━━━")
    print("  별도 터미널에서 실행:")
    print("  watch -n 0.5 'ss -tnp | grep 9001'")
    print()

    input("  터미널 준비 후 Enter:")

    print("\n  connect() 전 상태...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    time.sleep(1)

    print("  connect() 중... (3-Way Handshake)")
    sock.connect((HOST, PORT))
    print(f"  → ESTABLISHED 상태 (포트: {sock.getsockname()[1]})")
    time.sleep(2)

    print("  데이터 전송 중...")
    sock.sendall(b"state test\n")
    sock.recv(1024)
    time.sleep(2)

    print("  close() 호출 → TIME_WAIT 전환...")
    sock.close()
    time.sleep(3)

    print("  → TIME_WAIT 상태 확인됨 (약 60초 유지)")


if __name__ == '__main__':
    print("=" * 50)
    print(" Lab 04 — TCP 에코 클라이언트")
    print("=" * 50)
    print()
    print("전제: python3 tcp_server.py 실행 중이어야 함")
    print()

    try:
        basic_communication()
        check_socket_options()

        ans = input("\n상태 변화 관찰 실습 진행? (y/N): ").strip().lower()
        if ans == 'y':
            test_connection_states()

    except ConnectionRefusedError:
        print("\n❌ 서버 연결 실패!")
        print("   python3 tcp_server.py 먼저 실행하세요")

    print("\n✅ TCP 클라이언트 실습 완료!")
