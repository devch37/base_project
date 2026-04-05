# HTTP 완전 분석 (1.1 → 2 → 3)

## HTTP/1.1 핵심 이해

### 요청/응답 구조

```
요청:
  GET /api/users?page=1 HTTP/1.1
  Host: api.example.com
  Authorization: Bearer eyJhbG...
  Accept: application/json
  Connection: keep-alive
  [빈 줄]
  [Body — GET은 없음]

응답:
  HTTP/1.1 200 OK
  Content-Type: application/json
  Content-Length: 1234
  Cache-Control: max-age=300
  [빈 줄]
  {"users": [...]}
```

### HTTP/1.1의 문제: Head-of-Line Blocking

```
하나의 TCP 연결에서 요청은 순차적:

요청 1 ──→ [서버 처리 50ms] ──→ 응답 1
요청 2 ──→ [서버 처리 100ms] ──→ 응답 2
요청 3 ──→ [서버 처리 10ms] ──→ 응답 3

요청 2가 느리면 요청 3도 대기!

해결책: 여러 TCP 연결 병렬 사용 (브라우저 기본: 도메인당 6개)
→ 하지만 연결마다 핸드셰이크 + TLS 비용
```

### Pipelining (개선 시도, 실패)
```
요청을 응답 기다리지 않고 연속 전송
→ 서버는 순서대로 응답 (여전히 HoL 문제)
→ 브라우저 대부분 비활성화 (구현 복잡, 버그 많음)
```

---

## HTTP/2

### 핵심 개선: 멀티플렉싱

```
하나의 TCP 연결에서 여러 스트림 동시 처리:

Stream 1: [요청 1] ──→ [응답 1]
Stream 3: [요청 2] ──→ [응답 2]  ← 병렬!
Stream 5: [요청 3] ──→ [응답 3]  ← 병렬!

프레임(Frame) 단위로 인터리빙:
  [Stream1-HEADERS][Stream3-HEADERS][Stream5-HEADERS]
  [Stream3-DATA][Stream1-DATA][Stream5-DATA]
```

### HTTP/2 주요 특징

```
1. 멀티플렉싱
   → 도메인당 1개 TCP 연결로 모든 요청 처리

2. 헤더 압축 (HPACK)
   → 반복되는 헤더를 인덱스로 대체
   → 첫 요청: Authorization 헤더 100byte
   → 이후 요청: 인덱스 1byte

3. 서버 푸시 (Server Push)
   → 클라이언트가 요청하기 전에 필요한 리소스 미리 전송
   → HTML 응답 시 CSS/JS도 함께 푸시
   → 실제 효과가 미미해 HTTP/2에서 deprecated 추세

4. 스트림 우선순위
   → 중요한 리소스(CSS)를 덜 중요한 것(이미지)보다 먼저

5. 바이너리 프레이밍
   → HTTP/1.1은 텍스트 → HTTP/2는 바이너리 (파싱 효율)
```

### HTTP/2의 남은 문제

```
TCP HoL Blocking:
  스트림 레벨 멀티플렉싱은 해결
  But: TCP 패킷 하나 손실 시 → 해당 TCP 연결 전체 대기
  → Stream 1, 3, 5 모두 멈춤!

HTTPS만 지원 (브라우저 구현 기준):
  표준상 HTTP도 가능하지만 브라우저들이 TLS 없이 h2 미지원
```

---

## HTTP/3 (QUIC 기반)

```
HTTP/3 = HTTP/2의 의미론 + QUIC(UDP) 전송

핵심 개선:
  스트림별 독립 패킷 손실 복구
  → Stream 1 패킷 손실 → Stream 3, 5에 영향 없음!
  → 진정한 HoL 없는 멀티플렉싱

연결 수립: 0-RTT (기존 세션) or 1-RTT (최초)
  → TCP + TLS: 최소 2-RTT
  → QUIC: 1-RTT (최초), 0-RTT (재연결)

모바일 로밍:
  QUIC Connection ID로 IP 변경에도 연결 유지
  Wi-Fi → LTE 전환 시 연결 끊김 없음
```

---

## HTTP 상태 코드 완전 정리

