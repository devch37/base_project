// =============================================================================
// 챕터 01: Actix Web 기초 - Hello World & 기본 라우팅
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. Actix Web 서버를 시작하는 방법
// 2. 핸들러(Handler) 함수 작성법
// 3. 기본적인 라우팅 설정
// 4. HttpResponse로 응답 만들기
//
// 핵심 개념:
// - #[actix_web::main]: Actix의 비동기 런타임을 설정하는 매크로
// - HttpServer: TCP 연결을 받아 HTTP 요청을 처리하는 서버
// - App: 라우팅, 미들웨어, 상태를 관리하는 애플리케이션 인스턴스
// - Handler: HTTP 요청을 받아 응답을 반환하는 async 함수
// =============================================================================

// actix_web에서 필요한 타입들을 가져옵니다
use actix_web::{get, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder};

// =============================================================================
// 핸들러(Handler) 함수들
// =============================================================================

// #[get("/")] 매크로: GET /  요청이 들어오면 이 함수를 실행합니다
// async fn: Actix Web은 비동기 기반이므로 핸들러는 async 함수여야 합니다
// impl Responder: HTTP 응답으로 변환될 수 있는 모든 타입을 반환할 수 있습니다
#[get("/")]
async fn hello() -> impl Responder {
    // HttpResponse::Ok() = HTTP 200 상태 코드
    // .body("...") = 응답 본문 설정
    HttpResponse::Ok().body("안녕하세요! Actix Web 튜토리얼에 오신 것을 환영합니다!")
}

// GET /hello/{name} 처럼 경로 파라미터가 있는 핸들러
// web::Path<String>: URL 경로에서 {name} 부분을 추출합니다
#[get("/hello/{name}")]
async fn greet(name: web::Path<String>) -> impl Responder {
    // web::Path는 스마트 포인터처럼 동작합니다
    // .into_inner()로 내부 값(String)을 꺼냅니다
    let name = name.into_inner();
    HttpResponse::Ok().body(format!("안녕하세요, {}님!", name))
}

// POST /echo 핸들러
// POST 요청의 body를 그대로 반환합니다
#[post("/echo")]
async fn echo(body: web::Bytes) -> impl Responder {
    // web::Bytes: HTTP 요청 본문을 원시 바이트로 받습니다
    // 받은 바이트를 그대로 응답으로 반환합니다 (echo!)
    HttpResponse::Ok().body(body)
}

// HttpRequest 객체 전체를 받는 핸들러
// 요청의 모든 정보(헤더, 메서드, URI 등)에 접근할 수 있습니다
#[get("/request-info")]
async fn request_info(req: HttpRequest) -> impl Responder {
    // HttpRequest에서 다양한 정보를 추출합니다
    let method = req.method().as_str();      // HTTP 메서드 (GET, POST 등)
    let path = req.path();                    // 요청 경로 (/request-info)
    let user_agent = req
        .headers()
        .get("User-Agent")
        .and_then(|v| v.to_str().ok())        // 헤더 값을 &str로 변환
        .unwrap_or("Unknown");                 // 없으면 기본값

    let info = format!(
        "메서드: {}\n경로: {}\nUser-Agent: {}",
        method, path, user_agent
    );

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")  // 한국어를 위해 UTF-8 명시
        .body(info)
}

// 일반 함수도 핸들러로 사용할 수 있습니다 (매크로 없이)
// 이 방식은 App::route()에서 직접 등록할 때 사용합니다
async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("매크로 없이 등록된 핸들러입니다!")
}

// =============================================================================
// 메인 함수
// =============================================================================

// #[actix_web::main]: 일반 main 함수를 비동기 main으로 변환합니다
// 내부적으로 tokio 런타임을 설정합니다
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 서버 시작 메시지 출력
    println!("서버 시작: http://127.0.0.1:8080");
    println!("다음 엔드포인트를 사용해보세요:");
    println!("  GET  http://127.0.0.1:8080/");
    println!("  GET  http://127.0.0.1:8080/hello/이름");
    println!("  POST http://127.0.0.1:8080/echo");
    println!("  GET  http://127.0.0.1:8080/request-info");
    println!("  GET  http://127.0.0.1:8080/manual");

    // HttpServer::new(): 새 HTTP 서버를 만듭니다
    // 클로저(|| {})는 각 워커 스레드마다 호출됩니다
    HttpServer::new(|| {
        // App::new(): 새 애플리케이션 인스턴스를 만듭니다
        App::new()
            // .service(): 매크로(#[get], #[post] 등)로 만든 핸들러를 등록합니다
            .service(hello)
            .service(greet)
            .service(echo)
            .service(request_info)
            // .route(): 매크로 없이 수동으로 라우트를 등록합니다
            // web::get(): GET 메서드 가드를 만듭니다
            .route("/manual", web::get().to(manual_hello))
    })
    // .bind(): 서버가 수신할 주소와 포트를 설정합니다
    .bind(("127.0.0.1", 8080))?  // ? 연산자: 에러가 있으면 즉시 반환
    // .run(): 서버를 시작합니다 (비동기적으로 실행)
    .run()
    .await  // 서버가 종료될 때까지 대기
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// 1. Actix Web의 기본 구조:
//    HttpServer::new(|| App::new().service(...)).bind(...).run().await
//
// 2. 핸들러 등록 두 가지 방법:
//    a. 매크로 사용: #[get("/path")] fn handler() -> impl Responder
//    b. 수동 등록: .route("/path", web::get().to(handler))
//
// 3. 응답 만들기:
//    - HttpResponse::Ok()           = 200 OK
//    - HttpResponse::NotFound()     = 404 Not Found
//    - HttpResponse::BadRequest()   = 400 Bad Request
//    - HttpResponse::InternalServerError() = 500
//
// 다음 단계: 02_routing에서 더 복잡한 라우팅 패턴을 배웁니다!
// =============================================================================
