// =============================================================================
// 챕터 02: 라우팅 심화 - 경로 파라미터, 쿼리 스트링, HTTP 메서드
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. 경로 파라미터(Path Parameters) 추출
// 2. 쿼리 스트링(Query String) 파싱
// 3. 여러 HTTP 메서드 처리 (GET, POST, PUT, DELETE, PATCH)
// 4. 라우트 그룹화 (scope)
// 5. 와일드카드 경로
//
// =============================================================================

use actix_web::{delete, get, patch, post, put, web, App, HttpResponse, HttpServer, Responder};
use serde::Deserialize;

// =============================================================================
// 경로 파라미터 (Path Parameters)
// URL: /users/42 에서 42를 추출하는 방법
// =============================================================================

// 단일 경로 파라미터: {id}
#[get("/users/{id}")]
async fn get_user(path: web::Path<u64>) -> impl Responder {
    // web::Path<u64>: URL의 {id} 부분을 u64 타입으로 자동 파싱합니다
    let id = path.into_inner();
    HttpResponse::Ok().body(format!("사용자 ID {} 조회", id))
}

// 여러 경로 파라미터: 튜플로 추출합니다
// URL: /users/1/posts/5
#[get("/users/{user_id}/posts/{post_id}")]
async fn get_user_post(path: web::Path<(u64, u64)>) -> impl Responder {
    // 튜플 디스트럭처링으로 각 파라미터를 분리합니다
    let (user_id, post_id) = path.into_inner();
    HttpResponse::Ok().body(format!("사용자 {} 의 게시글 {} 조회", user_id, post_id))
}

// 구조체를 사용한 경로 파라미터 추출 (더 명확한 방법)
// serde::Deserialize를 구현해야 합니다
#[derive(Deserialize)]
struct ArticlePath {
    category: String,
    article_id: u64,
}

#[get("/articles/{category}/{article_id}")]
async fn get_article(path: web::Path<ArticlePath>) -> impl Responder {
    // 구조체 필드로 접근할 수 있어 코드가 더 명확합니다
    let path = path.into_inner();
    HttpResponse::Ok().body(format!(
        "카테고리: {}, 글 ID: {}",
        path.category, path.article_id
    ))
}

// =============================================================================
// 쿼리 스트링 (Query String)
// URL: /search?keyword=rust&page=2&per_page=10
// =============================================================================

// 쿼리 파라미터를 담는 구조체
// serde::Deserialize 필수!
#[derive(Deserialize)]
struct SearchQuery {
    keyword: String,
    // Option<T>: 선택적 파라미터 (없어도 됩니다)
    page: Option<u32>,
    per_page: Option<u32>,
}

#[get("/search")]
async fn search(query: web::Query<SearchQuery>) -> impl Responder {
    // web::Query<T>: ?key=value 형식의 쿼리 스트링을 T 타입으로 파싱합니다
    let query = query.into_inner();

    // Option 타입의 기본값 처리
    let page = query.page.unwrap_or(1);           // 없으면 1페이지
    let per_page = query.per_page.unwrap_or(20);  // 없으면 20개

    HttpResponse::Ok().body(format!(
        "검색어: {}\n페이지: {}\n페이지당 항목: {}",
        query.keyword, page, per_page
    ))
}

// =============================================================================
// HTTP 메서드 (RESTful API 패턴)
// =============================================================================

// GET: 데이터 조회 (Read)
#[get("/products")]
async fn list_products() -> impl Responder {
    HttpResponse::Ok().body("모든 상품 목록")
}

// POST: 데이터 생성 (Create)
#[post("/products")]
async fn create_product() -> impl Responder {
    // 실제로는 요청 body에서 데이터를 파싱합니다 (챕터 03에서 다룹니다)
    HttpResponse::Created().body("새 상품 생성됨")  // 201 Created
}

// PUT: 데이터 전체 수정 (Update - 전체 교체)
#[put("/products/{id}")]
async fn update_product(path: web::Path<u64>) -> impl Responder {
    let id = path.into_inner();
    HttpResponse::Ok().body(format!("상품 {} 전체 수정됨", id))
}

