// =============================================================================
// 챕터 07: 에러 처리 - 커스텀 에러 타입과 ResponseError
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. Actix Web의 에러 처리 철학
// 2. thiserror로 커스텀 에러 타입 만들기
// 3. ResponseError 트레이트 구현 (에러를 HTTP 응답으로 변환)
// 4. ? 연산자로 간결하게 에러 전파하기
// 5. 에러 미들웨어와 커스텀 에러 핸들러
//
// Rust의 에러 처리 철학:
// - 에러는 panic이 아닌 Result<T, E>로 처리합니다
// - ? 연산자로 에러를 간결하게 전파합니다
// - 타입 시스템으로 에러 상황을 명시적으로 표현합니다
//
// =============================================================================

use actix_web::{
    get, post,
    web::{self, Json},
    App, HttpResponse, HttpServer, Responder, ResponseError,
};
use serde::{Deserialize, Serialize};
use std::fmt;
use thiserror::Error;

// =============================================================================
// 커스텀 에러 타입 정의
// =============================================================================

// thiserror::Error 파생 매크로: Error 트레이트를 자동 구현합니다
// #[error("...")] 속성: Display 트레이트의 fmt 메서드를 자동 구현합니다
#[derive(Debug, Error)]
pub enum AppError {
    // 리소스를 찾을 수 없을 때 (404)
    // {0}: 첫 번째 필드를 format에 삽입합니다
    #[error("{0}을(를) 찾을 수 없습니다")]
    NotFound(String),

    // 입력값이 잘못되었을 때 (400)
    #[error("잘못된 요청: {message}")]
    BadRequest { message: String },

    // 인증 실패 (401)
    #[error("인증이 필요합니다")]
    Unauthorized,

    // 권한 없음 (403)
    #[error("이 리소스에 접근할 권한이 없습니다")]
    Forbidden,

    // 서버 내부 오류 (500)
    // #[source]: 원인 에러를 래핑합니다
    #[error("서버 내부 오류: {0}")]
    InternalError(String),

    // 다른 에러 타입을 AppError로 변환 (From 트레이트 자동 구현)
    // #[from]: From<std::io::Error> 자동 구현
    #[error("IO 오류: {0}")]
    IoError(#[from] std::io::Error),
}

// =============================================================================
// ResponseError 트레이트 구현
// AppError를 HTTP 응답으로 변환하는 방법을 정의합니다
// =============================================================================

// Actix Web의 ResponseError: 에러를 HTTP 응답으로 변환합니다
impl ResponseError for AppError {
    // error_response(): 에러를 HttpResponse로 변환합니다
    fn error_response(&self) -> HttpResponse {
        // 에러 타입에 따라 다른 HTTP 상태 코드와 메시지를 반환합니다
        let error_body = serde_json::json!({
            "error": true,
            "message": self.to_string(),  // Display 구현으로 메시지 가져오기
            "error_type": self.error_type_str(),
        });

        match self {
            AppError::NotFound(_) => {
                HttpResponse::NotFound().json(error_body)
            }
            AppError::BadRequest { .. } => {
                HttpResponse::BadRequest().json(error_body)
            }
            AppError::Unauthorized => {
                HttpResponse::Unauthorized().json(error_body)
            }
            AppError::Forbidden => {
                HttpResponse::Forbidden().json(error_body)
            }
            AppError::InternalError(_) | AppError::IoError(_) => {
                HttpResponse::InternalServerError().json(error_body)
            }
        }
    }
}

impl AppError {
    // 에러 타입의 이름을 문자열로 반환 (로깅/디버깅용)
    fn error_type_str(&self) -> &'static str {
        match self {
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::BadRequest { .. } => "BAD_REQUEST",
            AppError::Unauthorized => "UNAUTHORIZED",
            AppError::Forbidden => "FORBIDDEN",
            AppError::InternalError(_) => "INTERNAL_ERROR",
            AppError::IoError(_) => "IO_ERROR",
        }
    }
}

// =============================================================================
// 서비스 레이어 (비즈니스 로직) - 에러를 반환하는 함수들
// =============================================================================

// 실제 비즈니스 로직에서 에러를 Result로 반환합니다
fn find_user_by_id(id: u64) -> Result<User, AppError> {
    // 시뮬레이션: id가 1이면 성공, 아니면 NotFound 에러
    if id == 1 {
        Ok(User {
            id,
            name: "홍길동".to_string(),
            email: "hong@example.com".to_string(),
        })
    } else {
        // AppError::NotFound를 반환합니다
        Err(AppError::NotFound(format!("사용자 ID {}", id)))
    }
}

fn validate_age(age: u8) -> Result<(), AppError> {
    if age < 18 {
        // 검증 실패 시 BadRequest 에러를 반환합니다
        Err(AppError::BadRequest {
            message: format!("나이는 18세 이상이어야 합니다. 입력값: {}", age),
        })
    } else if age > 150 {
        Err(AppError::BadRequest {
            message: format!("유효하지 않은 나이입니다: {}", age),
        })
    } else {
        Ok(())
    }
}

// =============================================================================
// 데이터 구조체
// =============================================================================

#[derive(Serialize, Clone)]
struct User {
    id: u64,
    name: String,
    email: String,
}

#[derive(Deserialize)]
struct RegisterRequest {
    name: String,
    email: String,
    age: u8,
}

// =============================================================================
// 핸들러 함수들 - ? 연산자로 간결한 에러 처리
// =============================================================================

