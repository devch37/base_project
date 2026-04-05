#!/usr/bin/env python3
"""
Lab 03 - Step 1: 서브네팅 완전 정복

직접 계산 → 표준 라이브러리로 검증 → AWS VPC 설계까지

실행:
    python3 step1_subnet_calculator.py
"""

import ipaddress
import struct
import socket


# ── 1. 손으로 계산하는 서브네팅 ──────────────────────────

def manual_subnet(ip_str: str, prefix: int):
    """비트 연산으로 직접 서브넷 계산 (원리 이해용)"""
    print(f"\n{'='*55}")
    print(f" 서브넷 계산: {ip_str}/{prefix}")
    print(f"{'='*55}")

    # IP를 정수로 변환
    ip_int = struct.unpack("!I", socket.inet_aton(ip_str))[0]
    mask_int = (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF

    # 비트 표현 출력
    def to_bits(n):
        return f"{n:032b}"

    print(f"\n  IP  주소: {to_bits(ip_int)}")
    print(f"  서브넷마스크: {to_bits(mask_int)}")
    print(f"  AND 결과  : {to_bits(ip_int & mask_int)}")

    # 계산 결과
    network_int = ip_int & mask_int
    broadcast_int = network_int | (~mask_int & 0xFFFFFFFF)
    first_host = network_int + 1
    last_host = broadcast_int - 1
    host_count = broadcast_int - network_int - 1

    def int_to_ip(n):
        return socket.inet_ntoa(struct.pack("!I", n))

    print(f"\n  ┌── 계산 결과 ────────────────────────────────┐")
    print(f"  │ 네트워크 주소:  {int_to_ip(network_int):<20}     │")
    print(f"  │ 서브넷 마스크:  {int_to_ip(mask_int):<20}     │")
    print(f"  │ 첫 번째 호스트: {int_to_ip(first_host):<20}     │")
    print(f"  │ 마지막 호스트:  {int_to_ip(last_host):<20}     │")
    print(f"  │ 브로드캐스트:   {int_to_ip(broadcast_int):<20}     │")
    print(f"  │ 사용 가능 호스트 수: {host_count:<6} ({2**(32-prefix)}-2)    │")
    print(f"  └───────────────────────────────────────────────┘")

    # 표준 라이브러리로 검증
    net = ipaddress.ip_network(f"{ip_str}/{prefix}", strict=False)
    assert str(net.network_address) == int_to_ip(network_int), "네트워크 주소 불일치!"
    assert str(net.broadcast_address) == int_to_ip(broadcast_int), "브로드캐스트 불일치!"
    print(f"\n  ✅ ipaddress 라이브러리 검증 통과")

    return net


# ── 2. 서브네팅 시각화 ────────────────────────────────────

def visualize_subnets(base_cidr: str, new_prefix: int):
    """기존 네트워크를 서브넷으로 분할해서 시각화"""
    base = ipaddress.ip_network(base_cidr, strict=False)

    print(f"\n{'='*55}")
    print(f" {base_cidr} → /{new_prefix} 서브넷 분할")
    print(f"{'='*55}")

    subnets = list(base.subnets(new_prefix=new_prefix))
    print(f"\n  총 {len(subnets)}개 서브넷 (각 {subnets[0].num_addresses - 2}개 호스트)")
    print()

    # 시각화 (최대 8개)
    display = subnets[:8]
    ip_range = base.num_addresses
    bar_width = 50

    for subnet in display:
        offset = int(subnet.network_address) - int(base.network_address)
        ratio = subnet.num_addresses / ip_range
        bar_len = max(1, int(bar_width * ratio))
        bar_pos = int(bar_width * offset / ip_range)

        bar = " " * bar_pos + "█" * bar_len
        hosts = list(subnet.hosts())
        host_range = f"{hosts[0]} ~ {hosts[-1]}" if hosts else "없음"

        print(f"  {str(subnet):<22} [{bar:<{bar_width}}]")
        print(f"  {'':22}  호스트: {host_range}")

    if len(subnets) > 8:
        print(f"\n  ... 외 {len(subnets)-8}개 서브넷 (/{new_prefix})")


# ── 3. 퀴즈 ──────────────────────────────────────────────

def subnet_quiz():
    print(f"\n{'='*55}")
    print(" 📝 서브네팅 퀴즈")
    print(f"{'='*55}")

    problems = [
        {
            "q": "10.0.0.75/26 의 네트워크 주소는?",
            "answer": "10.0.0.64",
            "hint": "/26 → 마스크 255.255.255.192, 블록 크기=64\n"
                    "    75를 64로 나누면 1 나머지 11 → 10.0.0.64"
        },
        {
            "q": "172.16.5.0/24 를 /26 으로 나누면 몇 개 서브넷?",
            "answer": "4",
            "hint": "빌린 비트: 26-24=2 → 2^2=4개"
        },
        {
            "q": "192.168.1.200/27 의 브로드캐스트 주소는?",
            "answer": "192.168.1.223",
            "hint": "/27 → 블록=32, 200//32*32=192, 192+31=223"
        },
        {
            "q": "AWS /24 서브넷에서 실제 사용 가능한 IP 수는?",
            "answer": "251",
            "hint": "256 - 5 (AWS 예약: .0, .1, .2, .3, .255)"
        },
    ]

    score = 0
    for i, p in enumerate(problems, 1):
        print(f"\nQ{i}. {p['q']}")
        ans = input("   답: ").strip()

        if ans == p["answer"]:
            print("   ✅ 정답!")
            score += 1
        else:
            print(f"   ❌ 오답. 정답: {p['answer']}")
            print(f"   힌트: {p['hint']}")

        # 검증
        net = ipaddress.ip_network(
            p["q"].split("의")[0].strip() if "/" in p["q"].split("의")[0] else "10.0.0.64/26",
            strict=False
        )

    print(f"\n점수: {score}/{len(problems)}")


# ── 4. AWS VPC 설계 시뮬레이터 ───────────────────────────

def aws_vpc_designer():
    print(f"\n{'='*55}")
    print(" AWS VPC 서브넷 설계 시뮬레이터")
    print(f"{'='*55}")

    vpc_cidr = "10.0.0.0/16"
    vpc = ipaddress.ip_network(vpc_cidr)

    print(f"\nVPC: {vpc_cidr} ({vpc.num_addresses:,}개 IP)")
    print("\n[권장 다중 AZ 설계]")

    subnets = {
        "Public-AZ-a":  ("10.0.0.0/24",  "ALB, NAT Gateway"),
        "Public-AZ-b":  ("10.0.1.0/24",  "ALB, NAT Gateway"),
        "Private-AZ-a": ("10.0.10.0/24", "App 서버 (EC2, ECS)"),
        "Private-AZ-b": ("10.0.11.0/24", "App 서버 (EC2, ECS)"),
        "DB-AZ-a":      ("10.0.20.0/24", "RDS, ElastiCache"),
        "DB-AZ-b":      ("10.0.21.0/24", "RDS, ElastiCache"),
    }

    print(f"\n  {'서브넷 이름':<20} {'CIDR':<18} {'사용가능IP':<12} {'용도'}")
    print("  " + "-" * 70)

    total_used = 0
    for name, (cidr, purpose) in subnets.items():
        net = ipaddress.ip_network(cidr)
        available = net.num_addresses - 5  # AWS 예약 5개
        total_used += net.num_addresses
        print(f"  {name:<20} {cidr:<18} {available:<12} {purpose}")

    total_available = vpc.num_addresses
    unused = total_available - total_used
    print(f"\n  사용된 IP 공간: {total_used:,} / {total_available:,}")
    print(f"  예약/미사용:   {unused:,} (미래 확장용)")

    print("\n[라우팅 테이블 설계]")
    routing_tables = {
        "Public RT": [
            ("10.0.0.0/16", "local", "VPC 내부"),
            ("0.0.0.0/0",   "igw-xxx", "인터넷 (IGW)"),
        ],
        "Private RT": [
            ("10.0.0.0/16", "local", "VPC 내부"),
            ("0.0.0.0/0",   "nat-xxx", "인터넷 (NAT GW)"),
        ],
        "DB RT": [
            ("10.0.0.0/16", "local", "VPC 내부만, 인터넷 차단"),
        ],
    }

    for rt_name, routes in routing_tables.items():
        print(f"\n  [{rt_name}]")
        for dest, target, desc in routes:
            print(f"    {dest:<18} → {target:<12} ({desc})")


if __name__ == "__main__":
    # 1. 손으로 계산
    manual_subnet("192.168.10.100", 26)
    input("\nEnter로 다음...")

    manual_subnet("10.0.1.50", 28)
    input("\nEnter로 다음...")

    # 2. 시각화
    visualize_subnets("192.168.10.0/24", 26)
    input("\nEnter로 다음...")

    visualize_subnets("10.0.0.0/16", 24)
    input("\nEnter로 다음...")

    # 3. AWS 설계
    aws_vpc_designer()
    input("\nEnter로 퀴즈...")

    # 4. 퀴즈
    subnet_quiz()

    print("\n✅ Lab 03 Step 1 완료!")
