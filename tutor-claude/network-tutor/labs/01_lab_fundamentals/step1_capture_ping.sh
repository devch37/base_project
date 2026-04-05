#!/bin/bash
# Lab 01 - Step 1: ICMP(ping) 패킷 캡처로 L3 계층 관찰
#
# 실습 목표:
#   - ping이 ICMP 프로토콜을 사용한다는 것을 직접 확인
#   - IP 헤더의 TTL, Protocol 필드 확인
#   - tcpdump 기본 필터 사용법 익히기

echo "========================================"
echo " Lab 01 Step 1: ICMP 패킷 관찰"
echo "========================================"
echo ""
echo "[실습 내용]"
echo "  1. tcpdump로 ICMP 패킷 5개 캡처"
echo "  2. -v 옵션으로 IP 헤더 상세 출력"
echo "  3. -X 옵션으로 hex+ASCII 원본 데이터 확인"
echo ""

# 네트워크 인터페이스 자동 감지
if [[ "$OSTYPE" == "darwin"* ]]; then
    IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
    IFACE=${IFACE:-en0}
else
    IFACE=$(ip route show default | awk '/default/{print $5}' | head -1)
    IFACE=${IFACE:-eth0}
fi

echo "[사용 인터페이스: $IFACE]"
echo ""

# ── Step 1-A: 기본 ICMP 캡처 ──────────────────────────────
echo "━━━ Step 1-A: ICMP 패킷 기본 캡처 (5개) ━━━"
echo "명령어: sudo tcpdump -i $IFACE -n -c 5 icmp"
echo ""
echo "별도 터미널에서 'ping -c 5 8.8.8.8' 실행 후 Enter:"
read -r

sudo tcpdump -i "$IFACE" -n -c 5 icmp 2>/dev/null &
TCPDUMP_PID=$!

sleep 0.5
ping -c 5 8.8.8.8 > /dev/null 2>&1

wait $TCPDUMP_PID

echo ""
echo "▶ 확인 포인트:"
echo "  - '8 ICMP echo request' 또는 'ICMP echo reply' 확인"
echo "  - IP 주소 형식: 출발지 > 목적지"
echo ""

# ── Step 1-B: IP 헤더 상세 보기 ───────────────────────────
echo "━━━ Step 1-B: IP 헤더 상세 출력 (-v 옵션) ━━━"
echo "명령어: sudo tcpdump -i $IFACE -n -v -c 4 icmp"
echo ""
read -rp "Enter 입력 시 시작:"

sudo tcpdump -i "$IFACE" -n -v -c 4 icmp 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.5
ping -c 4 8.8.8.8 > /dev/null 2>&1
wait $TCPDUMP_PID

echo ""
echo "▶ 확인 포인트:"
echo "  - 'ttl 64' or 'ttl 128' → OS별 기본 TTL 값"
echo "  - 'proto ICMP (1)'      → IP 헤더의 Protocol 필드 = 1"
echo "  - 'length 84'           → IP 패킷 전체 크기"
echo "  - 'id ..., seq ...'     → ICMP 시퀀스 번호"
echo ""

# ── Step 1-C: 16진수로 원본 패킷 보기 ─────────────────────
echo "━━━ Step 1-C: HEX+ASCII로 실제 패킷 바이트 보기 ━━━"
echo "명령어: sudo tcpdump -i $IFACE -n -X -c 2 icmp"
echo ""
read -rp "Enter 입력 시 시작:"

sudo tcpdump -i "$IFACE" -n -X -c 2 icmp 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.5
ping -c 2 8.8.8.8 > /dev/null 2>&1
wait $TCPDUMP_PID

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 패킷 구조 해석 가이드 (HEX 출력 읽는 법)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " 오프셋  0x0000 부터:"
echo "   Byte  0    : IP 버전(4bit) + IHL(4bit)  → 0x45 = IPv4, 헤더 20byte"
echo "   Byte  1    : DSCP + ECN                  → 보통 0x00"
echo "   Byte 2-3   : 전체 길이 (Total Length)"
echo "   Byte 4-5   : Identification"
echo "   Byte 6-7   : Flags + Fragment Offset"
echo "   Byte  8    : TTL                          → 0x40=64, 0x80=128"
echo "   Byte  9    : Protocol                     → 0x01=ICMP, 0x06=TCP, 0x11=UDP"
echo "   Byte 10-11 : Header Checksum"
echo "   Byte 12-15 : Source IP (4 bytes)"
echo "   Byte 16-19 : Destination IP (4 bytes)"
echo "   Byte 20+   : ICMP Header + Data"
echo ""
echo "✅ 완료! 다음: step2_http_server.py 실행"
