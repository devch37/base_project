# 소켓 & 포트 & Keep-Alive

## 소켓이란?

```
소켓 = 네트워크 통신의 끝점(Endpoint)
      프로세스가 네트워크에 접근하는 API

소켓 식별자 (5-tuple):
  프로토콜 + 출발지IP + 출발지포트 + 목적지IP + 목적지포트

예:
  TCP / 10.0.0.1:52341 / 8.8.8.8:443
  TCP / 10.0.0.1:52342 / 8.8.8.8:443   ← 같은 서버, 다른 포트 → 다른 소켓
  TCP / 10.0.0.1:52341 / 1.1.1.1:443   ← 다른 서버 → 다른 소켓
```

---

## 포트 번호 범위

```
0     ~ 1023:   Well-Known Ports (시스템 포트)
  - 루트 권한 필요
  - 20/21: FTP, 22: SSH, 23: Telnet
  - 25: SMTP, 53: DNS, 80: HTTP, 443: HTTPS
  - 3306: MySQL, 5432: PostgreSQL, 6379: Redis, 27017: MongoDB

1024  ~ 49151:  Registered Ports (등록 포트)
  - 8080: HTTP Alternate, 8443: HTTPS Alternate
  - 9090: Prometheus, 9200: Elasticsearch, 2181: Zookeeper
  - 특별한 권한 불필요

49152 ~ 65535:  Ephemeral Ports (임시 포트, 클라이언트 포트)
  Linux 기본: 32768~60999
  확인: cat /proc/sys/net/ipv4/ip_local_port_range
```

---

## 서버 소켓 생명주기

```
서버 측:
  socket()    → 소켓 생성 (fd 반환)
  bind()      → 포트 바인딩 (ex: :8080)
  listen()    → 연결 요청 대기 (backlog 큐 설정)
  accept()    → 클라이언트 연결 수락 → 새 소켓 fd 반환
  read/write()→ 데이터 송수신
  close()     → 소켓 닫기

클라이언트 측:
  socket()    → 소켓 생성
  connect()   → 서버에 연결 요청 (3-way handshake 발생)
  read/write()→ 데이터 송수신
  close()     → 소켓 닫기
```

### listen() backlog

```
listen(fd, backlog):
  backlog: 연결 요청 대기 큐 크기

실제로는 두 개의 큐:
  SYN Queue (incomplete):
    SYN_RECEIVED 상태
    크기: /proc/sys/net/ipv4/tcp_max_syn_backlog (기본 1024)

  Accept Queue (complete):
    ESTABLISHED 상태, accept() 호출 대기 중
    크기: min(backlog, /proc/sys/net/core/somaxconn)

큐 넘침 시:
  SYN Drop: 클라이언트는 재시도 (SYN Flood 방어와 연관)
  SYN Cookie: 큐 없이 SYN+ACK에 정보 인코딩 (SYN Flood 방어)
```

---

## TCP Keep-Alive

연결이 살아있는지 주기적으로 확인 (유휴 연결 감지):

```
기본 설정 (Linux):
  tcp_keepalive_time:   7200초 (2시간 후 첫 Probe)
  tcp_keepalive_intvl:  75초 (Probe 간격)
  tcp_keepalive_probes: 9번 (응답 없으면 연결 종료)

→ 기본값은 너무 길다! 실무에서는 줄여야 함
```

### 애플리케이션 레벨 Keep-Alive

OS TCP Keep-Alive와 별개로 애플리케이션 프로토콜에도 Keep-Alive 존재:

```
HTTP/1.1 Keep-Alive (Persistent Connection):
  Connection: keep-alive  헤더
  → 한 번 맺은 TCP 연결로 여러 HTTP 요청 처리
  → Connection: close 이면 매 요청마다 TCP 연결/종료 (비효율)

HTTP/2, HTTP/3:
  기본적으로 단일 연결에서 멀티플렉싱
  PING 프레임으로 연결 유지 확인

gRPC:
  keepalive_time, keepalive_timeout 설정 가능
  HTTP/2 PING으로 구현
```

---

## 실무 소켓 문제

### 1. Connection Refused
```
원인: 서버 포트가 열려있지 않음
  → 서비스 다운, 잘못된 포트, 방화벽

확인:
  telnet 호스트 포트
  nc -zv 호스트 포트
  curl -v http://호스트:포트
```

### 2. Connection Timeout
```
원인: 패킷이 목적지에 도달하지 못함
  → 방화벽에서 DROP (REJECT는 즉시 응답)
  → 라우팅 문제, 네트워크 장애

확인:
  traceroute 호스트
  tcpdump -i any 'host 호스트'
  → SYN 전송 후 SYN+ACK 오는지 확인
```

### 3. 소켓 고갈 (Too many open files)
```
각 소켓 = 파일 디스크립터(fd) 소비
최대 fd 수: ulimit -n (기본 1024 또는 4096)

확인:
  lsof -p PID | wc -l   # 프로세스별 fd 수
  cat /proc/sys/fs/file-max  # 시스템 전체 최대

해결:
  ulimit -n 65536  # 세션 한정 증가
  # /etc/security/limits.conf 에서 영구 설정
  *  soft  nofile  65536
  *  hard  nofile  65536
```

---

## 실습 과제

```bash
# 1. 내 서버의 열린 포트 확인
netstat -tlnp   # tcp, listen, numeric, program
ss -tlnp

# 2. 특정 프로세스의 소켓 확인
lsof -i -P -n | grep java   # Java 프로세스
lsof -i :8080               # 특정 포트를 사용하는 프로세스

# 3. 연결 수 통계
ss -s
# Estab: 현재 연결, TimeWait: TIME_WAIT, Closed: CLOSED 상태

# 4. 포트가 열려있는지 빠른 확인
nc -zv localhost 8080
# succeeded → 열림, failed → 닫힘

# 5. TCP Keep-Alive 현재 설정 (Linux)
sysctl net.ipv4.tcp_keepalive_time
sysctl net.ipv4.tcp_keepalive_intvl
sysctl net.ipv4.tcp_keepalive_probes
```

## 면접 단골 질문

**Q. 서버가 80 포트 하나로 수천 개의 동시 연결을 받을 수 있는 이유는?**
> 소켓은 5-tuple(프로토콜+src IP+src port+dst IP+dst port)로 식별. 서버 측 80 포트는 동일하지만 각 클라이언트마다 src IP와 src port 조합이 다름 → 서로 다른 소켓.

**Q. listen() backlog를 너무 작게 설정하면 어떤 문제가 생기나요?**
> Accept Queue가 가득 차면 새 연결 요청(SYN)이 Drop됨. 클라이언트에서 "Connection timed out" 발생. 트래픽 스파이크나 accept() 처리가 느릴 때 발생.

**Q. HTTP Keep-Alive가 성능에 어떤 영향을 미치나요?**
> Keep-Alive 없이: 요청마다 TCP 3-way handshake + TLS 핸드셰이크 → 지연 증가. Keep-Alive 있음: 연결 재사용 → 핸드셰이크 비용 절약. 단, 서버에서 연결을 유지하는 비용이 있으므로 timeout 적절히 설정 필요.
