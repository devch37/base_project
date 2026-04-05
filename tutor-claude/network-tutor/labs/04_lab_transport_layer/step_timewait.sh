#!/bin/bash
# Lab 04 - TIME_WAIT & CLOSE_WAIT 소켓 상태 실습

echo "========================================"
echo " Lab 04: TIME_WAIT & CLOSE_WAIT 관찰"
echo "========================================"
echo ""

# ── TIME_WAIT 관찰 ────────────────────────────────────────
echo "━━━ TIME_WAIT 소켓 상태 만들기 ━━━"
echo ""
echo "  TCP 연결을 짧게 반복 → TIME_WAIT 소켓 쌓임"
echo ""

echo "  [연결 전 TIME_WAIT 수]"
ss -an state time-wait 2>/dev/null | wc -l || \
    netstat -an | grep TIME_WAIT | wc -l
echo ""

echo "  10개 짧은 연결 생성 중..."
python3 - <<'PYEOF'
import socket, time

for i in range(10):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        s.connect(('localhost', 9001))
        s.sendall(f"timewait test {i}\n".encode())
        s.recv(64)
    except:
        pass
    finally:
        s.close()  # close() → TIME_WAIT 전환
    time.sleep(0.05)
print("완료")
PYEOF

echo ""
echo "  [연결 후 TIME_WAIT 수]"
ss -an state time-wait 2>/dev/null | grep 9001 | head -10
netstat -an 2>/dev/null | grep TIME_WAIT | grep 9001 | head -10

echo ""
echo "  → TIME_WAIT: 마지막 ACK 전달을 보장하기 위해 2*MSL(60~120초) 유지"
echo "  → 이 시간 동안 같은 포트로 새 연결 불가 (SO_REUSEADDR으로 우회 가능)"
echo ""
read -rp "확인 후 Enter:"

# ── CLOSE_WAIT 시뮬레이션 ─────────────────────────────────
echo ""
echo "━━━ CLOSE_WAIT 시뮬레이션 (버그 재현) ━━━"
echo ""
echo "  CLOSE_WAIT = 상대방이 FIN을 보냈는데 내가 close()를 안 한 상태"
echo "  → 애플리케이션 버그 (리소스 누수)"
echo ""

python3 - <<'PYEOF'
import socket
import threading
import time

print("  [CLOSE_WAIT 버그 시뮬레이션]")
print()

# 버그 있는 서버: 클라이언트가 close()해도 서버가 close() 안 함
leaked_sockets = []

def buggy_server():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(('localhost', 9099))
    srv.listen(5)

    for _ in range(3):
        conn, addr = srv.accept()
        leaked_sockets.append(conn)  # ← 버그: close() 호출 안 함!
        # conn.close() 를 호출해야 함

    srv.close()

t = threading.Thread(target=buggy_server, daemon=True)
t.start()
time.sleep(0.2)

# 클라이언트 3개 연결 후 close()
for i in range(3):
    c = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    c.connect(('localhost', 9099))
    c.close()  # 클라이언트 측 FIN 전송
    time.sleep(0.1)

time.sleep(0.5)

print(f"  close() 안 된 서버 소켓: {len(leaked_sockets)}개")
print(f"  → 이것들이 CLOSE_WAIT 상태로 쌓임")
print()

import subprocess
result = subprocess.run(
    ['ss', '-anp', 'state', 'close-wait'],
    capture_output=True, text=True
)
if result.returncode == 0 and result.stdout.strip():
    print("  [현재 CLOSE_WAIT 소켓]")
    print(result.stdout[:300])
else:
    result = subprocess.run(
        ['netstat', '-an'],
        capture_output=True, text=True
    )
    close_waits = [l for l in result.stdout.split('\n') if 'CLOSE_WAIT' in l]
    if close_waits:
        print("  [CLOSE_WAIT 소켓]")
        for l in close_waits[:5]:
            print(f"    {l.strip()}")

print()
print("  [수정된 코드: conn.close() 호출 시]")
for s in leaked_sockets:
    s.close()
print(f"  → {len(leaked_sockets)}개 소켓 정상 닫힘")
PYEOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 소켓 상태 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " TIME_WAIT  : 정상 종료 후 일시적 대기 (클라이언트 쪽에 생김)"
echo "              원인: close() → FIN 전송"
echo "              지속: 60~120초 (2*MSL)"
echo "              해결: SO_REUSEADDR, tcp_tw_reuse"
echo ""
echo " CLOSE_WAIT : close() 미호출 (서버 쪽에 생김)"
echo "              원인: 애플리케이션 버그"
echo "              지속: 영구 (코드 수정 전까지)"
echo "              해결: try-with-resources, finally { close() }"
echo ""
echo "✅ Lab 04 완료!"
