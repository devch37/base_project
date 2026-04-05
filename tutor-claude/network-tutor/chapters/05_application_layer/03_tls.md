# TLS (Transport Layer Security)

## TLS가 제공하는 3가지 보장

```
1. 기밀성 (Confidentiality): 대칭 암호화로 데이터 암호화
2. 무결성 (Integrity):      MAC(Message Authentication Code)으로 변조 감지
3. 인증 (Authentication):   인증서(Certificate)로 서버 신원 확인
```

---

## TLS 1.3 핸드셰이크 (1-RTT)

```
Client                                      Server
  │                                             │
  │ ClientHello                                 │
  │ ─────────────────────────────────────────→  │
  │ - 지원 TLS 버전                             │
  │ - 지원 암호 스위트 목록                      │
  │ - Key Share (Diffie-Hellman 공개값)         │
  │ - 랜덤 데이터 (Client Random)              │
  │                                             │
  │              ServerHello                   │
  │              Certificate                   │
  │              CertificateVerify             │
  │              Finished                      │
  │  ←──────────────────────────────────────── │
  │ - 선택된 암호 스위트                        │
  │ - Key Share (서버 DH 공개값)               │
  │ - 서버 인증서                              │
  │ - 서명 (개인키로 서명)                      │
  │                                             │
  │ Finished                                   │
  │ ─────────────────────────────────────────→  │
  │                                             │
  │ ←────────────── Application Data ──────→   │
  │                 (암호화 통신 시작)           │
```

### TLS 1.2 vs 1.3 비교

```
TLS 1.2 (구버전):
  연결 수립: 2-RTT (TCP 1-RTT + TLS 2-RTT = 3-RTT)
  알고리즘: RSA 키 교환 (서버 개인키 노출 시 모든 세션 복호화 가능)
  약점: Forward Secrecy 미보장 (일부 설정)

TLS 1.3 (현재 표준):
  연결 수립: 1-RTT (or 0-RTT 재연결)
  알고리즘: (EC)DHE만 사용 → Perfect Forward Secrecy 필수
  제거된 취약 알고리즘: RSA 키 교환, RC4, 3DES, SHA-1, MD5
  → 매 세션마다 새 키 생성 → 과거 트래픽 복호화 불가
```

---

## 대칭 키 교환: Diffie-Hellman

TLS의 핵심 — 키를 전송하지 않고 공유 비밀키를 만드는 마법:

```
수학적 원리 (색상 비유):
  공개 색상: 노란색 (모두 앎)

  Alice: 개인 색상 = 빨강 (비밀)
  Bob:   개인 색상 = 파랑 (비밀)

  Alice가 Bob에게 전송: 노랑+빨강 = 주황 (공개)
  Bob이 Alice에게 전송: 노랑+파랑 = 초록 (공개)

  Alice: 초록(Bob이 준 것)+빨강 = 갈색
  Bob:   주황(Alice가 준 것)+파랑 = 갈색  ← 같은 색!

  → 둘 다 "갈색"이라는 공유 비밀을 가짐
  → 공격자는 주황+초록만 봐도 갈색을 알 수 없음!
```

### ECDHE (Elliptic Curve Diffie-Hellman Ephemeral)
```
TLS 1.3에서 권장:
  - EC(타원곡선): 짧은 키로 RSA 동등 보안 (256bit EC ≈ 3072bit RSA)
  - Ephemeral: 매 세션마다 새 키 쌍 생성 → PFS 보장
```

---

## 인증서 (Certificate) 구조

```
X.509 인증서 주요 필드:
  Subject: CN=api.example.com, O=Example Corp
  Issuer:  CN=R3, O=Let's Encrypt
  Valid:   2026-01-01 ~ 2026-04-01 (3개월)
  Public Key: EC 256bit
  SAN (Subject Alternative Names):
    DNS: api.example.com
    DNS: *.example.com
    DNS: www.example.com
  Signature: (Issuer CA가 서명)
```

---

## PKI (Public Key Infrastructure)

```
신뢰 체계:

[브라우저/OS에 내장된 Root CA]
  ↓ 서명
[Intermediate CA (예: R3, Let's Encrypt)]
  ↓ 서명
[서버 인증서 (api.example.com)]

검증 과정:
  1. 서버 인증서를 Intermediate CA 공개키로 서명 검증
  2. Intermediate CA를 Root CA 공개키로 서명 검증
  3. Root CA는 브라우저/OS에 내장 → 신뢰

Chain of Trust (신뢰 체인):
  Root CA → Intermediate CA → 서버 인증서
  서버는 Certificate Chain 전체를 전송해야 함
  (인증서 설정 오류: Intermediate CA 누락 → 일부 클라이언트에서 오류)
```

---

## mTLS (Mutual TLS)

일반 TLS는 클라이언트가 서버만 검증.
mTLS는 **서버도 클라이언트를 검증**:

```
일반 TLS:
  Client ──→ Server 인증서 검증
  Client ←── 암호화 통신

mTLS:
  Client ──→ Server 인증서 검증
  Client ←── Client 인증서 요청
  Client ──→ Client 인증서 전송
  Client ←── Client 인증서 검증
  ──────── 상호 인증 완료 후 암호화 통신
```

### 사용 사례
```
마이크로서비스 간 통신:
  Istio, Linkerd가 자동으로 mTLS 적용
  → 각 서비스가 인증서 보유 → 서비스 간 신원 검증

API 게이트웨이:
  클라이언트 앱(모바일, IoT)에 인증서 배포
  → 인증서 없으면 연결 자체 거부

Zero Trust:
  "네트워크 내부라도 신뢰 안 함"
  → 모든 서비스 간 통신에 mTLS 강제
```

---

## 실습 과제

```bash
# 1. 인증서 정보 확인
openssl s_client -connect google.com:443 -showcerts

# 2. 인증서 상세 내용
echo | openssl s_client -connect google.com:443 2>/dev/null | \
  openssl x509 -text -noout | head -50

# 3. 만료일 확인
echo | openssl s_client -connect google.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# 4. TLS 버전 확인
curl -vI https://google.com 2>&1 | grep -E "TLSv|SSL"

# 5. 특정 TLS 버전으로 연결 테스트
openssl s_client -tls1_2 -connect google.com:443  # TLS 1.2
openssl s_client -tls1_3 -connect google.com:443  # TLS 1.3

# 6. 인증서 체인 검증
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt 서버인증서.pem

# 7. Wireshark TLS 분석
# 필터: tls
# ClientHello, ServerHello, Certificate, Application Data 확인
# ClientHello에서 지원 암호 스위트 목록 확인
```

## 면접 단골 질문

**Q. TLS 1.2와 1.3의 차이는?**
> 1.3: 1-RTT (1.2는 2-RTT), 취약 알고리즘 제거(RSA 키교환, RC4 등), Perfect Forward Secrecy 필수, 0-RTT 재연결 지원.

**Q. Perfect Forward Secrecy(PFS)란?**
> 서버의 개인키가 탈취되어도 과거 세션들을 복호화할 수 없는 특성. TLS 1.3에서 DHE/ECDHE로 매 세션마다 임시 키 쌍 생성. 과거 트래픽 녹화해도 키 없어서 복호화 불가.

**Q. 인증서 체인이 불완전할 때 어떤 증상이 발생하나요?**
> 일부 클라이언트(특히 오래된 OS, 모바일)에서 SSL certificate error. curl이나 최신 브라우저는 AIA(Authority Information Access)로 중간 인증서를 자동 다운로드하기도 하지만 항상 신뢰 불가. 서버 설정에서 Intermediate CA 포함 필수.
