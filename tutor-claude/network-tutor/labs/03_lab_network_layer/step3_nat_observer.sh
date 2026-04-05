#!/bin/bash
# Lab 03 - Step 3: NAT 직접 관찰

echo "========================================"
echo " Lab 03 Step 3: NAT 동작 관찰"
echo "========================================"
echo ""

# ── Step 3-A: 사설 IP vs 공인 IP ─────────────────────────
echo "━━━ Step 3-A: 사설 IP vs 공인 IP 확인 ━━━"
echo ""

LOCAL_IP=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

PUBLIC_IP=$(curl -s --max-time 5 https://ifconfig.me 2>/dev/null || \
            curl -s --max-time 5 https://api.ipify.org 2>/dev/null || \
            echo "확인 불가")

echo "  내 사설 IP (NIC): $LOCAL_IP"
echo "  내 공인 IP (NAT): $PUBLIC_IP"
echo ""

# 사설 IP 범위 확인
python3 - "$LOCAL_IP" <<'PYEOF'
import ipaddress, sys

ip_str = sys.argv[1]
try:
    ip = ipaddress.ip_address(ip_str)
    private_ranges = [
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
    ]
    for r in private_ranges:
        if ip in r:
            print(f"  ✅ {ip_str}는 RFC 1918 사설 IP ({r})")
            break
    else:
        print(f"  ℹ️  {ip_str}는 공인 IP")
except:
    pass
PYEOF

echo ""
if [ "$LOCAL_IP" != "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "확인 불가" ]; then
    echo "  📌 사설 IP ≠ 공인 IP"
    echo "  → 공유기/게이트웨이에서 NAT(PAT)이 동작 중"
    echo "  → 외부 서버에서는 내 PC를 '$PUBLIC_IP' 로만 인식"
else
    echo "  ℹ️  사설 IP = 공인 IP → 직접 인터넷 연결 (NAT 없음)"
fi
echo ""
read -rp "확인 후 Enter:"

# ── Step 3-B: 동일 공인 IP 공유 확인 ─────────────────────
echo ""
echo "━━━ Step 3-B: 포트 번호로 연결 구분 (PAT) ━━━"
echo ""
echo "  여러 연결을 동시에 맺고 포트 번호가 다른지 확인"
echo "  → 같은 공인 IP에서 포트로 각 연결을 구분하는 것이 PAT"
echo ""

# 5개 병렬 연결로 각 소스 포트 확인
echo "  [5개 연결의 소스 포트 확인]"
for i in 1 2 3 4 5; do
    # HTTP 연결 후 소켓 정보 출력
    python3 -c "
import socket, ssl
ctx = ssl.create_default_context()
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('httpbin.org', 443))
print(f'  연결 $i: 내 포트 = {s.getsockname()[1]}')
s.close()
" 2>/dev/null &
done
wait
echo ""
echo "  ▶ 각 연결마다 다른 로컬 포트 사용"
echo "    NAT 테이블: (공인IP:포트) ↔ (사설IP:포트) 매핑"
echo ""
read -rp "확인 후 Enter:"

# ── Step 3-C: 패킷 캡처로 NAT 흔적 보기 ─────────────────
echo ""
echo "━━━ Step 3-C: tcpdump로 NAT 경계 확인 ━━━"
echo ""
echo "  로컬에서 외부로 나가는 패킷의 소스 IP = 사설 IP"
echo "  외부에서 들어오는 응답의 목적지 IP = 공인 IP (→NAT→ 사설 IP)"
echo ""

IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}' || echo "en0")

sudo tcpdump -i "$IFACE" -n -c 10 'host httpbin.org or port 443' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.5

curl -s -o /dev/null https://httpbin.org/ip

sleep 1
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "  ▶ 출발지 IP = 사설 IP ($LOCAL_IP)"
echo "     공유기에서 이 IP를 공인 IP($PUBLIC_IP)로 SNAT"
echo ""

# ── Step 3-D: Docker NAT 실습 ─────────────────────────────
if command -v docker &> /dev/null && docker info &>/dev/null; then
    echo "━━━ Step 3-D: Docker 포트 포워딩 (DNAT) ━━━"
    echo ""
    echo "  docker run -p 8090:80 nginx"
    echo "  → iptables DNAT: 호스트:8090 → 컨테이너:80"
    echo ""

    docker run -d --rm --name lab03-nginx -p 8090:80 nginx:alpine 2>/dev/null
    sleep 1

    echo "  [iptables NAT 규칙 확인 (Docker가 추가한 것)]"
    sudo iptables -t nat -L DOCKER -n --line-numbers 2>/dev/null | grep 8090 || \
        echo "  (macOS에서는 Docker Desktop이 내부적으로 처리)"

    echo ""
    echo "  [포트 포워딩 테스트: localhost:8090 → nginx 컨테이너:80]"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/ 2>/dev/null)
    echo "  HTTP 응답 코드: $HTTP_CODE"
    [ "$HTTP_CODE" = "200" ] && echo "  ✅ DNAT 성공!" || echo "  ⚠️  응답 없음"

    echo ""
    echo "  컨테이너 내부에서는 자신의 IP로 들어오지만"
    echo "  외부(localhost:8090)에서 보면 호스트 IP로 접근"
    echo "  → 이것이 DNAT (Destination NAT)"

    docker rm -f lab03-nginx 2>/dev/null
fi

echo ""
echo "✅ Lab 03 완료!"
