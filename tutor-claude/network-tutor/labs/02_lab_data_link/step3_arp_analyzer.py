#!/usr/bin/env python3
"""
Lab 02 - Step 3: ARP 동작 Python 시뮬레이터

ARP 캐시 동작, Gratuitous ARP, ARP Spoofing 탐지를 코드로 이해한다.

실행:
    python3 step3_arp_analyzer.py
"""

import time
import random


# ── ARP 캐시 시뮬레이터 ───────────────────────────────────

class ARPCache:
    """실제 ARP 캐시 동작을 시뮬레이션"""

    def __init__(self, ttl_seconds=300):
        self._cache: dict[str, dict] = {}
        self.ttl = ttl_seconds
        self.log = []

    def learn(self, ip: str, mac: str, source: str = "arp_reply"):
        """ARP Reply로 MAC 주소 학습"""
        now = time.time()
        existing = self._cache.get(ip)

        if existing and existing["mac"] != mac:
            # MAC이 변경됨 → 잠재적 ARP Spoofing!
            alert = (f"⚠️  [경고] IP {ip}의 MAC 변경 감지! "
                     f"{existing['mac']} → {mac} (출처: {source})")
            self.log.append(alert)
            print(alert)

        self._cache[ip] = {
            "mac": mac,
            "timestamp": now,
            "source": source,
        }

    def lookup(self, ip: str) -> str | None:
        """MAC 주소 조회"""
        entry = self._cache.get(ip)
        if not entry:
            return None
        # TTL 체크
        if time.time() - entry["timestamp"] > self.ttl:
            del self._cache[ip]
            return None
        return entry["mac"]

    def show(self):
        print("\n[ARP 캐시 현재 상태]")
        print(f"  {'IP 주소':<18} {'MAC 주소':<20} {'출처':<15} {'나이(초)':>8}")
        print("  " + "-" * 65)
        now = time.time()
        for ip, entry in sorted(self._cache.items()):
            age = int(now - entry["timestamp"])
            status = " (만료)" if age > self.ttl else ""
            print(f"  {ip:<18} {entry['mac']:<20} {entry['source']:<15} {age:>7}s{status}")


# ── ARP Request/Reply 시뮬레이터 ──────────────────────────

class NetworkSimulator:
    """간단한 네트워크 시뮬레이션"""

    def __init__(self):
        # 각 호스트의 IP → MAC 매핑 (실제 진실)
        self.hosts = {
            "192.168.1.1":   "aa:bb:cc:00:00:01",  # 게이트웨이
            "192.168.1.10":  "aa:bb:cc:00:00:10",  # Host A
            "192.168.1.20":  "aa:bb:cc:00:00:20",  # Host B
            "192.168.1.30":  "aa:bb:cc:00:00:30",  # Host C
        }
        self.arp_caches = {ip: ARPCache() for ip in self.hosts}

    def arp_request(self, sender_ip: str, target_ip: str):
        """ARP Request: sender → 브로드캐스트"""
        sender_mac = self.hosts[sender_ip]
        print(f"\n  📡 ARP Request: {sender_ip}({sender_mac}) → 브로드캐스트")
        print(f"     \"누가 {target_ip}야? 나는 {sender_ip}\"")

        # 브로드캐스트: 모든 호스트가 수신
        for ip in self.hosts:
            # 송신자는 본인 ARP 캐시에 등록
            if ip != sender_ip:
                self.arp_caches[ip].learn(sender_ip, sender_mac, "arp_request")

        # 타겟 호스트가 Reply 전송
        if target_ip in self.hosts:
            self.arp_reply(target_ip, sender_ip)

    def arp_reply(self, sender_ip: str, target_ip: str):
        """ARP Reply: 유니캐스트로 응답"""
        sender_mac = self.hosts[sender_ip]
        target_mac = self.hosts.get(target_ip, "??:??:??:??:??:??")
        print(f"\n  📩 ARP Reply: {sender_ip}({sender_mac}) → {target_ip}({target_mac})")
        print(f"     \"{sender_ip}의 MAC은 {sender_mac}이야\"")

        self.arp_caches[target_ip].learn(sender_ip, sender_mac, "arp_reply")

    def gratuitous_arp(self, sender_ip: str):
        """Gratuitous ARP: 스스로 브로드캐스트 (HA Failover 등)"""
        sender_mac = self.hosts[sender_ip]
        print(f"\n  📢 Gratuitous ARP: {sender_ip}({sender_mac}) → 브로드캐스트")
        print(f"     \"{sender_ip}의 MAC은 {sender_mac}이야! (요청 없이 선언)\"")
        print(f"     → 모든 호스트의 ARP 캐시 즉시 업데이트")

        for ip in self.hosts:
            if ip != sender_ip:
                self.arp_caches[ip].learn(sender_ip, sender_mac, "gratuitous")


