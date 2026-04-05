#!/usr/bin/env python3
"""
Lab 06 - Step 3: AWS VPC 라우팅 테이블 시뮬레이터

실제 AWS VPC 라우팅 테이블처럼 동작하는 시뮬레이터
Longest Prefix Match 규칙으로 경로 결정

실행:
    python3 step3_vpc_simulator.py
"""

import ipaddress


class RoutingTable:
    """AWS VPC 라우팅 테이블 시뮬레이터"""

    def __init__(self, name: str):
        self.name = name
        self.routes: list[dict] = []

    def add(self, destination: str, target: str, description: str = ""):
        self.routes.append({
            "destination": ipaddress.ip_network(destination, strict=False),
            "dest_str": destination,
            "target": target,
            "description": description,
        })

    def route(self, dest_ip: str) -> dict | None:
        """Longest Prefix Match로 경로 결정"""
        ip = ipaddress.ip_address(dest_ip)
        best = None
        best_len = -1

        for r in self.routes:
            if ip in r["destination"]:
                if r["destination"].prefixlen > best_len:
                    best = r
                    best_len = r["destination"].prefixlen

        return best

    def show(self):
        print(f"\n  [{self.name}]")
        print(f"  {'목적지':<22} {'타겟':<20} 설명")
        print("  " + "-" * 65)
        for r in self.routes:
            print(f"  {r['dest_str']:<22} {r['target']:<20} {r['description']}")


class VPCSimulator:
    """AWS VPC 전체 구조 시뮬레이션"""

    def __init__(self):
        # ── 라우팅 테이블 설정 ────────────────────────────
        self.public_rt = RoutingTable("Public Subnet RT")
        self.public_rt.add("10.0.0.0/16", "local",      "VPC 내부 통신")
        self.public_rt.add("10.1.0.0/16", "tgw-001",    "다른 VPC (Transit GW)")
        self.public_rt.add("0.0.0.0/0",   "igw-001",    "인터넷 (Internet GW)")

        self.private_rt = RoutingTable("Private Subnet RT (App)")
        self.private_rt.add("10.0.0.0/16", "local",     "VPC 내부 통신")
        self.private_rt.add("10.1.0.0/16", "tgw-001",   "다른 VPC (Transit GW)")
        self.private_rt.add("192.168.0.0/16", "vgw-001","온프레미스 (VPN GW)")
        self.private_rt.add("0.0.0.0/0",   "nat-001",   "인터넷 (NAT GW)")

        self.db_rt = RoutingTable("DB Subnet RT")
        self.db_rt.add("10.0.0.0/16", "local",          "VPC 내부만 (인터넷 차단)")

        # ── 서브넷 정의 ───────────────────────────────────
        self.subnets = {
            "Public-AZ-a":  ("10.0.0.0/24",  self.public_rt,  "ALB, Bastion"),
            "Public-AZ-b":  ("10.0.1.0/24",  self.public_rt,  "ALB, Bastion"),
            "Private-AZ-a": ("10.0.10.0/24", self.private_rt, "App 서버"),
            "Private-AZ-b": ("10.0.11.0/24", self.private_rt, "App 서버"),
            "DB-AZ-a":      ("10.0.20.0/24", self.db_rt,      "RDS Primary"),
            "DB-AZ-b":      ("10.0.21.0/24", self.db_rt,      "RDS Standby"),
        }

    def trace_packet(self, src_ip: str, dst_ip: str, src_subnet: str):
        """패킷 경로 추적"""
        print(f"\n  패킷: {src_ip} ({src_subnet}) → {dst_ip}")
        print("  " + "─" * 50)

        # 출발 서브넷의 라우팅 테이블
        if src_subnet not in self.subnets:
            print(f"  ❌ 서브넷 {src_subnet} 없음")
            return

        _, rt, _ = self.subnets[src_subnet]
        result = rt.route(dst_ip)

        if result:
            target = result["target"]
            desc = result["description"]
            print(f"  매칭 경로: {result['dest_str']} → {target}")

            # 타겟별 동작 설명
            if target == "local":
                # 목적지 서브넷 찾기
                dst_subnet = self._find_subnet(dst_ip)
                print(f"  경로: VPC 내부 라우팅 ({desc})")
                print(f"  목적지: {dst_subnet or '알 수 없음'}")
            elif target.startswith("igw"):
                print(f"  경로: Internet Gateway → 인터넷 (DNAT 후 전달)")
                print(f"  ⚠️  Public IP 없으면 통신 불가")
            elif target.startswith("nat"):
                print(f"  경로: NAT Gateway → Internet Gateway → 인터넷")
                print(f"  → 소스 IP가 NAT Gateway의 Elastic IP로 변환")
            elif target.startswith("tgw"):
                print(f"  경로: Transit Gateway → 다른 VPC/온프레미스")
            elif target.startswith("vgw"):
                print(f"  경로: VPN Gateway → IPSec 터널 → 온프레미스")
        else:
            print(f"  ❌ 경로 없음 → 패킷 드롭")

    def _find_subnet(self, ip_str: str) -> str | None:
        ip = ipaddress.ip_address(ip_str)
        for name, (cidr, _, desc) in self.subnets.items():
            if ip in ipaddress.ip_network(cidr):
                return f"{name} ({cidr})"
        return None

    def show_all_tables(self):
        """모든 라우팅 테이블 출력"""
        for rt in [self.public_rt, self.private_rt, self.db_rt]:
            rt.show()


