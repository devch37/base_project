#!/usr/bin/env python3
"""
Lab 04 - UDP 에코 서버

실행:
    python3 udp_server.py

포트: 9002 (UDP)

실습 포인트:
  - connect() 없이 즉시 recvfrom() 가능 (비연결)
  - 같은 소켓으로 여러 클라이언트와 동시 통신
  - 패킷 손실 시뮬레이션
"""

import socket
import random

HOST = 'localhost'
PORT = 9002
DROP_RATE = 0.2  # 20% 패킷 드롭 시뮬레이션


def main():
    # SOCK_DGRAM = UDP
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((HOST, PORT))

    print(f"""
╔═════════════════════════════════════════╗
║         UDP 에코 서버 시작              ║
╠═════════════════════════════════════════╣
║  주소: {HOST}:{PORT}                       ║
║  패킷 드롭률: {DROP_RATE*100:.0f}% (손실 시뮬레이션)  ║
║                                         ║
║  TCP와 차이:                            ║
║    - bind()만 하면 바로 통신 가능       ║
║    - listen(), accept() 없음            ║
║    - 연결 상태(ESTABLISHED) 없음        ║
║    - 여러 클라이언트를 하나 소켓으로    ║
║                                         ║
║  테스트:                                ║
║    python3 udp_client.py                ║
║    nc -u localhost {PORT}                 ║
║                                         ║
║  종료: Ctrl+C                           ║
╚═════════════════════════════════════════╝
""")

    received = 0
    dropped = 0

    try:
        while True:
            # recvfrom: 데이터 + 클라이언트 주소 동시 수신
            data, client_addr = sock.recvfrom(4096)
            received += 1

            msg = data.decode().strip()
            print(f"[UDP] 수신 from {client_addr[0]}:{client_addr[1]}: '{msg}'")

            # 패킷 드롭 시뮬레이션 (네트워크 손실 재현)
            if random.random() < DROP_RATE:
                dropped += 1
                print(f"       ⚡ DROP! ({dropped}/{received} 드롭됨)")
                continue

            # 에코 응답 (sendto로 특정 클라이언트에게)
            response = f"[UDP-ECHO] {msg}"
            sock.sendto(response.encode(), client_addr)
            print(f"       전송: '{response}'")

    except KeyboardInterrupt:
        print(f"\n\n서버 종료. 총 수신: {received}, 드롭: {dropped}")
    finally:
        sock.close()


if __name__ == '__main__':
    main()