# ── 메인 실습 ─────────────────────────────────────────────

def lab_arp_basics():
    print("=" * 60)
    print(" ARP 동작 시뮬레이션")
    print("=" * 60)

    net = NetworkSimulator()

    print("\n[초기 상태: 모든 ARP 캐시 비어있음]")
    print("\n네트워크 구성:")
    for ip, mac in net.hosts.items():
        label = "게이트웨이" if ip == "192.168.1.1" else "Host"
        print(f"  {label:>10}: {ip}  MAC={mac}")

    input("\nEnter로 시뮬레이션 시작...")

    # Host A → Host B 통신 시도
    print("\n[시나리오: Host A(192.168.1.10)가 Host B(192.168.1.20)에 패킷 전송]")
    print("\nStep 1: Host A의 ARP 캐시 확인")
    result = net.arp_caches["192.168.1.10"].lookup("192.168.1.20")
    print(f"  192.168.1.20 → {'캐시 있음: ' + result if result else '캐시 없음 → ARP Request 전송!'}")

    input("\nEnter로 ARP Request 시작...")
    net.arp_request("192.168.1.10", "192.168.1.20")

    print("\nStep 2: ARP 완료 후 Host A의 ARP 캐시:")
    net.arp_caches["192.168.1.10"].show()

    input("\nEnter로 Gratuitous ARP 실습...")


def lab_gratuitous_arp():
    print("\n" + "=" * 60)
    print(" Gratuitous ARP - HA(High Availability) Failover 시나리오")
    print("=" * 60)

    net = NetworkSimulator()

    # 초기 ARP 캐시 구성
    print("\n[초기 상태: 모든 호스트가 게이트웨이(192.168.1.1)의 MAC 알고 있음]")
    for ip in ["192.168.1.10", "192.168.1.20", "192.168.1.30"]:
        net.arp_caches[ip].learn("192.168.1.1", "aa:bb:cc:00:00:01", "arp_reply")

    print("\n[모든 호스트 ARP 캐시]")
    for ip in ["192.168.1.10", "192.168.1.20", "192.168.1.30"]:
        entry = net.arp_caches[ip].lookup("192.168.1.1")
        print(f"  {ip}: 게이트웨이 = {entry}")

    input("\n[시나리오] 게이트웨이 장애! 대기(Standby) 라우터 활성화...")

    # Failover: 새 MAC으로 게이트웨이 교체
    print("\n대기 라우터가 같은 IP(192.168.1.1)를 새 MAC으로 인계받음")
    new_standby_mac = "aa:bb:cc:FF:FF:01"
    net.hosts["192.168.1.1"] = new_standby_mac

    print(f"\n대기 라우터가 Gratuitous ARP 전송:")
    net.gratuitous_arp("192.168.1.1")

    print("\n[Failover 후 모든 호스트 ARP 캐시]")
    for ip in ["192.168.1.10", "192.168.1.20", "192.168.1.30"]:
        entry = net.arp_caches[ip].lookup("192.168.1.1")
        print(f"  {ip}: 게이트웨이 = {entry}  ← 즉시 업데이트!")

    print("\n▶ Gratuitous ARP 덕분에 트래픽이 즉시 새 게이트웨이로 전환")
    print("  VRRP, Keepalived, 클라우드 EIP 이동이 이 원리 활용")


def lab_arp_spoofing_detection():
    print("\n" + "=" * 60)
    print(" ARP Spoofing 탐지 시뮬레이션")
    print("=" * 60)

    cache = ARPCache()

    print("\n[정상 학습]")
    cache.learn("192.168.1.1",  "aa:bb:cc:00:00:01")  # 게이트웨이
    cache.learn("192.168.1.10", "aa:bb:cc:00:00:10")  # Host A
    cache.learn("192.168.1.20", "aa:bb:cc:00:00:20")  # Host B
    cache.show()

    input("\n[공격자가 ARP Spoofing 시작...]")

    print("\n공격자가 위조된 ARP Reply 전송:")
    print("  \"192.168.1.1(게이트웨이)의 MAC은 공격자MAC이야!\"")
    cache.learn("192.168.1.1", "de:ad:be:ef:00:00", source="attacker_arp_reply")

    print("\n[Spoofing 후 ARP 캐시]")
    cache.show()

    print("\n▶ MAC 변경 경고가 출력됐다면 IDS/DAI가 탐지할 수 있는 패턴")
    print("  실제 방어: Dynamic ARP Inspection (DAI) 스위치 기능")
    print("  → DHCP 바인딩 테이블과 ARP를 비교해서 위조 ARP 차단")


if __name__ == "__main__":
    lab_arp_basics()
    lab_gratuitous_arp()
    lab_arp_spoofing_detection()
    print("\n✅ Lab 02 완료!")