def interactive_routing_quiz(vpc: VPCSimulator):
    """인터랙티브 라우팅 퀴즈"""
    print("\n" + "=" * 55)
    print(" 📝 VPC 라우팅 퀴즈")
    print("=" * 55)

    scenarios = [
        {
            "q": "Private 서브넷 앱 서버(10.0.10.5)가 npm install 하려면?",
            "src": "10.0.10.5", "src_subnet": "Private-AZ-a",
            "dst": "8.8.8.8",
            "expected_target": "nat-001",
            "ans": "NAT Gateway를 통해 인터넷 접근 (0.0.0.0/0 → nat-001)"
        },
        {
            "q": "Public ALB(10.0.0.100)가 App 서버(10.0.10.5)로 트래픽 전달?",
            "src": "10.0.0.100", "src_subnet": "Public-AZ-a",
            "dst": "10.0.10.5",
            "expected_target": "local",
            "ans": "VPC local 라우팅 (10.0.0.0/16 → local)"
        },
        {
            "q": "DB 서버(10.0.20.5)가 인터넷에 접근하면?",
            "src": "10.0.20.5", "src_subnet": "DB-AZ-a",
            "dst": "8.8.8.8",
            "expected_target": None,
            "ans": "경로 없음! DB RT에는 0.0.0.0/0 없음 → 차단됨 (보안!)"
        },
    ]

    for i, s in enumerate(scenarios, 1):
        print(f"\nQ{i}. {s['q']}")
        print(f"    src={s['src']} ({s['src_subnet']}) → dst={s['dst']}")
        vpc.trace_packet(s['src'], s['dst'], s['src_subnet'])
        print(f"\n    해설: {s['ans']}")
        input("\n    Enter로 다음...")


if __name__ == "__main__":
    print("=" * 55)
    print(" AWS VPC 라우팅 테이블 시뮬레이터")
    print("=" * 55)

    vpc = VPCSimulator()

    print("\n[VPC 서브넷 구성]")
    for name, (cidr, rt, purpose) in vpc.subnets.items():
        print(f"  {name:<18} {cidr:<16} {purpose}")

    print("\n[라우팅 테이블 전체]")
    vpc.show_all_tables()

    input("\nEnter로 패킷 추적 실습...")

    print("\n[시나리오별 패킷 경로 추적]")
    test_cases = [
        ("10.0.10.5",  "10.0.11.8",   "Private-AZ-a",  "App-a → App-b (VPC 내부)"),
        ("10.0.10.5",  "8.8.8.8",     "Private-AZ-a",  "App → 인터넷 (NPM Install)"),
        ("10.0.0.100", "10.0.10.5",   "Public-AZ-a",   "ALB → App 서버"),
        ("10.0.20.5",  "8.8.8.8",     "DB-AZ-a",       "DB → 인터넷 시도 (차단!)"),
        ("10.0.10.5",  "192.168.1.10","Private-AZ-a",  "App → 온프레미스 (VPN)"),
        ("10.0.10.5",  "10.1.5.20",   "Private-AZ-a",  "App → 다른 VPC (TGW)"),
    ]

    for src, dst, subnet, desc in test_cases:
        print(f"\n  [{desc}]")
        vpc.trace_packet(src, dst, subnet)

    input("\nEnter로 퀴즈...")
    interactive_routing_quiz(vpc)

    print("\n✅ Lab 06 완료!")
