#!/bin/bash
# Lab 07 - Step 1: nmap 포트 스캔 (자기 자신만 대상!)
# ⚠️  반드시 localhost 또는 자신이 소유한 서버에만 실행

echo "========================================"
echo " Lab 07 Step 1: 포트 스캔 & 서비스 분석"
echo "========================================"
echo ""
echo "⚠️  주의: localhost 또는 자신이 소유한 서버에만 사용"
echo ""

TARGET="localhost"

# nmap 확인
if ! command -v nmap &> /dev/null; then
    echo "nmap 설치 필요: brew install nmap"
    exit 1
fi

# ── Step 1-A: 기본 포트 스캔 ─────────────────────────────
echo "━━━ Step 1-A: 자주 쓰는 포트 빠른 스캔 ━━━"
echo ""
echo "  nmap -F $TARGET (빠른 스캔: 상위 100개 포트)"
echo ""
nmap -F -T4 "$TARGET" 2>/dev/null
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-B: TCP SYN 스캔 (반열린 스캔) ─────────────────
echo ""
echo "━━━ Step 1-B: TCP SYN 스캔 원리 ━━━"
echo ""
echo "  Half-Open 스캔: SYN → SYN+ACK 수신 후 RST 전송"
echo "  → 연결을 완전히 수립하지 않아서 로그 남기기 어려움"
echo "  → 열린 포트: SYN+ACK 응답"
echo "  → 닫힌 포트: RST 응답"
echo "  → 필터링: 무응답 (방화벽 DROP) 또는 ICMP Unreachable"
echo ""

# SYN 스캔 (sudo 필요)
if sudo -n true 2>/dev/null; then
    echo "  [SYN 스캔 실행 중]"
    sudo nmap -sS -p 1-1000 -T4 "$TARGET" 2>/dev/null | head -30
else
    echo "  sudo 권한 필요. TCP Connect 스캔으로 대체:"
    nmap -sT -p 1-1000 -T4 "$TARGET" 2>/dev/null | head -30
fi
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-C: 서비스 버전 감지 ───────────────────────────
echo ""
echo "━━━ Step 1-C: 열린 포트의 서비스 & 버전 감지 ━━━"
echo ""
echo "  -sV: 배너 그래빙으로 서비스 버전 확인"
echo "  -O:  TTL, TCP Window Size 등으로 OS 추정"
echo ""
nmap -sV -O --version-intensity 3 -p 22,80,443,8080,8443,3306,5432,6379 \
    "$TARGET" 2>/dev/null
echo ""
echo "  ▶ 버전 정보 노출 = 공격자가 알려진 취약점 검색 가능"
echo "     대응: Server 헤더 숨기기, 불필요한 배너 제거"
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-D: 스캔 결과 해석 ─────────────────────────────
echo ""
echo "━━━ Step 1-D: 포트 상태 의미 ━━━"
cat << 'EOF'

  open     : 서비스가 실제로 수신 대기 중
  closed   : 포트 접근 가능, 서비스 없음 (RST 응답)
  filtered : 방화벽이 패킷 차단 (무응답 or ICMP 오류)
  open|filtered : 열렸는지 필터됐는지 판단 불가

  공격자 관점에서 위험한 포트:
    22  (SSH)  → 브루트포스 대상, 노출되면 Fail2Ban 필수
    3306(MySQL)→ 외부에서 접근 불가해야 함
    5432(PG)   → 외부에서 접근 불가해야 함
    6379(Redis)→ 인증 없이 외부 노출 = 즉시 장악
    8080(HTTP) → 관리 페이지 노출 주의
EOF
echo ""

# ── Step 1-E: 현재 열린 포트 빠른 확인 ───────────────────
echo "━━━ Step 1-E: 내 시스템 현재 열린 포트 ━━━"
echo ""
if command -v ss &> /dev/null; then
    ss -tlnp 2>/dev/null | grep -v "127.0.0.1" | head -20
else
    netstat -tlnp 2>/dev/null | grep LISTEN | head -20
fi
echo ""
echo "  ▶ 불필요한 포트가 열려 있으면 즉시 닫기"
echo "  ▶ 0.0.0.0:포트 = 모든 IP에서 접근 가능 (위험!)"
echo "  ▶ 127.0.0.1:포트 = 로컬만 (안전)"
echo ""
echo "✅ 포트 스캔 실습 완료!"
