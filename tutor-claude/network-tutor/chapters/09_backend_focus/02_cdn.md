# CDN (Content Delivery Network)

## CDN 동작 원리

```
CDN 없이:
  사용자(서울) ──────────────── 오리진 서버(미국, 200ms RTT)

CDN 있을 때:
  사용자(서울) ── CDN PoP(서울, 5ms) ── [캐시 히트 → 즉시 응답]
                                     └── [캐시 미스 → 미국 오리진]

PoP (Point of Presence): 전 세계 주요 도시에 위치한 CDN 엣지 서버
```

### CDN 요청 흐름

```
1. 사용자: cdn.example.com → DNS 조회
2. DNS: CDN 업체 DNS 서버로 위임 (CNAME)
3. CDN DNS: 사용자 위치 기반 가장 가까운 PoP IP 반환
   (Anycast 또는 GeoDNS 활용)
4. 사용자 → CDN PoP: HTTP 요청
5. PoP 캐시 히트 → 즉시 응답
   PoP 캐시 미스 → 오리진 서버에서 가져와 캐시 + 응답
```

---

## CDN 캐시 제어

```
Cache-Control 헤더:
  public, max-age=31536000, immutable
    → CDN이 1년간 캐시, 내용 변경 없음 (버전된 파일)
    → /static/app.v1.2.3.js

  public, max-age=3600
    → CDN이 1시간 캐시 (API 응답, 자주 바뀌지 않는 데이터)

  private, no-store
    → CDN 캐시 금지 (사용자별 다른 응답: JWT, 장바구니)

  s-maxage=3600, max-age=0
    → CDN은 1시간 캐시, 브라우저는 매번 재검증

CDN Cache Key:
  기본: URL (경로 + 쿼리스트링)
  커스텀: 헤더, 쿠키 포함 가능
  주의: Accept-Language를 캐시 키에 포함 → 다국어 응답 분리
```

### Cache Invalidation (캐시 무효화)

```
방법 1: TTL 만료
  → 간단하지만 즉각적이지 않음

방법 2: CDN Purge API
  Cloudflare: POST /zones/{id}/purge_cache
  CloudFront: CreateInvalidation API
  → 즉각적, API 호출 비용

방법 3: 버전 URL (권장!)
  /static/app.v1.js → /static/app.v2.js
  → 이전 버전은 TTL까지 유효, 새 버전은 즉시 배포
  → CI/CD에서 파일 해시를 파일명에 포함
```

---

## Push CDN vs Pull CDN

```
Pull CDN (대부분 CDN):
  콘텐츠를 오리진에 두고, 요청 시 CDN이 가져옴
  장점: 관리 단순, 오리진이 Source of Truth
  단점: 첫 번째 요청(Cache Miss)은 오리진까지 감

Push CDN:
  개발자가 직접 CDN에 콘텐츠를 업로드
  장점: 오리진 트래픽 없음, 캐시 미스 없음
  단점: 업로드 관리 필요
  사용: 게임 패치 파일, 대형 미디어 파일
```

---

## Edge Computing

```
CDN 엣지 서버에서 코드 실행:
  지연: 사용자와 가장 가까운 곳에서 실행
  사용: 요청 라우팅, A/B 테스트, 인증, 지역화

Cloudflare Workers:
  V8 JavaScript 엔진 (Chrome과 동일)
  글로벌 200+ 데이터센터에서 실행
  콜드 스타트 없음 (Service Worker 모델)

AWS Lambda@Edge / CloudFront Functions:
  CloudFront 엣지에서 Lambda 실행
  Lambda@Edge: Node.js/Python, 더 강력
  CloudFront Functions: JavaScript, 매우 저지연

사용 사례:
  - URL 재작성/리다이렉트
  - 인증 토큰 검증 (오리진 부하 감소)
  - A/B 테스트 (쿠키 기반 분기)
  - 이미지 변환 (resizing, format 변환)
  - 지역별 콘텐츠 분기
```

---

## 실습 과제

```bash
# 1. CDN 캐시 히트 확인
curl -I https://cdn.example.com/static/logo.png
# X-Cache: Hit from cloudfront
# CF-Cache-Status: HIT

# 2. CDN 헤더 분석
curl -v https://www.cloudflare.com/
# cf-ray: 엣지 서버 ID
# CF-Cache-Status: HIT/MISS/EXPIRED

# 3. 여러 위치에서 DNS 응답 확인 (Anycast/GeoDNS)
dig @8.8.8.8 www.cloudflare.com
dig @1.1.1.1 www.cloudflare.com
# 다른 IP 반환 (위치 기반 다른 PoP)

# 4. Cache-Control 헤더 테스트
curl -I https://httpbin.org/cache/3600
# Cache-Control: public, max-age=3600 확인
```

## 면접 단골 질문

**Q. CDN Cache Invalidation이 어렵다고 하는데 왜인가요?**
> "캐시 무효화와 이름 짓기는 CS에서 가장 어려운 두 가지" (필 칼튼). CDN은 전 세계에 분산 → 모든 엣지에서 동시에 무효화가 되지 않음. TTL 기반이면 시간 지연, Purge API도 전파 지연. 해결책: 파일명에 버전/해시 포함 (Immutable Assets).

**Q. static 파일을 오리진 서버에서 직접 서빙하면 안 되나요?**
> 가능하지만 비효율. CDN 없이 서빙 시: 오리진 서버 CPU/대역폭 소모, 지리적으로 먼 사용자 높은 지연, 오리진 장애 = 서비스 전체 영향. CDN 활용으로 오리진 부하 최대 90% 감소.
