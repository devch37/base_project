#!/bin/bash
# Lab 02 - Step 1: ARP 동작 직접 관찰
#
# 목표:
#   - ARP Request (브로드캐스트) 와 ARP Reply (유니캐스트) 를 캡처
#   - ARP 캐시 비우고 재생성 과정 관찰
#   - MAC 주소 확인

echo "========================================"
echo " Lab 02 Step 1: ARP 동작 관찰"
echo "========================================"
echo ""

# 인터페이스 & 게이트웨이 감지
if [[ "$OSTYPE" == "darwin"* ]]; then
    IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
    GW=$(route -n get default 2>/dev/null | awk '/gateway:/{print $2}')
else
    IFACE=$(ip route show default | awk '/default/{print $5}' | head -1)
    GW=$(ip route show default | awk '/default/{print $3}' | head -1)
fi
IFACE=${IFACE:-en0}
GW=${GW:-192.168.1.1}

echo "[환경]"
echo "  인터페이스: $IFACE"
echo "  기본 게이트웨이: $GW"
echo ""

# ── Step 1-A: 현재 ARP 캐시 확인 ──────────────────────────
echo "━━━ Step 1-A: 현재 ARP 캐시 확인 ━━━"
echo ""
arp -a 2>/dev/null || ip neigh show
echo ""
echo "▶ ARP 캐시: IP 주소 ↔ MAC 주소 매핑 테이블"
echo "  'at aa:bb:cc:dd:ee:ff' 부분이 MAC 주소"
echo "  '(incomplete)' 는 응답 없는 IP"
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-B: 내 MAC 주소 확인 ────────────────────────────
echo ""
echo "━━━ Step 1-B: 내 MAC 주소 & 네트워크 인터페이스 ━━━"
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
    ifconfig "$IFACE" | grep -E 'ether|inet '
else
    ip link show "$IFACE" | grep 'link/ether'
    ip addr show "$IFACE" | grep 'inet '
fi
echo ""
echo "▶ 'ether' 또는 'link/ether' 다음에 오는 것이 MAC 주소"
echo "  제조사 OUI: 앞 3 옥텟 (예: Apple = a4:c3:f0:xx:xx:xx)"
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-C: ARP 캐시 삭제 후 재생성 관찰 ────────────────
echo ""
echo "━━━ Step 1-C: ARP 캐시 삭제 → ARP Request 발생 관찰 ━━━"
echo ""
echo "게이트웨이($GW)의 ARP 캐시를 지우고"
echo "ping 보낼 때 ARP Request가 발생하는지 tcpdump로 확인"
echo ""

# 게이트웨이 ARP 삭제
if [[ "$OSTYPE" == "darwin"* ]]; then
    sudo arp -d "$GW" 2>/dev/null && echo "  → ARP 캐시 삭제: $GW"
else
    sudo ip neigh del "$GW" dev "$IFACE" 2>/dev/null && echo "  → ARP 캐시 삭제: $GW"
fi

echo ""
echo "  tcpdump 시작 (ARP 필터)..."

sudo tcpdump -i "$IFACE" -n -e 'arp' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.3

echo "  → ping 1회 전송: $GW"
ping -c 1 "$GW" > /dev/null 2>&1
sleep 1

kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "▶ 확인 포인트:"
echo "  ARP Request:  'Request who-has $GW tell MY_IP'"
echo "    → 브로드캐스트 (Destination: ff:ff:ff:ff:ff:ff)"
echo "  ARP Reply:    'Reply $GW is-at GW_MAC_ADDRESS'"
echo "    → 유니캐스트 (내 MAC으로 직접)"
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-D: ARP 캐시 재확인 ─────────────────────────────
echo ""
echo "━━━ Step 1-D: ARP 캐시 재확인 ━━━"
echo ""
arp -a 2>/dev/null || ip neigh show
echo ""
echo "▶ 게이트웨이 MAC이 다시 채워졌는지 확인"
echo ""

# ── Step 1-E: ARP 패킷 구조 상세 분석 ─────────────────────
echo "━━━ Step 1-E: ARP 패킷 상세 구조 보기 (-v 옵션) ━━━"
echo ""

sudo arp -d "$GW" 2>/dev/null
sudo ip neigh del "$GW" dev "$IFACE" 2>/dev/null

sudo tcpdump -i "$IFACE" -n -v -e 'arp' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.3

ping -c 1 "$GW" > /dev/null 2>&1
sleep 1

kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ARP 패킷 구조 해설"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " ARP Request 패킷 (28 bytes):"
echo " ┌──────────────────────────────────────────────┐"
echo " │ Hardware Type:  0x0001 (Ethernet)            │"
echo " │ Protocol Type:  0x0800 (IPv4)                │"
echo " │ HW Addr Len:    6 (MAC = 6 bytes)            │"
echo " │ Proto Addr Len: 4 (IP  = 4 bytes)            │"
echo " │ Operation:      0x0001 (Request)             │"
echo " │ Sender MAC:     내 MAC 주소                   │"
echo " │ Sender IP:      내 IP 주소                    │"
echo " │ Target MAC:     00:00:00:00:00:00 (모름)      │"
echo " │ Target IP:      찾고 싶은 IP 주소             │"
echo " └──────────────────────────────────────────────┘"
echo ""
echo "✅ Step 1 완료! 다음: step2_vlan_docker.sh"
