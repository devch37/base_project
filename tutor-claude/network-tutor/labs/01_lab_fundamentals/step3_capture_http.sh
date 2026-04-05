#!/bin/bash
# Lab 01 - Step 3: HTTP 요청에서 OSI 전 계층 헤더 캡처
#
# 전제 조건: step2_http_server.py 가 실행 중이어야 함
#   터미널 1: python3 step2_http_server.py
#   터미널 2: 이 스크립트 실행

LOOPBACK="lo0"   # macOS loopback
if [[ "$OSTYPE" != "darwin"* ]]; then
    LOOPBACK="lo"
fi

echo "========================================"
echo " Lab 01 Step 3: HTTP 전 계층 캡처"
echo "========================================"
echo ""
echo "전제 조건: 별도 터미널에서 아래 실행 중이어야 함"
echo "  python3 step2_http_server.py"
echo ""
read -rp "준비됐으면 Enter:"
echo ""

# ── Step 3-A: TCP 3-Way Handshake 캡처 ────────────────────
echo "━━━ Step 3-A: TCP 3-Way Handshake 관찰 ━━━"
echo "  캡처 필터: 포트 8888, TCP 플래그 포함"
echo ""

sudo tcpdump -i "$LOOPBACK" -n -v 'tcp port 8888' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.5

echo "  → HTTP 요청 전송 중..."
curl -s http://localhost:8888/ > /dev/null

sleep 0.5
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "▶ SYN, SYN-ACK, ACK 순서로 패킷이 3개 보이면 성공"
echo "  Flags [S]  = SYN  (연결 요청)"
echo "  Flags [S.] = SYN+ACK (연결 수락)"
echo "  Flags [.]  = ACK  (확인)"
echo "  Flags [P.] = PSH+ACK (HTTP 데이터)"
echo "  Flags [F.] = FIN+ACK (연결 종료)"
echo ""
read -rp "확인 후 Enter:"

# ── Step 3-B: HTTP 페이로드 전체 보기 ─────────────────────
echo ""
echo "━━━ Step 3-B: HTTP 요청/응답 페이로드 원문 보기 ━━━"
echo "  -A 옵션: ASCII 출력 (HTTP 텍스트 프로토콜 확인)"
echo ""

sudo tcpdump -i "$LOOPBACK" -n -A 'tcp port 8888' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.5

curl -s -H "X-My-Header: hello-lab" http://localhost:8888/api/users > /dev/null

sleep 0.5
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "▶ 확인 포인트:"
echo "  - 'GET /api/users HTTP/1.1' 라인 찾기 → L7 HTTP"
echo "  - 'Host:', 'User-Agent:', 'X-My-Header:' → HTTP 헤더들"
echo "  - 'HTTP/1.1 200 OK' → 응답 상태 라인"
echo "  - JSON 본문 { ... } 확인"
echo ""
read -rp "확인 후 Enter:"

# ── Step 3-C: Ethernet 헤더 포함해서 전체 보기 ────────────
echo ""
echo "━━━ Step 3-C: L2(Ethernet) 헤더까지 포함 전체 캡처 ━━━"
echo "  -e 옵션: Ethernet 헤더 (MAC 주소) 포함 출력"
echo ""

sudo tcpdump -i "$LOOPBACK" -n -e -c 6 'tcp port 8888' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.5

curl -s http://localhost:8888/ > /dev/null

sleep 0.5
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "▶ Loopback 인터페이스라서 MAC은 00:00:00:00:00:00 으로 표시"
echo "  실제 네트워크에서는 실제 MAC 주소 표시됨"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 계층별 정리"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " L2 Ethernet:  MAC 주소 (-e 옵션으로 확인)"
echo " L3 IP:        127.0.0.1 > 127.0.0.1 (loopback)"
echo " L4 TCP:       포트 번호, Flags(SYN/ACK/FIN), Seq/Ack"
echo " L7 HTTP:      GET /path HTTP/1.1, 헤더들, 바디"
echo ""
echo "✅ Step 3 완료! 다음: step4_analyze.sh"
