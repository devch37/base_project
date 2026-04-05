#!/bin/bash
# Lab 02 - Step 2: Docker 네트워크로 VLAN 격리 체험
#
# Docker 브리지 네트워크 = 소프트웨어 스위치 + VLAN 역할
# 다른 브리지(네트워크)에 속한 컨테이너 간 통신 불가 = VLAN 격리

echo "========================================"
echo " Lab 02 Step 2: Docker로 VLAN 격리 체험"
echo "========================================"
echo ""

# Docker 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되지 않았습니다."
    echo "   https://docs.docker.com/desktop/ 에서 설치 후 재실행"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker 데몬이 실행 중이지 않습니다. Docker Desktop을 시작하세요."
    exit 1
fi

echo "[실습 구성]"
echo "  net-vlan10: 192.168.10.0/24  (개발팀 VLAN 역할)"
echo "  net-vlan20: 192.168.20.0/24  (운영팀 VLAN 역할)"
echo ""
echo "  컨테이너 A (vlan10): app-dev"
echo "  컨테이너 B (vlan20): app-ops"
echo "  컨테이너 C (vlan10 + vlan20): router (두 네트워크 모두 연결)"
echo ""

# ── 정리 함수 ─────────────────────────────────────────────
cleanup() {
    echo ""
    echo "[정리 중...]"
    docker rm -f app-dev app-ops router 2>/dev/null
    docker network rm net-vlan10 net-vlan20 2>/dev/null
    echo "완료"
}
trap cleanup EXIT

# ── Step 2-A: 격리된 네트워크 생성 ───────────────────────
echo "━━━ Step 2-A: 격리된 브리지 네트워크 생성 ━━━"
echo ""

docker network create \
    --driver bridge \
    --subnet 192.168.10.0/24 \
    --gateway 192.168.10.1 \
    net-vlan10 2>/dev/null
echo "  ✅ net-vlan10 생성 (192.168.10.0/24)"

docker network create \
    --driver bridge \
    --subnet 192.168.20.0/24 \
    --gateway 192.168.20.1 \
    net-vlan20 2>/dev/null
echo "  ✅ net-vlan20 생성 (192.168.20.0/24)"

echo ""
echo "[현재 Docker 네트워크 목록]"
docker network ls
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-B: 각 네트워크에 컨테이너 실행 ────────────────
echo ""
echo "━━━ Step 2-B: 컨테이너 실행 ━━━"
echo ""

docker run -d --rm --name app-dev \
    --network net-vlan10 \
    --ip 192.168.10.10 \
    alpine sleep 3600 2>/dev/null
echo "  ✅ app-dev: net-vlan10 (192.168.10.10)"

docker run -d --rm --name app-ops \
    --network net-vlan20 \
    --ip 192.168.20.10 \
    alpine sleep 3600 2>/dev/null
echo "  ✅ app-ops: net-vlan20 (192.168.20.10)"

echo ""
echo "[컨테이너 상태]"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Networks}}"
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-C: 격리 확인 (다른 VLAN 통신 불가) ────────────
echo ""
echo "━━━ Step 2-C: VLAN 격리 확인 ━━━"
echo ""
echo "  app-dev (vlan10) → app-ops (vlan20) ping 시도:"
echo "  예상 결과: 실패 (다른 VLAN)"
echo ""

docker exec app-dev ping -c 2 -W 2 192.168.20.10 2>&1 || true
echo ""
echo "▶ 'ping: bad address' 또는 100% packet loss → 격리 성공!"
echo "   같은 물리 머신이어도 다른 브리지(VLAN)라서 통신 불가"
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-D: 같은 VLAN 내 통신 확인 ────────────────────
echo ""
echo "━━━ Step 2-D: 같은 VLAN 내 통신 확인 ━━━"
echo ""

docker run -d --rm --name app-dev2 \
    --network net-vlan10 \
    --ip 192.168.10.11 \
    alpine sleep 3600 2>/dev/null
echo "  ✅ app-dev2: net-vlan10 (192.168.10.11)"
echo ""
echo "  app-dev (192.168.10.10) → app-dev2 (192.168.10.11) ping:"
echo "  예상 결과: 성공 (같은 VLAN)"
echo ""

docker exec app-dev ping -c 3 192.168.10.11
echo ""
echo "▶ ping 성공! 같은 브리지(VLAN) 내에서는 통신 가능"
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-E: Inter-VLAN 라우팅 시뮬레이션 ───────────────
echo ""
echo "━━━ Step 2-E: Inter-VLAN 라우팅 (두 네트워크 연결) ━━━"
echo ""
echo "  router 컨테이너를 vlan10 + vlan20 모두 연결"
echo "  → 두 VLAN 사이에서 라우터 역할"
echo ""

docker run -d --rm --name router \
    --network net-vlan10 \
    --ip 192.168.10.1 \
    alpine sleep 3600 2>/dev/null

docker network connect \
    --ip 192.168.20.1 \
    net-vlan20 router 2>/dev/null

echo "  ✅ router: vlan10(192.168.10.1) + vlan20(192.168.20.1)"
echo ""
echo "[router 컨테이너의 인터페이스 확인]"
docker exec router ip addr show | grep -E 'inet |eth'
echo ""
echo "▶ eth0과 eth1 두 개의 인터페이스 = 두 VLAN에 연결된 라우터!"
echo ""

# app-dev에서 router를 거쳐 vlan20으로 라우팅 설정
docker exec app-dev ip route add 192.168.20.0/24 via 192.168.10.1 2>/dev/null || true
docker exec app-dev ping -c 2 192.168.20.1 2>&1 | head -10
echo ""
echo "▶ app-dev → router(vlan10쪽) → vlan20 통신 가능!"
echo ""

# ── Step 2-F: veth pair 확인 ─────────────────────────────
echo "━━━ Step 2-F: 호스트에서 veth pair 확인 ━━━"
echo ""
echo "[호스트의 veth 인터페이스 (컨테이너와 연결된 가상 케이블)]"
ip link show | grep -E 'veth|br-' 2>/dev/null || \
    ifconfig | grep -E 'veth|br-' 2>/dev/null
echo ""
echo "▶ 각 컨테이너마다 vethXXX 인터페이스가 호스트에 생성됨"
echo "  veth 쌍의 한쪽 = 컨테이너 내부 eth0"
echo "  veth 쌍의 다른쪽 = 호스트의 브리지에 연결"
echo ""
echo "✅ Step 2 완료! 다음: step3_arp_analyzer.py"
