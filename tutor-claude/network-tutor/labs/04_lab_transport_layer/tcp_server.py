#!/usr/bin/env python3
"""
Lab 04 - TCP 에코 서버

실행:
    python3 tcp_server.py

포트: 9001 (TCP)

실습 내용:
  - accept() 루프로 여러 클라이언트 순차 처리
  - TCP 소켓 생명주기 (bind → listen → accept → recv/send → close)
  - SO_REUSEADDR 옵션 (TIME_WAIT 중에도 포트 재사용)
"""

import socket
import threading
import time
from datetime import datetime

HOST = 'localhost'
PORT = 9001


def handle_client(conn: socket.socket, addr: tuple):
    """클라이언트 처리 스레드"""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 연결 수립: {addr[0]}:{addr[1]}")
    print(f"  소켓 fd: {conn.fileno()}")

    try:
        while True:
            data = conn.recv(1024)
            if not data:
                print(f"  [{addr[0]}:{addr[1]}] FIN 수신 → 연결 종료")
                break

            msg = data.decode().strip()
            print(f"  [{addr[0]}:{addr[1]}] 수신: '{msg}' ({len(data)} bytes)")

            # 에코 응답
            response = f"[ECHO] {msg}\n"
            conn.sendall(response.encode())
            print(f"  [{addr[0]}:{addr[1]}] 전송: '{response.strip()}'")

    except ConnectionResetError:
        print(f"  [{addr[0]}:{addr[1]}] RST 수신 (강제 종료)")
    finally:
        conn.close()
        print(f"  [{addr[0]}:{addr[1]}] 소켓 닫힘 → TIME_WAIT 상태로 전환")


def main():
    # 소켓 생성
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # SO_REUSEADDR: TIME_WAIT 상태에서도 포트 재사용 허용
    # → 서버 재시작 시 "Address already in use" 방지
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    print(f"SO_REUSEADDR 설정 완료 (TIME_WAIT 중 포트 재사용 허용)")

    # 포트 바인딩
    server_sock.bind((HOST, PORT))
    print(f"bind: {HOST}:{PORT}")

    # 리슨 큐 설정 (backlog=5)
    server_sock.listen(5)
    print(f"listen: backlog=5 (대기 연결 최대 5개)")

    print(f"""
╔═════════════════════════════════════════╗
║         TCP 에코 서버 시작              ║
╠═════════════════════════════════════════╣
║  주소: {HOST}:{PORT}                       ║
║                                         ║
║  테스트:                                ║
║    python3 tcp_client.py                ║
║    nc localhost {PORT}                    ║
║    telnet localhost {PORT}                ║
║                                         ║
║  소켓 상태 확인 (별도 터미널):           ║
║    ss -tnp | grep {PORT}                  ║
║                                         ║
║  종료: Ctrl+C                           ║
╚═════════════════════════════════════════╝
""")

    try:
        while True:
            # 연결 수락 (블로킹)
            print(f"[대기 중] accept() 호출...")
            conn, addr = server_sock.accept()

            # 각 클라이언트를 별도 스레드로 처리
            t = threading.Thread(target=handle_client, args=(conn, addr))
            t.daemon = True
            t.start()

    except KeyboardInterrupt:
        print("\n\n서버 종료 중...")
    finally:
        server_sock.close()
        print("서버 소켓 닫힘")


if __name__ == '__main__':
    main()
