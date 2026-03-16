# Actix Web 단계별 학습 튜토리얼

Rust 초보자를 위한 Actix Web 웹 프레임워크 학습 프로젝트입니다.
각 챕터는 독립적인 Cargo 크레이트로 구성되어 있어, 단계별로 학습할 수 있습니다.

## 학습 순서

| 챕터 | 주제 | 핵심 개념 |
|------|------|-----------|
| 01_basic | Hello World & 기본 라우팅 | HttpServer, App, Handler |
| 02_routing | 경로 파라미터 & 쿼리 스트링 | Path, Query, HTTP 메서드 |
| 03_request_response | JSON & 폼 데이터 처리 | Json, Form, HttpResponse |
| 04_middleware | 미들웨어 & 로깅 | Middleware, Logger, 인증 |
| 05_state | 앱 상태 공유 | Data<T>, Mutex, Arc |
| 06_database | SQLite CRUD | sqlx, 비동기 DB 쿼리 |
| 07_error_handling | 에러 처리 패턴 | ResponseError, thiserror |
| 08_advanced | WebSocket & 스트리밍 | WebSocket, Stream |

## 실행 방법

각 챕터 디렉토리에서:
```bash
cargo run
```

또는 workspace 루트에서 특정 챕터 실행:
```bash
cargo run -p actix-01-basic
```

## 사전 요구사항

- Rust 1.75 이상 (Edition 2021)
- cargo 설치
- 06_database 챕터는 SQLite 관련 패키지 필요 (대부분 자동 설치)

## 학습 팁

1. 챕터 순서대로 진행하세요. 각 챕터는 이전 챕터의 개념을 기반으로 합니다.
2. 코드를 그냥 읽지 말고 직접 수정해보세요.
3. 주석을 꼼꼼히 읽으세요. 핵심 개념이 담겨 있습니다.
4. `cargo check`로 빠르게 컴파일 오류를 확인하세요.