```
1xx — 정보
  100 Continue        → 요청 계속해도 됨 (Expect: 100-continue)
  101 Switching Protocols → WebSocket 업그레이드

2xx — 성공
  200 OK              → 성공
  201 Created         → 리소스 생성됨 (POST 후)
  204 No Content      → 성공, 본문 없음 (DELETE 후)
  206 Partial Content → Range 요청 부분 응답

3xx — 리다이렉트
  301 Moved Permanently → 영구 이동 (브라우저 캐시)
  302 Found            → 임시 이동
  304 Not Modified     → 캐시 유효, 본문 없음
  307 Temporary Redirect → 임시 이동, 메서드 유지
  308 Permanent Redirect → 영구 이동, 메서드 유지

4xx — 클라이언트 오류
  400 Bad Request      → 잘못된 요청 (파싱 불가)
  401 Unauthorized     → 인증 필요 (이름과 달리 Authentication)
  403 Forbidden        → 권한 없음 (Authorization)
  404 Not Found        → 리소스 없음
  405 Method Not Allowed → 허용 안 된 HTTP 메서드
  408 Request Timeout  → 요청 타임아웃
  409 Conflict         → 충돌 (중복 생성 등)
  410 Gone             → 영구 삭제됨 (404와 달리 의도적)
  422 Unprocessable Entity → 유효성 검사 실패
  429 Too Many Requests → 요청 속도 제한 초과

5xx — 서버 오류
  500 Internal Server Error → 서버 내부 오류
  502 Bad Gateway      → 업스트림 서버 오류 (LB → App 서버 통신 실패)
  503 Service Unavailable → 서비스 사용 불가 (과부하, 점검)
  504 Gateway Timeout  → 업스트림 타임아웃 (LB 기다렸는데 응답 없음)
```

### 502 vs 503 vs 504 구분 (백엔드 핵심)

```
502: LB가 App 서버로 연결 자체가 실패 (Connection Refused)
     → App 서버 다운, 잘못된 포트, 방화벽

503: App 서버가 연결은 됐지만 처리 불가 (큐 가득, 헬스체크 실패)
     → 과부하, 점검 중

504: App 서버가 응답을 너무 늦게 줌 (LB 타임아웃)
     → 느린 쿼리, 외부 API 지연, 데드락
```

---

## 중요 HTTP 헤더

### 캐싱

```
Cache-Control: max-age=3600, public
  max-age: 초 단위 캐시 유효시간
  public: CDN/프록시 캐시 허용
  private: 브라우저 캐시만 (CDN 불가)
  no-cache: 매번 서버에 검증 (저장은 함)
  no-store: 저장 자체 금지
  immutable: 변경 안 됨 (버전된 파일에 사용)

ETag: "abc123"
  리소스 버전 식별자 (해시 또는 버전)
  클라이언트: If-None-Match: "abc123" 전송
  서버: 변경 없으면 304, 변경됐으면 200 + 새 ETag

Last-Modified: Wed, 29 Mar 2026 10:00:00 GMT
  마지막 수정 시간
  클라이언트: If-Modified-Since: 전송
  서버: 변경 없으면 304
```

### CORS (Cross-Origin Resource Sharing)

```
Same-Origin Policy:
  브라우저는 다른 오리진(scheme+host+port)으로의 요청 제한

예: https://frontend.com에서 https://api.backend.com으로 요청
  → 오리진 다름 → CORS 정책 적용

Preflight (OPTIONS 요청):
  PUT, DELETE 등 "단순 요청" 아닌 경우 브라우저가 미리 확인

OPTIONS /api/users HTTP/1.1
Origin: https://frontend.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: Authorization

응답 (허용 시):
Access-Control-Allow-Origin: https://frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400  ← Preflight 캐시 시간
```

---

## 실습 과제

```bash
# 1. HTTP 버전 확인
curl -I https://www.google.com  # HTTP/2
curl -I --http3 https://www.cloudflare.com  # HTTP/3

# 2. 요청/응답 전체 보기
curl -v https://httpbin.org/get

# 3. 헤더만 보기
curl -D - -s -o /dev/null https://httpbin.org/get

# 4. ETag/캐시 테스트
curl -I https://httpbin.org/cache/60
# ETag 값 복사 후:
curl -H 'If-None-Match: "복사한ETag"' -I https://httpbin.org/cache/60
# → 304 응답 확인

# 5. HTTP/2 스트림 확인 (Wireshark)
# 필터: http2
# Frame Type: HEADERS, DATA, SETTINGS, WINDOW_UPDATE 확인

# 6. 상태 코드 강제 테스트
curl -o /dev/null -w "%{http_code}" https://httpbin.org/status/429
curl -o /dev/null -w "%{http_code}" https://httpbin.org/status/503
```

## 면접 단골 질문

**Q. HTTP/1.1, HTTP/2, HTTP/3의 차이를 설명하세요.**
> HTTP/1.1: 텍스트, 순차 처리 (HoL Blocking). HTTP/2: 바이너리, 멀티플렉싱, 헤더 압축. 하지만 TCP HoL는 남아있음. HTTP/3: QUIC(UDP) 기반, 스트림별 독립 손실 복구, 0-RTT 연결.

**Q. 401과 403의 차이는?**
> 401: 인증(Authentication) 실패 - 누구인지 모름. 로그인 필요. 403: 인가(Authorization) 실패 - 누구인지는 알지만 권한 없음.

**Q. 캐시 전략에서 ETag와 Last-Modified의 차이는?**
> Last-Modified: 시간 기반, 1초 이하 변경 감지 못함. ETag: 내용 기반 해시, 더 정확. 둘 다 있으면 ETag 우선.
