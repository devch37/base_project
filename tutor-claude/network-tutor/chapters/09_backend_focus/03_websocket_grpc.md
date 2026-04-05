# WebSocket & gRPC & SSE

## WebSocket

### HTTP → WebSocket 업그레이드

```
1. HTTP Handshake (업그레이드 요청):
   GET /ws HTTP/1.1
   Host: api.example.com
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
   Sec-WebSocket-Version: 13

2. 서버 응답:
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

3. WebSocket 프레임 교환:
   ← 평문 TCP 연결 유지 → 양방향 실시간 통신
```

### WebSocket 프레임 구조

```
FIN  RSV1 RSV2 RSV3  Opcode   MASK  Payload Length
 1    0    0    0     0x1      1     7bit / 16bit / 64bit

Opcode:
  0x0: Continuation
  0x1: Text Frame
  0x2: Binary Frame
  0x8: Close
  0x9: Ping
  0xA: Pong

클라이언트→서버: MASK=1 (마스킹 필수 - XSS/프록시 오염 방지)
서버→클라이언트: MASK=0
```

### WebSocket 실무 고려사항

```
연결 유지:
  Ping/Pong으로 연결 생존 확인
  클라이언트: 30초마다 Ping
  서버: Pong 응답 없으면 연결 종료

LB에서 WebSocket:
  L7 LB (ALB): WebSocket 지원 O
  Sticky Session 필요 (또는 공유 상태 저장소)
  타임아웃 설정 주의: 기본 60초 → 증가 필요

스케일 아웃 문제:
  서버 A에 연결된 클라이언트들 → 서버 B의 이벤트 못 받음
  해결: Redis Pub/Sub, Kafka로 서버 간 이벤트 전달

nginx WebSocket 설정:
  location /ws {
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_read_timeout 3600s;  # 1시간
  }
```

---

## gRPC

### gRPC vs REST 비교

```
REST:
  프로토콜: HTTP/1.1 or HTTP/2
  형식: JSON (텍스트, 큼)
  타입: 없음 (런타임 오류)
  스트리밍: 지원 안 됨 (SSE로 단방향만)
  브라우저: 직접 지원

gRPC:
  프로토콜: HTTP/2 (필수)
  형식: Protocol Buffers (바이너리, 작음, 빠름)
  타입: 강한 타입 (proto 파일)
  스트리밍: 4가지 모드
  브라우저: gRPC-Web 필요
```

### gRPC 4가지 통신 모드

```
1. Unary (단순 요청/응답 — REST와 유사)
   Client → Request → Server → Response

2. Server Streaming (서버 → 클라이언트 스트림)
   Client → Request → Server → Response(stream)
   사용: 실시간 로그, 진행 상황

3. Client Streaming (클라이언트 → 서버 스트림)
   Client → Request(stream) → Server → Response
   사용: 파일 업로드, 센서 데이터

4. Bidirectional Streaming (양방향)
   Client ←→ stream ←→ Server
   사용: 채팅, 실시간 게임
```

### Protocol Buffers

```protobuf
// user.proto
syntax = "proto3";

package user;

service UserService {
    rpc GetUser (GetUserRequest) returns (User);
    rpc ListUsers (ListUsersRequest) returns (stream User);
    rpc CreateUser (stream UserEvent) returns (CreateUserResponse);
}

message User {
    int64 id = 1;
    string name = 2;
    string email = 3;
    repeated string roles = 4;
    google.protobuf.Timestamp created_at = 5;
}

// 직렬화 크기 비교:
// JSON:  {"id":1,"name":"Alice","email":"a@b.com"}  → 42 bytes
// Proto: 같은 데이터                                  → ~15 bytes
```

---

## SSE (Server-Sent Events)

```
단방향 서버 → 클라이언트 스트리밍 (HTTP 기반)

요청:
  GET /events HTTP/1.1
  Accept: text/event-stream

응답 (스트림):
  Content-Type: text/event-stream
  Cache-Control: no-cache

  data: {"type": "user_joined", "userId": 123}\n\n
  data: {"type": "message", "text": "Hello"}\n\n
  id: 5
  data: {"type": "update"}\n\n

클라이언트 (JavaScript):
  const es = new EventSource('/events');
  es.onmessage = e => console.log(JSON.parse(e.data));

특징:
  HTTP 기반 → 방화벽/프록시 친화적
  자동 재연결 (Last-Event-ID 헤더로 이어받기)
  단방향 → 클라이언트는 새 HTTP 요청으로 데이터 전송
  브라우저 네이티브 지원
```

### WebSocket vs SSE vs Long Polling 비교

```
Long Polling:
  클라이언트가 응답 올 때까지 연결 유지
  데이터 오면 응답 → 즉시 재연결
  단점: 오버헤드 큼, 구현 복잡

SSE:
  HTTP, 단방향(서버→클라이언트)
  구현 단순, 방화벽 통과 쉬움
  사용: 알림, 피드, 주가 업데이트

WebSocket:
  양방향, 낮은 지연
  프로토콜 업그레이드 필요
  사용: 채팅, 협업 도구, 게임
```

---

## 실습 과제

```bash
# 1. WebSocket 테스트 (wscat)
npm install -g wscat
wscat -c wss://ws.postman-echo.com/raw
> Hello World!    # 입력 후 에코 확인

# 2. gRPC 서비스 테스트 (grpcurl)
brew install grpcurl
grpcurl -plaintext localhost:50051 list  # 서비스 목록
grpcurl -plaintext localhost:50051 helloworld.Greeter/SayHello

# 3. SSE 테스트
curl -N http://localhost:8080/events
# -N: 버퍼 비우기 (실시간 출력)

# 4. HTTP/2 WebSocket (RFC 8441)
curl -v --http2 -N http://localhost:8080/ws
```

## 면접 단골 질문

**Q. WebSocket과 HTTP의 가장 큰 차이는?**
> HTTP: Request-Response, 클라이언트가 요청해야 서버가 응답. WebSocket: Full-Duplex, 연결 후 서버가 먼저 데이터를 보낼 수 있음. 연결 수립은 HTTP를 사용하지만 이후 별도 프레임 프로토콜.

**Q. gRPC가 REST보다 느려지는 상황이 있나요?**
> 단건 요청이고 데이터가 작은 경우 Protocol Buffers 직렬화/역직렬화 오버헤드가 JSON보다 클 수 있음. HTTP/2 필수이므로 HTTP/1.1만 지원하는 환경에서 문제. 브라우저에서 직접 사용 불가(gRPC-Web 필요).