// ? 연산자 사용 예시
// 반환 타입이 Result<impl Responder, AppError>이면 ? 연산자를 사용할 수 있습니다
#[get("/users/{id}")]
async fn get_user(path: web::Path<u64>) -> Result<impl Responder, AppError> {
    let id = path.into_inner();

    // ? 연산자: find_user_by_id가 Err를 반환하면
    // 즉시 해당 에러를 반환합니다 (함수 종료)
    // ResponseError가 구현되어 있어 자동으로 HTTP 응답으로 변환됩니다
    let user = find_user_by_id(id)?;

    // 성공 시 계속 실행됩니다
    Ok(HttpResponse::Ok().json(user))
}

// 여러 ?를 연속으로 사용하는 예시
#[post("/register")]
async fn register_user(
    body: Json<RegisterRequest>,
) -> Result<impl Responder, AppError> {
    let req = body.into_inner();

    // ? 연산자를 여러 번 사용하여 각 단계의 에러를 처리합니다
    // 각 단계가 실패하면 즉시 에러를 반환합니다
    validate_age(req.age)?;

    // 이메일 형식 검증
    if !req.email.contains('@') {
        return Err(AppError::BadRequest {
            message: "유효하지 않은 이메일 형식입니다".to_string(),
        });
    }

    // 실제로는 DB에 저장하겠지만, 여기서는 시뮬레이션
    let user = User {
        id: 42,
        name: req.name,
        email: req.email,
    };

    Ok(HttpResponse::Created().json(user))
}

// 인증이 필요한 엔드포인트
#[get("/admin")]
async fn admin_only(req: actix_web::HttpRequest) -> Result<impl Responder, AppError> {
    // Authorization 헤더 확인
    let auth = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if auth.is_empty() {
        // 인증 헤더가 없으면 401 Unauthorized
        return Err(AppError::Unauthorized);
    }

    if auth != "Bearer admin-secret" {
        // 권한이 없으면 403 Forbidden
        return Err(AppError::Forbidden);
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "어드민 전용 데이터입니다",
        "secret": "🔐 비밀 정보"
    })))
}

// 내부 서버 에러 시뮬레이션
#[get("/crash")]
async fn simulate_crash() -> Result<impl Responder, AppError> {
    // 의도적으로 에러를 발생시킵니다
    Err(AppError::InternalError(
        "데이터베이스 연결이 끊어졌습니다".to_string()
    ))
}

// =============================================================================
// 여러 에러 타입을 처리하는 패턴
// =============================================================================

// 여러 에러 타입이 섞일 때는 map_err()로 변환합니다
#[get("/file-content")]
async fn read_file_content() -> Result<impl Responder, AppError> {
    // std::io::Error -> AppError::IoError 자동 변환 (#[from] 덕분에)
    // std::fs::read_to_string은 std::io::Error를 반환하지만
    // AppError가 #[from] std::io::Error를 가지므로 ? 사용 가능
    let content = std::fs::read_to_string("nonexistent.txt")?;

    Ok(HttpResponse::Ok().body(content))
}

// =============================================================================
// 메인 함수
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("에러 처리 예제 서버 시작: http://127.0.0.1:8086");
    println!();
    println!("=== 에러 처리 테스트 ===");
    println!("# 정상 조회 (200 OK):");
    println!("curl http://127.0.0.1:8086/users/1");
    println!();
    println!("# 404 Not Found:");
    println!("curl http://127.0.0.1:8086/users/999");
    println!();
    println!("# 회원가입 성공:");
    println!("curl -X POST http://127.0.0.1:8086/register \\");
    println!("  -H 'Content-Type: application/json' \\");
    println!("  -d '{{\"name\": \"김철수\", \"email\": \"kim@example.com\", \"age\": 25}}'");
    println!();
    println!("# 400 Bad Request (나이 미달):");
    println!("curl -X POST http://127.0.0.1:8086/register \\");
    println!("  -H 'Content-Type: application/json' \\");
    println!("  -d '{{\"name\": \"어린이\", \"email\": \"child@example.com\", \"age\": 10}}'");
    println!();
    println!("# 401 Unauthorized:");
    println!("curl http://127.0.0.1:8086/admin");
    println!();
    println!("# 403 Forbidden:");
    println!("curl -H 'Authorization: Bearer wrong-token' http://127.0.0.1:8086/admin");
    println!();
    println!("# 200 OK (어드민):");
    println!("curl -H 'Authorization: Bearer admin-secret' http://127.0.0.1:8086/admin");
    println!();
    println!("# 500 Internal Server Error:");
    println!("curl http://127.0.0.1:8086/crash");

    HttpServer::new(|| {
        App::new()
            .service(get_user)
            .service(register_user)
            .service(admin_only)
            .service(simulate_crash)
            .service(read_file_content)
    })
    .bind(("127.0.0.1", 8086))?
    .run()
    .await
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// 에러 처리 패턴:
//   1. 커스텀 에러 타입 정의: #[derive(thiserror::Error)]
//   2. ResponseError 구현: 에러 -> HTTP 응답 변환
//   3. 핸들러 반환 타입: Result<impl Responder, AppError>
//   4. ? 연산자로 에러 전파
//
// thiserror 매크로:
//   #[error("메시지")]     = Display 자동 구현
//   #[from]               = From 트레이트 자동 구현
//   #[source]             = 원인 에러 지정
//
// ? 연산자 vs unwrap():
//   unwrap(): 에러 시 panic! -> 프로그램 강제 종료 (피해야 함)
//   ?:        에러 시 즉시 반환 -> 안전하게 처리
//
// 에러 변환 (From 트레이트):
//   #[from] std::io::Error -> std::io::Error를 AppError로 자동 변환
//   다른 크레이트 에러도 같은 방식으로 변환 가능
//
// 다음 단계: 08_advanced에서 WebSocket과 스트리밍을 배웁니다!
// =============================================================================