// PATCH: 데이터 부분 수정 (Update - 일부 변경)
#[patch("/products/{id}")]
async fn patch_product(path: web::Path<u64>) -> impl Responder {
    let id = path.into_inner();
    HttpResponse::Ok().body(format!("상품 {} 부분 수정됨", id))
}

// DELETE: 데이터 삭제 (Delete)
#[delete("/products/{id}")]
async fn delete_product(path: web::Path<u64>) -> impl Responder {
    let id = path.into_inner();
    // 204 No Content: 성공했지만 반환할 본문이 없을 때 사용합니다
    HttpResponse::NoContent().finish()
}

// =============================================================================
// 라우트 그룹화 (Scope)
// /api/v1/* 처럼 공통 접두사를 가진 라우트를 묶을 때 사용합니다
// =============================================================================

// scope 안에서 사용할 핸들러들
async fn api_health() -> impl Responder {
    HttpResponse::Ok().body("API v1 정상 동작 중")
}

async fn api_version() -> impl Responder {
    HttpResponse::Ok().body("API 버전: 1.0.0")
}

// =============================================================================
// 와일드카드 & 커스텀 404
// =============================================================================

// "{tail:.*}": 어떤 경로든 매칭됩니다 (반드시 마지막에 등록!)
async fn not_found() -> impl Responder {
    HttpResponse::NotFound().body("404: 페이지를 찾을 수 없습니다")
}

// =============================================================================
// 메인 함수
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("서버 시작: http://127.0.0.1:8081");
    println!();
    println!("=== 경로 파라미터 테스트 ===");
    println!("  GET http://127.0.0.1:8081/users/42");
    println!("  GET http://127.0.0.1:8081/users/1/posts/5");
    println!("  GET http://127.0.0.1:8081/articles/tech/100");
    println!();
    println!("=== 쿼리 스트링 테스트 ===");
    println!("  GET http://127.0.0.1:8081/search?keyword=rust&page=2");
    println!();
    println!("=== RESTful API 테스트 ===");
    println!("  GET    http://127.0.0.1:8081/products");
    println!("  POST   http://127.0.0.1:8081/products");
    println!("  PUT    http://127.0.0.1:8081/products/1");
    println!("  PATCH  http://127.0.0.1:8081/products/1");
    println!("  DELETE http://127.0.0.1:8081/products/1");
    println!();
    println!("=== Scope 테스트 ===");
    println!("  GET http://127.0.0.1:8081/api/v1/health");
    println!("  GET http://127.0.0.1:8081/api/v1/version");

    HttpServer::new(|| {
        App::new()
            // 경로 파라미터 라우트들
            .service(get_user)
            .service(get_user_post)
            .service(get_article)
            // 쿼리 스트링 라우트
            .service(search)
            // RESTful API 라우트들
            .service(list_products)
            .service(create_product)
            .service(update_product)
            .service(patch_product)
            .service(delete_product)
            // web::scope(): 공통 접두사(/api/v1)를 가진 라우트 그룹
            .service(
                web::scope("/api/v1")
                    .route("/health", web::get().to(api_health))
                    .route("/version", web::get().to(api_version))
            )
            // 와일드카드는 반드시 마지막에 등록해야 합니다!
            // 먼저 등록된 라우트가 먼저 매칭되기 때문입니다
            .route("/{tail:.*}", web::get().to(not_found))
    })
    .bind(("127.0.0.1", 8081))?
    .run()
    .await
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// 경로 파라미터:
//   /path/{param}        -> web::Path<Type>
//   /path/{a}/{b}        -> web::Path<(TypeA, TypeB)>
//   /path/{a}/{b}        -> web::Path<MyStruct>  (Deserialize 필요)
//
// 쿼리 스트링:
//   ?key=val             -> web::Query<MyStruct>  (Deserialize 필요)
//   Option<T> 필드 = 선택적 파라미터
//
// HTTP 메서드:
//   #[get]    = 조회    (Read)
//   #[post]   = 생성    (Create)
//   #[put]    = 전체수정 (Update)
//   #[patch]  = 부분수정 (Partial Update)
//   #[delete] = 삭제    (Delete)
//
// 라우트 그룹:
//   web::scope("/prefix").route(...)
//
// 다음 단계: 03_request_response에서 JSON 처리를 배웁니다!
// =============================================================================
