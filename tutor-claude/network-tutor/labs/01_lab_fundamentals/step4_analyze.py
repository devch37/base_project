#!/usr/bin/env python3
"""
Lab 01 - Step 4: 패킷 헤더 직접 파싱 & 분석

실제 IP/TCP 헤더 바이트를 직접 파싱해서
각 필드가 어디에 어떻게 저장되는지 확인한다.

실행:
    python3 step4_analyze.py
"""

import struct
import socket


def parse_ip_header(raw: bytes) -> dict:
    """IPv4 헤더 20 bytes 파싱"""
    if len(raw) < 20:
        return {}

    fields = struct.unpack('!BBHHHBBH4s4s', raw[:20])
    version_ihl = fields[0]
    version = (version_ihl >> 4) & 0xF
    ihl = (version_ihl & 0xF) * 4   # 헤더 길이 (bytes)

    flags_frag = fields[4]
    flags = (flags_frag >> 13) & 0x7
    frag_offset = flags_frag & 0x1FFF

    protocol_map = {1: 'ICMP', 6: 'TCP', 17: 'UDP', 41: 'IPv6', 89: 'OSPF'}
    proto = fields[6]

    return {
        "버전":         version,
        "헤더길이(IHL)": f"{ihl} bytes",
        "DSCP+ECN":    fields[1],
        "전체길이":     fields[2],
        "식별자(ID)":   hex(fields[3]),
        "플래그":       f"DF={int(bool(flags&2))}, MF={int(bool(flags&1))}",
        "단편오프셋":   frag_offset,
        "TTL":          fields[5],
        "프로토콜":     f"{protocol_map.get(proto, '?')} ({proto})",
        "체크섬":       hex(fields[7]),
        "출발지 IP":    socket.inet_ntoa(fields[8]),
        "목적지 IP":    socket.inet_ntoa(fields[9]),
    }


def parse_tcp_header(raw: bytes) -> dict:
    """TCP 헤더 20 bytes 파싱"""
    if len(raw) < 20:
        return {}

    fields = struct.unpack('!HHLLBBHHH', raw[:20])
    data_offset = ((fields[4] >> 4) & 0xF) * 4  # 헤더 길이
    flags_byte = fields[5]

    flags = {
        "URG": bool(flags_byte & 0x20),
        "ACK": bool(flags_byte & 0x10),
        "PSH": bool(flags_byte & 0x08),
        "RST": bool(flags_byte & 0x04),
        "SYN": bool(flags_byte & 0x02),
        "FIN": bool(flags_byte & 0x01),
    }
    active_flags = [k for k, v in flags.items() if v]

    return {
        "출발지 포트":  fields[0],
        "목적지 포트":  fields[1],
        "Seq 번호":     fields[2],
        "Ack 번호":     fields[3],
        "헤더길이":     f"{data_offset} bytes",
        "플래그":       f"[{', '.join(active_flags)}]" if active_flags else "[없음]",
        "Window Size":  fields[6],
        "체크섬":       hex(fields[7]),
        "Urgent PTR":   fields[8],
    }


