#!/bin/bash
# Lab 05 - Step 3: TLS 핸드셰이크 & 인증서 직접 분석

echo "========================================"
echo " Lab 05 Step 3: TLS 완전 분석"
echo "========================================"
echo ""

TARGET="google.com"

# ── Step 3-A: TLS 연결 정보 확인 ─────────────────────────
echo "━━━ Step 3-A: TLS 버전 & 암호 스위트 확인 ━━━"
echo ""

echo | openssl s_client -connect "$TARGET:443" -brief 2>/dev/null | head -10
echo ""
echo "  ▶ Protocol: TLSv1.3 이어야 함 (최신 표준)"
echo "  ▶ Cipher: TLS_AES_256_GCM_SHA384 등 (AEAD 암호화)"
echo ""
read -rp "확인 후 Enter:"

# ── Step 3-B: 인증서 정보 파싱 ───────────────────────────
echo ""
echo "━━━ Step 3-B: 인증서 상세 정보 파싱 ━━━"
echo ""

CERT=$(echo | openssl s_client -connect "$TARGET:443" 2>/dev/null)

echo "  [Subject (발급 대상)]"
echo "$CERT" | openssl x509 -noout -subject 2>/dev/null

echo ""
echo "  [Issuer (발급 기관)]"
echo "$CERT" | openssl x509 -noout -issuer 2>/dev/null

echo ""
echo "  [유효 기간]"
echo "$CERT" | openssl x509 -noout -dates 2>/dev/null

echo ""
echo "  [만료까지 남은 날수]"
NOT_AFTER=$(echo "$CERT" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$NOT_AFTER" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        EXPIRY=$(date -j -f "%b %d %T %Y %Z" "$NOT_AFTER" +%s 2>/dev/null)
    else
        EXPIRY=$(date -d "$NOT_AFTER" +%s 2>/dev/null)
    fi
    NOW=$(date +%s)
    if [ -n "$EXPIRY" ]; then
        DAYS=$(( (EXPIRY - NOW) / 86400 ))
        echo "  → 만료까지 $DAYS 일 남음"
        [ "$DAYS" -lt 30 ] && echo "  ⚠️  30일 미만! 갱신 필요"
    fi
fi

echo ""
echo "  [SAN (Subject Alternative Names) - 인증서가 커버하는 도메인들]"
echo "$CERT" | openssl x509 -noout -text 2>/dev/null | grep -A2 "Subject Alternative Name" | head -5

echo ""
echo "  [공개키 정보]"
echo "$CERT" | openssl x509 -noout -pubkey 2>/dev/null | openssl pkey -pubin -text -noout 2>/dev/null | head -5
echo ""
read -rp "확인 후 Enter:"

# ── Step 3-C: 인증서 체인 검증 ───────────────────────────
echo ""
echo "━━━ Step 3-C: 인증서 체인 확인 ━━━"
echo ""
echo "  서버는 Leaf 인증서 + Intermediate CA를 전송해야 함"
echo "  (Root CA는 브라우저/OS에 내장)"
echo ""

echo | openssl s_client -connect "$TARGET:443" -showcerts 2>/dev/null | \
    grep -E "^(subject|issuer|depth)" | \
    awk '{if(/subject/) sub(/subject=/, "  인증서: "); if(/issuer/) sub(/issuer=/, "  발급자: "); print}'

echo ""
echo "  ▶ depth=0: 서버 인증서 (Leaf)"
echo "  ▶ depth=1: Intermediate CA"
echo "  ▶ depth=2: Root CA (서버가 보내지 않아도 브라우저가 내장 보유)"
echo ""
read -rp "확인 후 Enter:"

# ── Step 3-D: TLS 1.2 vs 1.3 핸드셰이크 비교 ─────────────
echo ""
echo "━━━ Step 3-D: TLS 1.2 vs 1.3 핸드셰이크 시간 ━━━"
echo ""

echo "  [TLS 1.3 - 1-RTT]"
TLS13_TIME=$(curl --tlsv1.3 -o /dev/null -s \
    -w "%{time_appconnect}" https://"$TARGET" 2>/dev/null)
echo "  TLS 핸드셰이크 시간: ${TLS13_TIME}s"

echo ""
echo "  [TLS 1.2 - 2-RTT (지원시)]"
TLS12_TIME=$(curl --tlsv1.2 --tls-max 1.2 -o /dev/null -s \
    -w "%{time_appconnect}" https://"$TARGET" 2>/dev/null)
echo "  TLS 핸드셰이크 시간: ${TLS12_TIME}s"

echo ""
echo "  ▶ TLS 1.3이 빠른 이유: 1-RTT (1번 왕복으로 핸드셰이크 완료)"
echo "  ▶ TLS 1.2: 2-RTT 필요 (왕복 2번)"
echo ""

# ── Step 3-E: 취약한 TLS 설정 테스트 ────────────────────
echo "━━━ Step 3-E: 취약한 설정 확인 ━━━"
echo ""
echo "  SSL 3.0 지원 여부 (CVE-2014-3566 POODLE 취약점):"
echo | openssl s_client -ssl3 -connect "$TARGET:443" 2>&1 | grep -E "error|handshake|no protocols"

echo ""
echo "  TLS 1.0 지원 여부 (PCI-DSS 비준수):"
echo | openssl s_client -tls1 -connect "$TARGET:443" 2>&1 | grep -E "error|Protocol|handshake" | head -2

echo ""
echo "  ▶ 현대 서버는 TLS 1.2 이상만 지원해야 함 (PCI-DSS 요구사항)"
echo "  ▶ 결제 서비스: TLS 1.2 이상 필수"
echo ""
echo "✅ TLS 실습 완료!"
