#!/bin/bash
# Lab 04 - TCP 3/4-way Handshake tcpdump 캡처

echo "========================================"
echo " Lab 04: TCP Handshake 패킷 직접 관찰"
echo "========================================"
echo ""
echo "전제: python3 tcp_server.py 실행 중이어야 함"
echo ""
read -rp "준비됐으면 Enter:"

LOOPBACK="lo0"
[[ "$OSTYPE" != "darwin"* ]] && LOOPBACK="lo"

# ── 3-Way Handshake 캡처 ─────────────────────────────────
echo ""
echo "━━━ 3-Way Handshake 캡처 ━━━"
echo ""
echo "  필터: 'tcp port 9001 and (tcp[tcpflags] & (tcp-syn|tcp-fin|tcp-rst) != 0)'"
echo "  → SYN, FIN, RST 플래그가 있는 패킷만"
echo ""

sudo tcpdump -i "$LOOPBACK" -n -S \
    'tcp port 9001 and (tcp[tcpflags] & (tcp-syn|tcp-fin|tcp-ack) != 0)' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.3

echo "  TCP 클라이언트 실행 중..."
python3 -c "
import socket, time
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('localhost', 9001))
time.sleep(0.2)
s.sendall(b'handshake test\n')
s.recv(1024)
time.sleep(0.2)
s.close()
time.sleep(0.3)
" 2>/dev/null

sleep 0.5
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 패킷 해석 가이드"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " [3-Way Handshake]"
echo " 1. client → server:  Flags [S]    = SYN"
echo "    seq=X (랜덤 ISN)"
echo ""
echo " 2. server → client:  Flags [S.]   = SYN+ACK"
echo "    seq=Y (서버 ISN), ack=X+1"
echo ""
echo " 3. client → server:  Flags [.]    = ACK"
echo "    seq=X+1, ack=Y+1"
echo ""
echo " [데이터 전송]"
echo " 4. client → server:  Flags [P.]   = PSH+ACK"
echo "    → 즉시 전달 요청"
echo " 5. server → client:  Flags [P.]   = PSH+ACK (에코)"
echo ""
echo " [4-Way Handshake]"
echo " 6. client → server:  Flags [F.]   = FIN+ACK"
echo " 7. server → client:  Flags [.]    = ACK"
echo " 8. server → client:  Flags [F.]   = FIN+ACK"
echo " 9. client → server:  Flags [.]    = ACK"
echo "    → client: TIME_WAIT (약 60초)"
echo ""
read -rp "확인 후 Enter:"

# ── Sequence Number 추적 ──────────────────────────────────
echo ""
echo "━━━ Sequence Number 추적 (-S: 절대값) ━━━"
echo ""
echo "  -S: relative seq 아닌 실제 ISN값 출력"
echo "  각 패킷의 seq, ack 값 변화 추적"
echo ""

sudo tcpdump -i "$LOOPBACK" -n -S -v 'tcp port 9001' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.3

python3 -c "
import socket, time
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('localhost', 9001))
s.sendall(b'seq test\n')
s.recv(1024)
s.close()
time.sleep(0.2)
" 2>/dev/null

sleep 0.5
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo " seq 값 변화:"
echo "  SYN:     seq=X"
echo "  SYN+ACK: seq=Y, ack=X+1"
echo "  ACK:     seq=X+1, ack=Y+1"
echo "  데이터:  seq=X+1, ack=Y+1, len=N (N bytes 전송)"
echo "  응답ACK: seq=Y+1, ack=X+1+N"
echo ""
echo "✅ Handshake 실습 완료!"
