#!/bin/bash
# Lab 05 - Step 1: DNS 완전 해부

echo "========================================"
echo " Lab 05 Step 1: DNS 재귀 질의 추적"
echo "========================================"
echo ""

# ── Step 1-A: 기본 DNS 쿼리 + 타이밍 ────────────────────
echo "━━━ Step 1-A: DNS 쿼리 속도 비교 ━━━"
echo ""
echo "  캐시 없는 첫 번째 조회 vs 캐시 있는 두 번째 조회"
echo ""

TARGET="github.com"

echo "  [1차 조회 (캐시 없음)]"
time dig +short "$TARGET" 2>/dev/null

echo ""
echo "  [2차 조회 (캐시 있음 - 더 빠를 것)]"
time dig +short "$TARGET" 2>/dev/null

echo ""
echo "  ▶ 2차 조회가 빨랐나요? → 리졸버 캐시 히트"
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-B: TTL 확인 ────────────────────────────────────
echo ""
echo "━━━ Step 1-B: TTL 확인 ━━━"
echo ""

for domain in "google.com" "github.com" "cloudflare.com"; do
    ttl=$(dig +nocmd +noall +answer "$domain" A 2>/dev/null | awk '{print $2}' | head -1)
    ip=$(dig +short "$domain" A 2>/dev/null | head -1)
    echo "  $domain → $ip  TTL=$ttl 초"
done

echo ""
echo "  ▶ TTL이 낮을수록 자주 재조회 (변경 빠름, DNS 부하 증가)"
echo "  ▶ TTL이 높을수록 캐시 오래 유지 (빠름, 변경 전파 느림)"
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-C: dig +trace ─────────────────────────────────
echo ""
echo "━━━ Step 1-C: DNS 재귀 질의 전 과정 추적 ━━━"
echo ""
echo "  dig +trace: 루트 NS → TLD NS → 권한 NS 순서로 질의 과정 출력"
echo ""

dig +trace "$TARGET" 2>/dev/null | head -40

echo ""
echo "  ▶ '.' (루트) → '.com.' (TLD) → '$TARGET.' (권한 NS) 흐름 확인"
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-D: 다양한 레코드 타입 조회 ────────────────────
echo ""
echo "━━━ Step 1-D: DNS 레코드 타입별 조회 ━━━"
echo ""

DOMAIN="google.com"

for type in A AAAA MX NS TXT; do
    echo "  [$type 레코드]"
    dig +short "$DOMAIN" "$type" 2>/dev/null | head -3
    echo ""
done

echo "  [CAA 레코드 - 인증서 발급 허용 CA]"
dig +short "letsencrypt.org" CAA 2>/dev/null
echo ""
read -rp "확인 후 Enter:"

# ── Step 1-E: DNS over HTTPS vs 일반 DNS 비교 ─────────────
echo ""
echo "━━━ Step 1-E: DNS 패킷 캡처 (UDP 53) ━━━"
echo ""

IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}' || echo "en0")

echo "  tcpdump로 DNS 쿼리 캡처 중..."
sudo tcpdump -i "$IFACE" -n -v 'udp port 53' 2>/dev/null &
TCPDUMP_PID=$!
sleep 0.3

dig +time=2 "example-$(date +%s).com" 2>/dev/null > /dev/null  # 존재하지 않는 도메인

sleep 1
kill $TCPDUMP_PID 2>/dev/null
wait $TCPDUMP_PID 2>/dev/null

echo ""
echo "  ▶ UDP 포트 53으로 쿼리 전송 확인"
echo "  ▶ QTYPE: A(1), AAAA(28), MX(15), NS(2)"
echo ""

# ── Step 1-F: 역방향 DNS (PTR) ───────────────────────────
echo "━━━ Step 1-F: 역방향 DNS 조회 (PTR) ━━━"
echo ""
for ip in "8.8.8.8" "1.1.1.1" "208.67.222.222"; do
    ptr=$(dig -x "$ip" +short 2>/dev/null | head -1)
    echo "  $ip → ${ptr:-응답없음}"
done
echo ""
echo "  ▶ PTR 레코드: IP → 도메인 역방향 조회"
echo "     이메일 서버 SPF 검증, 로그 분석에 사용"
echo ""
echo "✅ DNS 실습 완료!"
