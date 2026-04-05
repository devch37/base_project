# DNS (Domain Name System)

## DNS란?

```
도메인 이름(api.example.com) → IP 주소(93.184.216.34) 변환
인터넷의 "전화번호부"

왜 필요한가?
  IP는 기억하기 어렵고, 서버를 옮기면 IP가 바뀜
  → 도메인은 유지, DNS 레코드만 변경하면 됨
```

---

## DNS 계층 구조

```
.                           ← 루트 (Root)
├── com.                    ← TLD (Top-Level Domain)
│   ├── google.com.         ← SLD (Second-Level Domain)
│   │   ├── www.google.com.
│   │   ├── mail.google.com.
│   │   └── api.google.com.
│   └── example.com.
├── org.
├── net.
└── kr.
    └── co.kr.
        └── naver.co.kr.
```

### DNS 서버 종류

```
1. 재귀 리졸버 (Recursive Resolver)
   클라이언트의 DNS 질의를 대신 해결해주는 서버
   예: 8.8.8.8 (Google), 1.1.1.1 (Cloudflare), ISP 제공

2. 루트 네임서버 (Root Name Server)
   전 세계 13개 (A~M). 실제로는 Anycast로 수백 개 운영
   TLD 네임서버 주소를 알고 있음

3. TLD 네임서버
   .com, .org, .kr 등을 담당
   SLD 네임서버 주소를 알고 있음

4. 권한 네임서버 (Authoritative Name Server)
   실제 도메인의 레코드를 보유
   예: Route 53, Cloudflare DNS
```

---

## DNS 재귀 질의 과정

`api.example.com` 접속 시:

```
[브라우저/OS] ──→ [재귀 리졸버 (8.8.8.8)]
                         │
                         │ 캐시 없음 → 루트부터 시작
                         │
                         ↓
              [루트 네임서버 (.)에 질의]
              "api.example.com 알아?"
              → "모르지만 .com 담당 NS는 a.gtld-servers.net"
                         │
                         ↓
              [.com TLD 네임서버에 질의]
              "api.example.com 알아?"
              → "모르지만 example.com NS는 ns1.example.com"
                         │
                         ↓
              [example.com 권한 NS에 질의]
              "api.example.com 알아?"
              → "응! A 레코드: 93.184.216.34"
                         │
                         ↓
         [재귀 리졸버가 결과를 클라이언트에 반환 + 캐시]

전체 소요: 수십~수백 ms (캐시 없을 때)
캐시 히트: 수 ms (TTL 내)
```

### 반복 질의 vs 재귀 질의

```
반복 질의 (Iterative): 클라이언트가 각 네임서버에 직접 질의
재귀 질의 (Recursive): 리졸버가 대신 전체 과정 수행

일반적으로: 클라이언트 → 재귀 질의 → 리졸버 → 반복 질의 → 루트~권한NS
```

---

## DNS 레코드 타입

```
A     → IPv4 주소
        api.example.com. IN A 93.184.216.34

AAAA  → IPv6 주소
        api.example.com. IN AAAA 2001:db8::1

CNAME → 도메인 별명 (다른 도메인으로 포인팅)
        www.example.com. IN CNAME example.com.
        ※ 루트 도메인(@)에는 CNAME 불가 → ALIAS/ANAME 사용

MX    → 메일 서버 (우선순위 포함)
        example.com. IN MX 10 mail.example.com.

TXT   → 텍스트 (SPF, DKIM, 도메인 인증에 사용)
        example.com. IN TXT "v=spf1 include:_spf.google.com ~all"

NS    → 이 도메인의 권한 네임서버
        example.com. IN NS ns1.example.com.

SOA   → Zone의 시작 정보 (primary NS, 관리자 이메일, 시리얼)

PTR   → 역방향 DNS (IP → 도메인, rDNS)
        34.216.184.93.in-addr.arpa. IN PTR api.example.com.

SRV   → 서비스 위치 (포트 포함)
        _https._tcp.example.com. IN SRV 0 5 443 api.example.com.
        gRPC, SIP 등에서 사용

CAA   → 인증서 발급 허용 CA 지정
        example.com. IN CAA 0 issue "letsencrypt.org"
```

---

## TTL (Time To Live)

```
DNS 레코드의 캐시 유효 시간 (초 단위)

낮은 TTL (60~300초):
  장점: IP 변경 시 빠른 전파
  단점: DNS 서버 부하 증가, 질의 지연 빈도 높음
  사용: 마이그레이션, 장애 대응 준비

높은 TTL (3600~86400초):
  장점: 캐시 히트율 높음, DNS 부하 낮음
  단점: IP 변경 시 전파에 시간 걸림
  사용: 안정적인 서비스

실무 팁:
  마이그레이션 전 며칠 전부터 TTL을 낮춰두기 (300초 이하)
  → IP 변경 후 빠른 전파 보장
  변경 완료 후 다시 TTL 높이기
```

---

## DNS 관련 보안

### DNS Spoofing / Cache Poisoning
```
공격자가 가짜 DNS 응답을 캐시에 주입
→ 사용자가 악성 서버로 연결됨

방어:
  DNSSEC: DNS 응답에 전자 서명 추가
  DNS over HTTPS (DoH): DNS 쿼리를 HTTPS로 암호화
  DNS over TLS (DoT): TLS로 암호화
```

### 실무에서의 DNS 구성

```
AWS Route 53 예시:
  도메인: api.myservice.com
  단순 라우팅: A 레코드 → EC2 IP
  가중치 라우팅: 10% 새 버전, 90% 기존 버전 (카나리 배포)
  지연 기반: 리전 중 가장 가까운 곳으로
  장애 조치: Health Check 실패 시 백업 IP로 자동 전환
```

---

## 실습 과제

```bash
# 1. DNS 질의 기본
dig api.example.com
dig api.example.com A
dig api.example.com MX

# 2. 특정 DNS 서버에 질의
dig @8.8.8.8 google.com
dig @1.1.1.1 google.com

# 3. 재귀 과정 추적 (+trace)
dig +trace google.com
# 루트 → .com TLD → google.com 권한 NS 순서 확인

# 4. TTL 확인
dig google.com | grep -E 'ANSWER|[0-9]+\s+IN'

# 5. 역방향 DNS (PTR)
dig -x 8.8.8.8   # IP → 도메인

# 6. 로컬 DNS 캐시 확인 (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# 7. DNS 응답 시간 측정
time dig google.com > /dev/null
# 첫 번째: 느림 (캐시 없음)
# 두 번째: 빠름 (캐시)
```

## 면접 단골 질문

**Q. 브라우저에서 google.com을 입력하면 어떤 일이 일어나나요? (DNS 부분)**
> 1) 브라우저 DNS 캐시 확인 2) OS DNS 캐시 확인 3) /etc/hosts 확인 4) 설정된 DNS 리졸버(8.8.8.8 등)에 UDP로 질의 5) 리졸버가 루트→TLD→권한 NS 순으로 재귀 질의 6) 결과 반환 + TTL동안 캐시.

**Q. CNAME과 A 레코드의 차이는?**
> A 레코드: 도메인 → IP 직접 매핑. CNAME: 도메인 → 다른 도메인으로 별명. CDN 사용 시 CNAME을 많이 사용 (CDN이 IP를 동적으로 관리). 루트 도메인(@)에는 CNAME 불가.

**Q. DNS TTL이 낮을 때의 단점은?**
> DNS 서버 부하 증가, 재귀 질의 지연이 빈번히 발생. 캐시 히트율 감소. 일반적으로 안정 운영 중에는 3600초 이상 권장.
