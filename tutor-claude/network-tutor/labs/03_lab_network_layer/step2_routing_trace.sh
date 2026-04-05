#!/bin/bash
# Lab 03 - Step 2: 라우팅 경로 추적 & TTL 실험

echo "========================================"
echo " Lab 03 Step 2: 라우팅 & traceroute"
echo "========================================"
echo ""

# ── Step 2-A: 라우팅 테이블 읽기 ─────────────────────────
echo "━━━ Step 2-A: 현재 라우팅 테이블 ━━━"
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
    netstat -rn -f inet | head -20
else
    ip route show
fi
echo ""
echo "▶ 읽는 법:"
echo "  Destination  Gateway         Flags  Interface"
echo "  0.0.0.0/0    192.168.1.1     UGS    en0       ← 기본 게이트웨이"
echo "  192.168.1.0  link#...        U      en0       ← 직접 연결 네트워크"
echo "  127.0.0.1    127.0.0.1       UH     lo0       ← Loopback"
echo ""
echo "  U=Up, G=Gateway, S=Static, H=Host, C=Cache"
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-B: 특정 IP로 가는 경로 확인 ───────────────────
echo ""
echo "━━━ Step 2-B: 특정 IP로 가는 경로 ━━━"
echo ""

TARGETS=("8.8.8.8" "1.1.1.1" "google.com")
for target in "${TARGETS[@]}"; do
    echo "  → $target 로 가는 경로:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        route -n get "$target" 2>/dev/null | grep -E 'gateway|interface|destination'
    else
        ip route get "$target" 2>/dev/null | head -3
    fi
    echo ""
done
read -rp "확인 후 Enter:"

# ── Step 2-C: traceroute 실행 & 분석 ─────────────────────
echo ""
echo "━━━ Step 2-C: traceroute 실행 ━━━"
echo ""
echo "  traceroute 원리:"
echo "  TTL=1: 첫 번째 라우터에서 TTL 만료 → ICMP Time Exceeded 응답"
echo "  TTL=2: 두 번째 라우터에서 TTL 만료 → ICMP Time Exceeded 응답"
echo "  ...반복하다 목적지 도달 시 종료"
echo ""

TRACE_TARGET="8.8.8.8"
echo "  [traceroute to $TRACE_TARGET]"
echo "  (보통 10~20홉, 각 홉 = 라우터 1대)"
echo ""

if command -v mtr &> /dev/null; then
    echo "  mtr 사용 (traceroute + 실시간 품질 측정)"
    mtr --report --report-cycles 3 -n "$TRACE_TARGET" 2>/dev/null | head -25
else
    traceroute -n -m 20 "$TRACE_TARGET" 2>/dev/null | head -25
fi

echo ""
echo "▶ 각 홉 의미:"
echo "  홉 번호  IP주소          RTT(왕복시간)"
echo "  * * *    → 응답 없음 (방화벽이 ICMP TTL Exceeded 차단)"
echo "  RTT 급증 → 해당 라우터/링크가 병목 or 지리적으로 멈"
echo ""
read -rp "확인 후 Enter:"

# ── Step 2-D: TTL 직접 조작 실험 ─────────────────────────
echo ""
echo "━━━ Step 2-D: TTL 조작 → 라우터별 응답 관찰 ━━━"
echo ""
echo "  TTL=1로 ping → 첫 번째 라우터(게이트웨이)만 응답"
echo "  TTL=2로 ping → 두 번째 라우터까지"
echo "  이게 traceroute의 원리!"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  [TTL=1: 첫 번째 홉 (게이트웨이)]"
    ping -c 1 -m 1 8.8.8.8 2>&1 | grep -E "TTL|ttl|Time|time|Exceeded"
    echo ""
    echo "  [TTL=2: 두 번째 홉]"
    ping -c 1 -m 2 8.8.8.8 2>&1 | grep -E "TTL|ttl|Time|time|Exceeded"
else
    echo "  [TTL=1: 첫 번째 홉 (게이트웨이)]"
    ping -c 1 -t 1 8.8.8.8 2>&1 | tail -3
    echo ""
    echo "  [TTL=2: 두 번째 홉]"
    ping -c 1 -t 2 8.8.8.8 2>&1 | tail -3
fi

echo ""
echo "▶ 'Time to live exceeded' 응답 IP = 해당 홉의 라우터 IP"
echo ""

# ── Step 2-E: Longest Prefix Match 실험 ──────────────────
echo "━━━ Step 2-E: Longest Prefix Match 시뮬레이션 ━━━"
echo ""

python3 - <<'PYEOF'
import ipaddress

# 라우팅 테이블 시뮬레이션
routing_table = [
    ("0.0.0.0/0",       "기본 게이트웨이 (인터넷)"),
    ("10.0.0.0/8",      "회사 내부망 전체"),
    ("10.0.1.0/24",     "개발팀 서브넷"),
    ("10.0.1.128/25",   "개발팀 서버 전용"),
    ("192.168.0.0/16",  "홈 네트워크"),
]

test_ips = ["10.0.1.200", "10.0.1.50", "10.0.2.1", "8.8.8.8", "192.168.1.100"]

print("  [라우팅 테이블]")
for cidr, desc in routing_table:
    print(f"    {cidr:<20} → {desc}")

print("\n  [Longest Prefix Match 결과]")
for ip_str in test_ips:
    ip = ipaddress.ip_address(ip_str)
    best = None
    best_len = -1
    best_desc = ""
    for cidr, desc in routing_table:
        net = ipaddress.ip_network(cidr)
        if ip in net and net.prefixlen > best_len:
            best = cidr
            best_len = net.prefixlen
            best_desc = desc

    print(f"    {ip_str:<18} → {best:<20} ({best_desc})")
PYEOF

echo ""
echo "✅ Step 2 완료! 다음: step3_nat_observer.sh"
