#!/bin/bash
# Lab 06 - Step 1: Docker로 멀티 서브넷 라우팅 구성
#
# 구성:
#   subnet-A (10.10.1.0/24) ── [router] ── subnet-B (10.10.2.0/24)
#                                 │
#                            subnet-C (10.10.3.0/24)
#
# 목표:
#   - 각 서브넷의 컨테이너들이 router를 통해 다른 서브넷과 통신
#   - 정적 라우팅 직접 설정
#   - traceroute로 패킷 경로 확인

set -e

echo "========================================"
echo " Lab 06: Docker 멀티 서브넷 라우팅"
echo "========================================"
echo ""

if ! docker info &>/dev/null; then
    echo "❌ Docker 실행 필요"
    exit 1
fi

cleanup() {
    echo ""
    echo "[정리 중...]"
    docker rm -f router host-a host-b host-c 2>/dev/null
    docker network rm net-a net-b net-c 2>/dev/null
    echo "완료"
}
trap cleanup EXIT

# ── 네트워크 생성 ─────────────────────────────────────────
echo "━━━ [1단계] 3개 서브넷 생성 ━━━"
echo ""

docker network create --subnet 10.10.1.0/24 --gateway 10.10.1.254 net-a 2>/dev/null
echo "  ✅ net-a: 10.10.1.0/24"

docker network create --subnet 10.10.2.0/24 --gateway 10.10.2.254 net-b 2>/dev/null
echo "  ✅ net-b: 10.10.2.0/24"

docker network create --subnet 10.10.3.0/24 --gateway 10.10.3.254 net-c 2>/dev/null
echo "  ✅ net-c: 10.10.3.0/24"

# ── 컨테이너 실행 ─────────────────────────────────────────
echo ""
echo "━━━ [2단계] 컨테이너 실행 ━━━"
echo ""

# 라우터: 모든 서브넷에 연결
docker run -d --rm --name router \
    --network net-a --ip 10.10.1.1 \
    --cap-add NET_ADMIN \
    alpine sleep 3600 2>/dev/null

docker network connect --ip 10.10.2.1 net-b router 2>/dev/null
docker network connect --ip 10.10.3.1 net-c router 2>/dev/null

# IP 포워딩 활성화 (라우터 역할)
docker exec router sh -c 'echo 1 > /proc/sys/net/ipv4/ip_forward'
echo "  ✅ router: 10.10.1.1 / 10.10.2.1 / 10.10.3.1 (IP 포워딩 ON)"

# 각 서브넷에 호스트 컨테이너
docker run -d --rm --name host-a \
    --network net-a --ip 10.10.1.10 \
    --cap-add NET_ADMIN \
    alpine sleep 3600 2>/dev/null
echo "  ✅ host-a: 10.10.1.10 (subnet-a)"

docker run -d --rm --name host-b \
    --network net-b --ip 10.10.2.10 \
    --cap-add NET_ADMIN \
    alpine sleep 3600 2>/dev/null
echo "  ✅ host-b: 10.10.2.10 (subnet-b)"

docker run -d --rm --name host-c \
    --network net-c --ip 10.10.3.10 \
    --cap-add NET_ADMIN \
    alpine sleep 3600 2>/dev/null
echo "  ✅ host-c: 10.10.3.10 (subnet-c)"
echo ""
read -rp "확인 후 Enter:"

# ── 라우팅 설정 전: 통신 불가 확인 ───────────────────────
echo ""
echo "━━━ [3단계] 정적 라우팅 설정 전 - 통신 불가 ━━━"
echo ""
echo "  host-a → host-b (다른 서브넷):"
docker exec host-a ping -c 2 -W 1 10.10.2.10 2>&1 | tail -3
echo ""
echo "  ▶ 실패! 기본 게이트웨이는 있지만 다른 서브넷 경로 모름"
echo ""
read -rp "확인 후 Enter:"

# ── 정적 라우팅 설정 ──────────────────────────────────────
echo ""
echo "━━━ [4단계] 정적 라우팅 수동 설정 ━━━"
echo ""

# host-a: subnet-b, subnet-c로 가려면 router(10.10.1.1) 경유
docker exec host-a ip route add 10.10.2.0/24 via 10.10.1.1
docker exec host-a ip route add 10.10.3.0/24 via 10.10.1.1
echo "  host-a 라우팅 추가: 10.10.2.0/24 via 10.10.1.1"
echo "  host-a 라우팅 추가: 10.10.3.0/24 via 10.10.1.1"

# host-b: subnet-a, subnet-c로 가려면 router(10.10.2.1) 경유
docker exec host-b ip route add 10.10.1.0/24 via 10.10.2.1
docker exec host-b ip route add 10.10.3.0/24 via 10.10.2.1
echo "  host-b 라우팅 추가: 10.10.1.0/24 via 10.10.2.1"
echo "  host-b 라우팅 추가: 10.10.3.0/24 via 10.10.2.1"

# host-c: subnet-a, subnet-b로 가려면 router(10.10.3.1) 경유
docker exec host-c ip route add 10.10.1.0/24 via 10.10.3.1
docker exec host-c ip route add 10.10.2.0/24 via 10.10.3.1
echo "  host-c 라우팅 추가"

echo ""
echo "  [host-a 라우팅 테이블]"
docker exec host-a ip route show
echo ""
read -rp "확인 후 Enter:"

# ── 라우팅 설정 후: 통신 확인 ────────────────────────────
echo ""
echo "━━━ [5단계] 라우팅 설정 후 - 통신 성공 ━━━"
echo ""

echo "  host-a → host-b:"
docker exec host-a ping -c 2 10.10.2.10
echo ""

echo "  host-a → host-c:"
docker exec host-a ping -c 2 10.10.3.10
echo ""

echo "  host-b → host-c:"
docker exec host-b ping -c 2 10.10.3.10
echo ""
read -rp "확인 후 Enter:"

# ── traceroute로 경로 확인 ────────────────────────────────
echo ""
echo "━━━ [6단계] traceroute로 패킷 경로 추적 ━━━"
echo ""
echo "  host-a → host-c traceroute:"
echo "  예상: host-a → router(10.10.1.1) → host-c"
echo ""
docker exec host-a traceroute -n 10.10.3.10 2>/dev/null || \
docker exec host-a sh -c 'for ttl in 1 2 3; do ping -c1 -W1 -t$ttl 10.10.3.10 2>&1 | grep -E "TTL|time"; done'

echo ""
echo "  ▶ 2홉: host-a(10.10.1.10) → router(10.10.1.1/10.10.3.1) → host-c(10.10.3.10)"
echo ""
echo "✅ Lab 06 Step 1 완료! 3개 서브넷 라우팅 구성 성공"
echo ""
read -rp "종료 (Enter):"
