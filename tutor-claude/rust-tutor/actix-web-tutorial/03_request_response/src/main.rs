// =============================================================================
// 챕터 03: 요청/응답 처리 - JSON, 폼 데이터, 헤더
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. JSON 요청 받기 (web::Json<T>)
// 2. JSON 응답 보내기 (web::Json, serde_json)
// 3. 폼 데이터 처리 (web::Form<T>)
// 4. 헤더 읽기/설정하기
// 5. 커스텀 응답 만들기
//
// 테스트 방법:
// curl -X POST http://127.0.0.1:8082/users \
//   -H "Content-Type: application/json" \
//   -d '{"name": "홍길동", "email": "hong@example.com", "age": 25}'
// =============================================================================

use actix_web::{
    get, post, put,
    web::{self, Json},
    App, HttpRequest, HttpResponse, HttpServer, Responder,
};
use serde::{Deserialize, Serialize};

// =============================================================================
// 데이터 구조체 정의
// =============================================================================

// 요청 body로 받을 구조체: Deserialize 필요 (JSON -> Rust)
#[derive(Deserialize, Debug)]
struct CreateUserRequest {
    name: String,
    email: String,
    age: u8,
}

// 응답으로 보낼 구조체: Serialize 필요 (Rust -> JSON)
#[derive(Serialize)]
struct UserResponse {
    id: u64,
    name: String,
    email: String,
    age: u8,
    created_at: String,
}

// 요청과 응답 모두 사용: Deserialize + Serialize 둘 다 필요
#[derive(Deserialize, Serialize, Debug)]
struct UpdateUserRequest {
    name: Option<String>,    // Option = 선택적 필드 (없어도 됩니다)
    email: Option<String>,
    age: Option<u8>,
}

// API 응답의 공통 래퍼 구조체 (실무에서 자주 사용하는 패턴)
#[derive(Serialize)]
struct ApiResponse<T: Serialize> {
    success: bool,
    data: Option<T>,
    message: String,
}

// 제네릭(Generic) 구현: T 타입에 Serialize가 구현되어 있으면 작동합니다
impl<T: Serialize> ApiResponse<T> {
    fn ok(data: T, message: &str) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            message: message.to_string(),
        }
    }

    fn error(message: &str) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            message: message.to_string(),
        }
    }
}

// =============================================================================
// JSON 요청/응답 처리
// =============================================================================

