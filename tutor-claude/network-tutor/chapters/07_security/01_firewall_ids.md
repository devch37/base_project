# 방화벽 & IDS/IPS & WAF

## 방화벽 유형

```
1. Packet Filter (L3/L4)
   IP, 포트, 프로토콜 기반 규칙
   Stateless: 각 패킷 독립 처리
   빠름, 단순
   예: iptables (기본), AWS NACL

2. Stateful Inspection (L4)
   연결 상태(Connection State) 추적
   응답 패킷 자동 허용
   예: iptables conntrack, AWS Security Group

3. Application Firewall (L7)
   HTTP, DNS 내용 기반 필터링
   URL, 도메인, 페이로드 분석
   예: AWS WAF, Cloudflare, Nginx

4. NGFW (Next-Generation Firewall)
   Stateful + Application + IPS + SSL Inspection
   예: Palo Alto, Fortinet, CheckPoint
```

---

## iptables 완전 이해

```
iptables 4개 테이블:
  raw:    연결 추적 전 처리 (고급)
  mangle: 패킷 마킹/수정 (QoS)
  nat:    주소 변환 (SNAT/DNAT)
  filter: 허용/차단 (기본, 가장 많이 사용)

5개 체인 (패킷 처리 순서):
  PREROUTING  → 라우팅 결정 전 (nat, mangle, raw)
  INPUT       → 로컬 프로세스로 전달 (filter, mangle)
  FORWARD     → 포워딩 (filter, mangle)
  OUTPUT      → 로컬 프로세스에서 전송 (filter, mangle, nat, raw)
  POSTROUTING → 전송 직전 (nat, mangle)

패킷 흐름:
  인바운드: PREROUTING → (라우팅) → INPUT → 프로세스
  포워딩:  PREROUTING → (라우팅) → FORWARD → POSTROUTING
  아웃바운드: 프로세스 → OUTPUT → (라우팅) → POSTROUTING
```

### iptables 주요 명령

```bash
# 규칙 조회
iptables -L -n -v --line-numbers
iptables -t nat -L -n -v

# 기본 정책
iptables -P INPUT DROP      # 기본 차단
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 규칙 추가
iptables -A INPUT -p tcp --dport 443 -j ACCEPT   # HTTPS 허용
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT  # 내부에서만 SSH
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT  # 응답 허용
iptables -A INPUT -i lo -j ACCEPT  # Loopback 허용

# SYN Flood 방어
iptables -A INPUT -p tcp --syn -m limit --limit 10/s --limit-burst 20 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP

# Rate Limiting (API 서버 보호)
iptables -A INPUT -p tcp --dport 8080 -m connlimit --connlimit-above 100 -j REJECT
```

---

## WAF (Web Application Firewall)

```
HTTP 레이어 보호 (OWASP Top 10):
  SQL Injection:     "SELECT * FROM" 패턴 차단
  XSS:              <script> 태그 차단
  Path Traversal:   ../../../etc/passwd 패단 차단
  Command Injection: ; rm -rf 차단
  DDoS:             Rate Limiting, IP Blocking

AWS WAF 예시:
  Rule Group:
    - AWSManagedRulesCommonRuleSet  (일반 공격)
    - AWSManagedRulesSQLiRuleSet    (SQL Injection)
    - RateBasedRule: 5분간 IP당 2000 요청 초과 시 차단

주의: WAF 우회 가능 → 애플리케이션 레벨 보안도 필수
```

---

## IDS/IPS

```
IDS (Intrusion Detection System):
  트래픽 모니터링 + 이상 감지 + 알림
  인라인이 아님 → 트래픽 차단 불가, 감지만

IPS (Intrusion Prevention System):
  인라인 배치 → 실시간 차단 가능
  오탐(False Positive) 주의 → 정상 트래픽 차단 위험

HIDS vs NIDS:
  HIDS: 호스트 기반 (파일 무결성, 프로세스, 로그)
        예: OSSEC, Wazuh, Falco (컨테이너)
  NIDS: 네트워크 기반 (패킷 분석)
        예: Snort, Suricata, Zeek
```

---

## 면접 단골 질문

**Q. iptables의 ACCEPT와 RETURN의 차이는?**
> ACCEPT: 즉시 허용 후 체인 종료. RETURN: 현재 체인에서 호출한 상위 체인으로 돌아감 (서브체인에서 사용).

**Q. WAF와 방화벽의 차이는?**
> 방화벽: IP/포트 기반 (L3/L4). WAF: HTTP 내용 기반 (L7). WAF는 SQL Injection, XSS 등 애플리케이션 레벨 공격 방어. 방화벽은 네트워크 접근 제어.
