# Rust 튜터 - 에이전트 메모리

## 학습자 프로필
- 수준: Rust 초보자 (Actix Web 처음 배우는 단계)
- 목표: Actix Web 웹 프레임워크 마스터
- 선호: 단계별 학습, 실행 가능한 예제, 한국어 주석

## 완료된 학습 프로젝트

### actix-web-tutorial (Cargo workspace)
위치: /Users/chulhanlee/Desktop/workspace/study/base_project/tutor-claude/rust-tutor/actix-web-tutorial/
- 01_basic: HttpServer, App, Handler, Responder 기초
- 02_routing: Path params, Query string, HTTP 메서드, scope
- 03_request_response: JSON(serde), Form, 헤더, 다양한 응답 형식
- 04_middleware: Logger, wrap_fn 인증 미들웨어, tracing
- 05_state: App State, Mutex, 인메모리 Todo CRUD
- 06_database: SQLx + SQLite, 커넥션 풀, 실제 CRUD API
- 07_error_handling: thiserror, ResponseError, ? 연산자
- 08_advanced: WebSocket(actix-ws), SSE, 스트리밍

## 환경 정보
- cargo 명령어가 PATH에 없음 (터미널에서 직접 실행 필요)
- OS: macOS (Darwin 24.6.0)
- 작업 디렉토리: /Users/chulhanlee/Desktop/workspace/study/base_project/tutor-claude/rust-tutor

## 자주 쓰는 패턴

### Actix Web 기본 구조
```rust
HttpServer::new(|| App::new().service(handler)).bind(addr).run().await
```

### 상태 공유 패턴
```rust
let state = web::Data::new(MyState { data: Mutex::new(...) });
HttpServer::new(move || App::new().app_data(state.clone()))
```

### 에러 처리 패턴
```rust
#[derive(thiserror::Error)]  -> ResponseError 구현 -> Result<impl Responder, AppError>
```