// POST /users - JSON body를 받아서 사용자를 생성합니다
#[post("/users")]
async fn create_user(
    // web::Json<T>: Content-Type: application/json 요청을 자동으로 파싱합니다
    // 파싱 실패 시 400 Bad Request를 자동으로 반환합니다
    body: web::Json<CreateUserRequest>,
) -> impl Responder {
    // body.into_inner()로 내부 구조체를 꺼냅니다
    let request = body.into_inner();

    println!("새 사용자 생성 요청: {:?}", request);

    // 응답 구조체를 만듭니다 (실제로는 DB에 저장하겠지만, 지금은 가짜 데이터)
    let user = UserResponse {
        id: 1,
        name: request.name,
        email: request.email,
        age: request.age,
        created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    // Json(data)로 자동으로 JSON 직렬화 + Content-Type: application/json 설정
    HttpResponse::Created().json(ApiResponse::ok(user, "사용자가 생성되었습니다"))
}

// GET /users/{id} - 사용자 조회
#[get("/users/{id}")]
async fn get_user(path: web::Path<u64>) -> impl Responder {
    let id = path.into_inner();

    // 존재하는 사용자 시뮬레이션 (id가 1일 때만)
    if id == 1 {
        let user = UserResponse {
            id,
            name: "홍길동".to_string(),
            email: "hong@example.com".to_string(),
            age: 25,
            created_at: "2024-01-01T00:00:00Z".to_string(),
        };
        HttpResponse::Ok().json(ApiResponse::ok(user, "사용자 조회 성공"))
    } else {
        // 없는 사용자일 때 404 응답
        HttpResponse::NotFound().json(ApiResponse::<()>::error("사용자를 찾을 수 없습니다"))
    }
}

// PUT /users/{id} - 사용자 수정
#[put("/users/{id}")]
async fn update_user(
    path: web::Path<u64>,
    body: Json<UpdateUserRequest>,
) -> impl Responder {
    let id = path.into_inner();
    let update = body.into_inner();

    println!("사용자 {} 수정 요청: {:?}", id, update);

    let user = UserResponse {
        id,
        name: update.name.unwrap_or_else(|| "기존이름".to_string()),
        email: update.email.unwrap_or_else(|| "기존@email.com".to_string()),
        age: update.age.unwrap_or(20),
        created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    HttpResponse::Ok().json(ApiResponse::ok(user, "사용자 정보가 수정되었습니다"))
}

// =============================================================================
// 폼 데이터 처리
// HTML form submit이나 application/x-www-form-urlencoded 요청 처리
// =============================================================================

#[derive(Deserialize)]
struct LoginForm {
    username: String,
    password: String,
}

#[post("/login")]
async fn login(
    // web::Form<T>: Content-Type: application/x-www-form-urlencoded 요청을 파싱합니다
    form: web::Form<LoginForm>,
) -> impl Responder {
    let form = form.into_inner();

    // 실제로는 DB에서 비밀번호를 확인해야 합니다
    // 여기서는 시뮬레이션만 합니다
    if form.username == "admin" && form.password == "password" {
        HttpResponse::Ok()
            .json(serde_json::json!({  // serde_json::json! 매크로로 빠르게 JSON 만들기
                "success": true,
                "token": "fake-jwt-token-12345",
                "message": "로그인 성공"
            }))
    } else {
        HttpResponse::Unauthorized()
            .json(serde_json::json!({
                "success": false,
                "message": "아이디 또는 비밀번호가 올바르지 않습니다"
            }))
    }
}

// =============================================================================
// 헤더 처리
// =============================================================================

#[get("/headers")]
async fn read_headers(req: HttpRequest) -> impl Responder {
    // 헤더 맵에서 특정 헤더 읽기
    let authorization = req
        .headers()
        .get("Authorization")                    // HeaderName으로 조회
        .and_then(|v| v.to_str().ok())           // HeaderValue를 &str로 변환
        .unwrap_or("Authorization 헤더 없음");

    let accept = req
        .headers()
        .get("Accept")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("*/*");

    let response_data = serde_json::json!({
        "authorization": authorization,
        "accept": accept,
        "method": req.method().as_str(),
        "uri": req.uri().to_string(),
    });

    // 응답 헤더도 직접 설정할 수 있습니다
    HttpResponse::Ok()
        .insert_header(("X-Custom-Header", "Actix-Web-Tutorial"))  // 커스텀 헤더 추가
        .insert_header(("X-Request-ID", "abc-123"))
        .json(response_data)
}

// =============================================================================
// 다양한 응답 형식
// =============================================================================

// 텍스트 응답
#[get("/text")]
async fn text_response() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("일반 텍스트 응답입니다")
}

// HTML 응답
#[get("/html")]
async fn html_response() -> impl Responder {
    let html = r#"<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Actix Web 튜토리얼</title>
</head>
<body>
    <h1>안녕하세요!</h1>
    <p>Actix Web으로 만든 HTML 페이지입니다.</p>
</body>
</html>"#;

    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

// 리다이렉트 응답
#[get("/redirect")]
async fn redirect_response() -> impl Responder {
    // 302 Found: 임시 리다이렉트
    HttpResponse::Found()
        .insert_header(("Location", "http://127.0.0.1:8082/html"))
        .finish()
}

// =============================================================================
// 메인 함수
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("서버 시작: http://127.0.0.1:8082");
    println!();
    println!("=== JSON API 테스트 (curl 사용) ===");
    println!("# 사용자 생성:");
    println!("curl -X POST http://127.0.0.1:8082/users \\");
    println!("  -H 'Content-Type: application/json' \\");
    println!("  -d '{{\"name\": \"홍길동\", \"email\": \"hong@example.com\", \"age\": 25}}'");
    println!();
    println!("# 사용자 조회:");
    println!("curl http://127.0.0.1:8082/users/1");
    println!();
    println!("# 로그인 (폼 데이터):");
    println!("curl -X POST http://127.0.0.1:8082/login \\");
    println!("  -d 'username=admin&password=password'");
    println!();
    println!("# 헤더 확인:");
    println!("curl http://127.0.0.1:8082/headers \\");
    println!("  -H 'Authorization: Bearer mytoken'");

    HttpServer::new(|| {
        App::new()
            .service(create_user)
            .service(get_user)
            .service(update_user)
            .service(login)
            .service(read_headers)
            .service(text_response)
            .service(html_response)
            .service(redirect_response)
    })
    .bind(("127.0.0.1", 8082))?
    .run()
    .await
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// JSON 처리:
//   요청: web::Json<T>  (T: Deserialize)
//   응답: HttpResponse::Ok().json(data)  (data: Serialize)
//   빠른 JSON: serde_json::json!({ "key": "value" })
//
// 폼 데이터:
//   web::Form<T>  (T: Deserialize)
//   Content-Type: application/x-www-form-urlencoded
//
// 헤더:
//   읽기: req.headers().get("HeaderName")
//   쓰기: HttpResponse::Ok().insert_header(("Name", "Value"))
//
// 유용한 serde 파생 매크로:
//   #[derive(Serialize)]    = Rust -> JSON
//   #[derive(Deserialize)]  = JSON -> Rust
//   #[serde(rename = "other_name")]  = 다른 이름으로 직렬화
//   #[serde(skip_serializing_if = "Option::is_none")]  = None이면 필드 생략
//
// 다음 단계: 04_middleware에서 미들웨어를 배웁니다!
// =============================================================================