def demo_raw_bytes():
    """직접 만든 IP+TCP 패킷 예시 분석"""
    print("=" * 55)
    print(" IP + TCP 헤더 직접 파싱 실습")
    print("=" * 55)

    # 실제 IP 헤더 예시 (Google DNS 8.8.8.8 → 내 PC:8080, TCP SYN)
    # Version=4, IHL=5, TotalLen=60, TTL=64, Protocol=TCP(6)
    ip_hex = bytes([
        0x45, 0x00, 0x00, 0x3C,  # Version/IHL, DSCP, TotalLen
        0x1A, 0x2B, 0x40, 0x00,  # ID, Flags(DF), FragOffset
        0x40, 0x06, 0x00, 0x00,  # TTL=64, Protocol=TCP(6), Checksum
        0x08, 0x08, 0x08, 0x08,  # Src IP: 8.8.8.8
        0xC0, 0xA8, 0x01, 0x64,  # Dst IP: 192.168.1.100
    ])

    # TCP SYN 헤더: src=443, dst=52341, SYN flag
    tcp_hex = bytes([
        0x01, 0xBB, 0xCC, 0x35,  # Src port=443, Dst port=52341
        0x12, 0x34, 0x56, 0x78,  # Seq=0x12345678
        0x00, 0x00, 0x00, 0x00,  # Ack=0 (SYN이라 없음)
        0x50, 0x02, 0xFF, 0xFF,  # DataOffset=5(20bytes), Flags=SYN(0x02)
        0xAB, 0xCD, 0x00, 0x00,  # Window, Checksum, Urgent
    ])

    print("\n[예시 패킷: 8.8.8.8:443 → 192.168.1.100:52341 (TCP SYN)]")
    print(f"\nIP 헤더 RAW: {' '.join(f'{b:02X}' for b in ip_hex)}")
    print(f"TCP헤더 RAW: {' '.join(f'{b:02X}' for b in tcp_hex)}")

    print("\n── IP 헤더 파싱 결과 ──")
    for k, v in parse_ip_header(ip_hex).items():
        print(f"  {k:>15}: {v}")

    print("\n── TCP 헤더 파싱 결과 ──")
    for k, v in parse_tcp_header(tcp_hex).items():
        print(f"  {k:>15}: {v}")


def demo_live_capture():
    """로컬 서버에 실제 요청 보내고 소켓 레벨에서 데이터 확인"""
    import urllib.request
    import threading

    print("\n" + "=" * 55)
    print(" 실제 HTTP 요청 → 소켓 레벨 관찰")
    print("=" * 55)

    try:
        # step2 서버가 실행 중인지 확인
        req = urllib.request.Request("http://localhost:8888/")
        with urllib.request.urlopen(req, timeout=2) as resp:
            body = resp.read()
            headers = dict(resp.headers)

        print("\n✅ step2_http_server.py 서버 응답 받음!")
        print(f"\n[응답 헤더]")
        for k, v in headers.items():
            print(f"  {k}: {v}")
        print(f"\n[응답 본문 (앞 200자)]")
        print(f"  {body[:200].decode()}")

        print("\n[소켓 주소 정보]")
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(("localhost", 8888))
        local = s.getsockname()
        remote = s.getpeername()
        print(f"  로컬 (내 소켓): {local[0]}:{local[1]}")
        print(f"  원격 (서버):    {remote[0]}:{remote[1]}")
        print(f"\n  → 이 5-tuple이 소켓 하나를 식별:")
        print(f"    TCP / {local[0]}:{local[1]} / {remote[0]}:{remote[1]}")
        s.close()

    except Exception as e:
        print(f"\n⚠️  서버 연결 실패: {e}")
        print("   step2_http_server.py 먼저 실행 후 다시 시도")


def quiz():
    print("\n" + "=" * 55)
    print(" 📝 확인 퀴즈")
    print("=" * 55)

    questions = [
        ("IP 헤더에서 Protocol=6 은 어떤 프로토콜?", "TCP"),
        ("TCP SYN 패킷의 Flags 바이트 값은? (16진수)", "0x02"),
        ("IPv4 헤더의 기본 크기(IHL=5)는 몇 bytes?", "20"),
        ("TTL=64 로 시작해서 라우터 10개를 거치면 TTL은?", "54"),
    ]

    score = 0
    for i, (q, ans) in enumerate(questions, 1):
        user = input(f"\nQ{i}. {q}\n답: ").strip()
        if user.lower() == ans.lower():
            print("  ✅ 정답!")
            score += 1
        else:
            print(f"  ❌ 오답. 정답: {ans}")

    print(f"\n점수: {score}/{len(questions)}")
    if score == len(questions):
        print("🎉 완벽! Lab 02 로 진행하세요.")
    else:
        print("📖 틀린 부분은 이론 챕터 01을 다시 확인하세요.")


if __name__ == "__main__":
    demo_raw_bytes()
    demo_live_capture()
    quiz()
