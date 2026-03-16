// =============================================================================
// 챕터 04: 미들웨어 - 로깅, 인증, 요청/응답 가공
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. 미들웨어란 무엇인가
// 2. Actix Web 내장 미들웨어 (Logger)
// 3. 커스텀 미들웨어 작성 (간단한 방법: wrap_fn)
// 4. 인증 미들웨어 패턴
// 5. 미들웨어 체이닝
//
// 미들웨어란?
// 요청이 핸들러에 도달하기 전/후에 실행되는 코드입니다.
// 요청 -> [미들웨어1] -> [미들웨어2] -> [핸들러] -> [미들웨어2] -> [미들웨어1] -> 응답
// 마치 양파 껍질처럼 겹겹이 쌓입니다.
//
// =============================================================================

use actix_web::{
    get,
    middleware::Logger,
    web, App, HttpMessage, HttpRequest, HttpResponse, HttpServer, Responder,
};
use serde_json::json;

// =============================================================================
// 방법 1: wrap_fn을 사용한 간단한 미들웨어 (클로저 방식)
// 복잡한 미들웨어 트레이트를 구현하지 않아도 됩니다
// =============================================================================

// 요청 시간을 측정하는 미들웨어를 wrap_fn으로 구현합니다
// 실제로는 아래 함수를 App::wrap_fn()에 전달합니다

// =============================================================================
// 방법 2: 커스텀 인증 미들웨어
// Authorization: Bearer <token> 헤더를 검증합니다
// =============================================================================

// 인증 정보를 요청에 첨부하기 위한 구조체
// req.extensions_mut()에 저장되어 핸들러에서 꺼내 쓸 수 있습니다
#[derive(Clone)]
struct AuthenticatedUser {
    user_id: u64,
    username: String,
}

// 토큰을 검증하고 사용자 정보를 반환하는 함수 (실제로는 JWT 검증)
fn validate_token(token: &str) -> Option<AuthenticatedUser> {
    // 시뮬레이션: "valid-token"만 유효합니다
    if token == "valid-token" {
        Some(AuthenticatedUser {
            user_id: 1,
            username: "홍길동".to_string(),
        })
    } else {
        None
    }
}

// =============================================================================
// 핸들러 함수들
// =============================================================================

// 인증이 필요 없는 공개 엔드포인트
#[get("/public")]
async fn public_endpoint() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "message": "이 엔드포인트는 누구나 접근할 수 있습니다",
        "authenticated": false
    }))
}

// 인증이 필요한 보호된 엔드포인트
// Authorization: Bearer valid-token 헤더가 필요합니다
#[get("/protected")]
async fn protected_endpoint(req: HttpRequest) -> impl Responder {
    // req.extensions()에서 미들웨어가 저장한 인증 정보를 꺼냅니다
    let extensions = req.extensions();
    let user = extensions.get::<AuthenticatedUser>();

    match user {
        Some(user) => HttpResponse::Ok().json(json!({
            "message": "인증된 사용자만 볼 수 있는 데이터입니다",
            "user_id": user.user_id,
            "username": user.username
        })),
        None => HttpResponse::Unauthorized().json(json!({
            "error": "인증 정보가 없습니다"
        })),
    }
}

// 로깅 테스트용 엔드포인트
#[get("/log-test")]
async fn log_test() -> impl Responder {
    // tracing 매크로로 구조화된 로그를 출력합니다
    tracing::info!("log-test 엔드포인트 호출됨");
    tracing::debug!("디버그 레벨 로그");
    tracing::warn!("경고 레벨 로그");

    HttpResponse::Ok().json(json!({
        "message": "로그를 터미널에서 확인해보세요!"
    }))
}

