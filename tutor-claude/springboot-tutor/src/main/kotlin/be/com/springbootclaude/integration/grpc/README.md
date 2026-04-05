# gRPC 학습 가이드 (basic ~ advanced)

## 패키지 구조

- `integration/grpc/basic`
  - `BasicGreeterGrpcService`: gRPC 서버 구현 (unary, server streaming)
  - `GreeterApplicationService`: 비즈니스 로직 분리
  - `GrpcRequestValidator`: 입력 검증
  - `GrpcErrorMapper`: 예외 -> Status 변환

- `integration/grpc/advanced`
  - `GrpcCorrelationInterceptor`: request-id 처리
  - `GrpcAuthInterceptor`: 메타데이터 기반 인증 패턴
  - `GrpcRequestContext`: Context 기반 요청 스코프 데이터
  - `GrpcClientExample`: gRPC 클라이언트 호출 예시

## 실무 베스트 프랙티스 요약

- 서비스 구현체는 얇게 유지하고, Application Service로 로직 위임
- 예외는 `StatusException`으로 변환하여 명확한 에러 전달
- Metadata + Interceptor로 공통 관심사(인증, 추적, 로깅) 분리
- gRPC는 HTTP 2 기반이므로 REST 포트와 분리해서 운영

## 빠른 테스트 (예시)

- 서버 포트: `9090`
- reflection 활성화: `grpc.server.reflection-service-enabled=true`

```bash
# reflection 확인
grpcurl -plaintext localhost:9090 list

# unary 호출
grpcurl -plaintext \
  -d '{"name":"Kim","requestId":"req-1"}' \
  localhost:9090 be.com.springbootclaude.grpc.Greeter/SayHello

# streaming 호출
grpcurl -plaintext \
  -d '{"name":"Lee","count":3}' \
  localhost:9090 be.com.springbootclaude.grpc.Greeter/StreamGreetings
```

## 애플리케이션 내부 Client 호출 예시

`GrpcClientExample`에 unary + streaming 예제가 포함되어 있습니다.

```kotlin
// unary
val message = grpcClientExample.callHello("Kim")

// server streaming
val messages = grpcClientExample.streamGreetings("Lee", 3)
```
