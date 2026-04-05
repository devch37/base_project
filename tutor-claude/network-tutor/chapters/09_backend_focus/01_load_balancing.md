# 로드 밸런싱 심화

## 로드 밸런싱 알고리즘

### Round Robin
```
요청 순서대로 서버를 순환:
  요청 1 → 서버 A
  요청 2 → 서버 B
  요청 3 → 서버 C
  요청 4 → 서버 A ...

문제: 서버 A는 8코어, 서버 B는 2코어인데 동일 분배
→ Weighted Round Robin으로 해결
```

### Least Connections
```
현재 활성 연결 수가 가장 적은 서버로:
  서버 A: 100 connections
  서버 B: 20 connections  ← 선택
  서버 C: 50 connections

적합: 요청 처리 시간이 다양할 때 (긴 연결, 파일 업로드)
```

### IP Hash (세션 고정)
```
클라이언트 IP의 해시로 항상 같은 서버로:
  hash(client_ip) % server_count → 서버 인덱스

적합: 세션을 특정 서버에 고정해야 할 때
문제: NAT 뒤 여러 클라이언트가 같은 IP → 한 서버로 몰림
```

### Consistent Hashing
```
서버 추가/제거 시 최소한의 재분배:

일반 해시: 서버 4→5개로 늘리면 모든 매핑 재계산
일관된 해시: 1/5만 재분배

사용: Redis 클러스터, Cassandra, CDN 캐시 서버 선택
```

### Least Response Time
```
응답 시간 + 활성 연결 수 조합:
  (active_connections * response_time)이 가장 작은 서버
  Nginx Plus, HAProxy 지원
```

---

## 헬스체크 (Health Check)

```
Passive Health Check:
  실제 요청에서 오류 감지
  오류율 임계값 초과 시 서버 제외
  지연: 실제 사용자가 오류를 먼저 받음

Active Health Check:
  LB가 주기적으로 서버에 요청
  응답 확인 후 라우팅 결정
  더 빠른 장애 감지

AWS ALB 헬스체크:
  프로토콜: HTTP, HTTPS, TCP
  경로: /health, /actuator/health
  성공 코드: 200-299
  간격: 10~300초 (기본 30초)
  임계값: 정상 2회, 비정상 2회

헬스체크 엔드포인트 설계:
  GET /health → 200 OK
  {
    "status": "UP",
    "db": "UP",           ← DB 연결
    "cache": "UP",        ← Redis 연결
    "disk": { "free": "10GB" }
  }

  Shallow: 자기 자신만 확인 (LB 헬스체크용)
  Deep:    의존성(DB, Redis) 포함 (모니터링용)
  주의: LB 헬스체크에 Deep Check 사용 → 의존성 장애 시 모든 서버 비정상으로 판단 → 서비스 전체 다운!
```

---

## Sticky Session (세션 고정)

```
문제: 서버가 메모리에 세션 저장 → 다른 서버로 라우팅 시 세션 없음

해결 방법:

1. Cookie 기반 (ALB Sticky)
   LB가 AWSALB 쿠키에 서버 정보 인코딩
   클라이언트가 쿠키를 보내면 같은 서버로

2. IP Hash
   위에서 설명

3. 공유 세션 저장소 (권장!)
   Redis, Memcached에 세션 저장
   → 어느 서버로 라우팅해도 세션 공유
   → Sticky 불필요, 수평 확장 용이

Sticky Session의 문제:
  특정 서버에 부하 집중 (파워 유저)
  서버 장애 시 세션 손실
  스케일인 시 세션 있는 서버 제거 어려움
```

---

## AWS ALB vs NLB

```
ALB (Application Load Balancer):
  L7 (HTTP/HTTPS/WebSocket)
  URL 경로 기반 라우팅: /api/* → API 서버, /static/* → S3
  호스트 헤더 기반: api.example.com vs web.example.com
  SSL Termination (백엔드는 HTTP)
  X-Forwarded-For로 클라이언트 IP 전달
  Target: EC2, IP, Lambda, 컨테이너
  사용: HTTP API 서버

NLB (Network Load Balancer):
  L4 (TCP/UDP/TLS)
  초고성능: 수백만 RPS, 낮은 지연
  고정 IP (Elastic IP)
  클라이언트 IP 보존 (PROXY Protocol)
  TCP/UDP 게임 서버, IoT
  사용: 비HTTP, 초저지연 필요, 고정 IP 필요

GLB (Gateway Load Balancer):
  L3 (IP 패킷)
  서드파티 방화벽/IDS 어플라이언스 통과 트래픽
```

---

## 실습 과제

```bash
# 1. Nginx 로드 밸런서 설정
cat > /tmp/nginx-lb.conf << 'EOF'
upstream backend {
    least_conn;              # Least Connections 알고리즘
    server 10.0.0.1:8080 weight=3;
    server 10.0.0.2:8080 weight=1;
    server 10.0.0.3:8080 backup;   # 장애 시에만 사용

    keepalive 32;            # 업스트림 Keep-Alive 연결 유지
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        return 200 "OK";
    }
}
EOF

# 2. 헬스체크 시뮬레이션
while true; do
  curl -s -o /dev/null -w "%{http_code} %{time_total}\n" http://localhost:8080/health
  sleep 1
done

# 3. 연결 분배 확인
for i in $(seq 1 10); do
  curl -s http://load-balancer/whoami
done
```

## 면접 단골 질문

**Q. Round Robin과 Least Connections 중 언제 어떤 것을 선택하나요?**
> Round Robin: 요청 처리 시간이 비슷하고 빠른 API. Least Connections: 처리 시간이 다양하거나 긴 연결(파일 업로드, WebSocket).

**Q. 헬스체크 엔드포인트에 DB 연결 확인을 포함해야 하나요?**
> LB 헬스체크에는 Shallow Check만. DB 장애 시 모든 인스턴스가 Unhealthy → 서비스 완전 다운. DB 연결은 별도 모니터링 엔드포인트(/health/detail)로. Readiness Probe와 Liveness Probe 분리.
