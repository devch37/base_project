#!/bin/bash
# Lab 05 - Step 2: HTTP 완전 분석 (지연 측정, 캐싱, 버전 비교)

echo "========================================"
echo " Lab 05 Step 2: HTTP 실습"
echo "========================================"
echo ""

# ── HTTP 타이밍 측정 형식 ─────────────────────────────────
CURL_FORMAT='
  DNS 조회:       %{time_namelookup}s
  TCP 연결:       %{time_connect}s
  TLS 핸드셰이크: %{time_appconnect}s
  첫 바이트(TTFB): %{time_starttransfer}s
  전체:           %{time_total}s
  응답 크기:      %{size_download} bytes
  HTTP 버전:      %{http_version}
  상태 코드:      %{http_code}
'

# ── Step 2-A: 각 단계별 지연 측정 ────────────────────────
echo "━━━ Step 2-A: HTTP 요청 단계별 타이밍 ━━━"
echo ""
echo "  1차 요청 (DNS 캐시 없을 수 있음):"
curl -o /dev/null -s -w "$CURL_FORMAT" https://httpbin.org/get

echo ""
echo "  2차 요청 (DNS 캐시 히트):"
curl -o /dev/null -s -w "$CURL_FORMAT" https://httpbin.org/get

echo ""
echo "  ▶ 2차에서 'DNS 조회' 시간이 줄었나요? → DNS 캐시 효과"
echo "  ▶ TTFB = 서버 처리 시간 지표 (이게 높으면 백엔드가 느린 것)"
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-B: HTTP 버전 비교 ─────────────────────────────
echo ""
echo "━━━ Step 2-B: HTTP 버전별 비교 ━━━"
echo ""

for version in "--http1.1" "--http2"; do
    echo "  [$version]"
    curl $version -o /dev/null -s -w "  HTTP버전: %{http_version}  전체시간: %{time_total}s\n" \
        https://www.google.com
done

echo ""
echo "  ▶ HTTP/2: 하나의 TCP 연결로 멀티플렉싱 → 빠름"
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-C: 응답 헤더 분석 ─────────────────────────────
echo ""
echo "━━━ Step 2-C: 응답 헤더 상세 분석 ━━━"
echo ""

curl -sI https://httpbin.org/get | while IFS= read -r line; do
    header=$(echo "$line" | cut -d: -f1)
    value=$(echo "$line" | cut -d: -f2-)
    case "$header" in
        "Cache-Control") echo "  [캐싱]       $line" ;;
        "Content-Type")  echo "  [타입]       $line" ;;
        "Content-Encoding") echo "  [압축]       $line" ;;
        "X-"*)           echo "  [커스텀]     $line" ;;
        "Server")        echo "  [서버]       $line" ;;
        *)               echo "  $line" ;;
    esac
done
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-D: ETag 캐시 검증 ─────────────────────────────
echo ""
echo "━━━ Step 2-D: ETag 기반 캐시 검증 실습 ━━━"
echo ""
echo "  [1단계] 첫 번째 요청 → ETag 받기"
ETAG=$(curl -sI https://httpbin.org/etag/test-etag | grep -i etag | awk '{print $2}' | tr -d '\r')
echo "  ETag: $ETAG"
echo ""

echo "  [2단계] If-None-Match로 재검증 요청"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "If-None-Match: $ETAG" \
    https://httpbin.org/etag/test-etag)
echo "  응답 코드: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "304" ]; then
    echo "  ✅ 304 Not Modified → 캐시 유효! 본문 없이 응답"
    echo "     → 대역폭 절약, 빠른 응답"
else
    echo "  ℹ️  $HTTP_CODE 응답 (ETag 미지원 또는 변경됨)"
fi
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-E: Keep-Alive 연결 재사용 ─────────────────────
echo ""
echo "━━━ Step 2-E: Connection Keep-Alive 효과 ━━━"
echo ""
echo "  [keep-alive 없이: 매 요청마다 새 연결]"
time for i in 1 2 3; do
    curl -s -o /dev/null --no-keepalive https://httpbin.org/get &
done
wait

echo ""
echo "  [keep-alive 있음: 연결 재사용 (curl 기본)]"
time curl -s -o /dev/null https://httpbin.org/get \
     && curl -s -o /dev/null https://httpbin.org/get \
     && curl -s -o /dev/null https://httpbin.org/get

echo ""
echo "  ▶ keep-alive: TCP 연결을 재사용해서 handshake 비용 절약"
echo ""
echo "✅ HTTP 실습 완료!"