// =============================================================================
// 메인 함수 - 미들웨어 설정
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // tracing-subscriber 초기화: 로그를 터미널에 출력합니다
    // RUST_LOG 환경변수로 로그 레벨을 제어할 수 있습니다
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)  // DEBUG 이상 로그 출력
        .init();

    tracing::info!("서버 시작: http://127.0.0.1:8083");

    println!();
    println!("=== 미들웨어 테스트 ===");
    println!("# 공개 엔드포인트:");
    println!("curl http://127.0.0.1:8083/public");
    println!();
    println!("# 인증 없이 보호된 엔드포인트 (실패해야 함):");
    println!("curl http://127.0.0.1:8083/protected");
    println!();
    println!("# 올바른 토큰으로 보호된 엔드포인트 (성공):");
    println!("curl -H 'Authorization: Bearer valid-token' http://127.0.0.1:8083/protected");
    println!();
    println!("# 잘못된 토큰 (실패):");
    println!("curl -H 'Authorization: Bearer wrong-token' http://127.0.0.1:8083/protected");

    HttpServer::new(|| {
        App::new()
            // =================================================================
            // 미들웨어 1: Logger - 요청/응답 자동 로깅
            // Logger::default(): 기본 Apache Combined 로그 포맷
            // Logger::new("%a %r %s %b %T"): 커스텀 포맷
            // =================================================================
            .wrap(Logger::default())

            // =================================================================
            // 미들웨어 2: wrap_fn - 클로저로 간단한 미들웨어 작성
            // 인증 미들웨어: Authorization 헤더를 검사하고 user 정보를 추가합니다
            // =================================================================
            .wrap_fn(|req, next| {
                // 요청에서 Authorization 헤더를 읽습니다
                let auth_header = req
                    .headers()
                    .get("Authorization")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("")
                    .to_string();

                // "Bearer <token>" 형식에서 토큰 부분만 추출합니다
                if let Some(token) = auth_header.strip_prefix("Bearer ") {
                    // 토큰 검증
                    if let Some(user) = validate_token(token) {
                        // 검증 성공: 요청 확장 데이터에 사용자 정보를 저장합니다
                        // 핸들러에서 req.extensions().get::<AuthenticatedUser>()로 꺼낼 수 있습니다
                        req.extensions_mut().insert(user);
                        tracing::debug!("토큰 검증 성공");
                    } else {
                        tracing::warn!("유효하지 않은 토큰: {}", auth_header);
                    }
                }

                // next.call(req): 다음 미들웨어 또는 핸들러로 요청을 전달합니다
                // 미들웨어는 여기서 요청을 차단하거나 통과시킬 수 있습니다
                let fut = next.call(req);
                async move {
                    let res = fut.await?;
                    // 여기서 응답을 가공할 수 있습니다 (응답 헤더 추가 등)
                    Ok(res)
                }
            })

            // 핸들러 등록
            .service(public_endpoint)
            .service(protected_endpoint)
            .service(log_test)
    })
    .bind(("127.0.0.1", 8083))?
    .run()
    .await
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// 미들웨어 등록 방법:
//   App::new().wrap(미들웨어)           = 구조체 미들웨어
//   App::new().wrap_fn(|req, next| {}) = 클로저 미들웨어 (간단)
//
// 미들웨어 실행 순서:
//   등록 순서의 역순으로 요청이 처리됩니다!
//   .wrap(A).wrap(B) -> 요청: B -> A -> 핸들러 -> A -> B -> 응답
//
// 내장 미들웨어:
//   Logger::default()  = 요청 로깅
//   Compress::default() = 응답 압축 (actix-web 내장)
//
// 요청 간 데이터 공유:
//   req.extensions_mut().insert(data)  = 데이터 저장
//   req.extensions().get::<T>()        = 데이터 읽기
//
// 로깅:
//   tracing::info!("메시지")   = INFO 레벨
//   tracing::debug!("메시지")  = DEBUG 레벨
//   tracing::warn!("메시지")   = WARN 레벨
//   tracing::error!("메시지")  = ERROR 레벨
//
// 다음 단계: 05_state에서 앱 상태 공유를 배웁니다!
// =============================================================================
