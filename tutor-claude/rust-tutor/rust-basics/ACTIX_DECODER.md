# 🔍 actix 코드 해독기 (ACTIX_DECODER)

`actix-web-tutorial`의 **실제 코드**를 가져와서 한 줄씩 해부합니다.
각 줄 옆의 `[chXX]`는 그 문법을 설명하는 챕터입니다. 모르는 표시가 나오면 해당 챕터로 돌아가세요.

> 읽는 법: 코드를 먼저 보고 "이건 무슨 뜻일까?" 스스로 설명해 본 뒤, 아래 해설과 비교해 보세요.

---

## 01_basic — 서버의 뼈대

```rust
use actix_web::{get, post, web, App, HttpRequest, HttpResponse, HttpServer, Responder};
```
- `use` = Java `import`. `{ }`로 여러 개를 한 번에 가져옴 **[ch12]**
- `get`, `post` = 어트리뷰트 매크로 / `web` = 모듈 / `App`, `HttpServer` = 구조체 / `Responder` = 트레이트

```rust
#[get("/hello/{name}")]                                   // [ch12] 어트리뷰트 매크로 = Spring @GetMapping
async fn greet(name: web::Path<String>) -> impl Responder {  // [ch13] async fn, [ch08] impl Trait
    let name = name.into_inner();                         // [ch01] 섀도잉, [ch05] self를 소비하는 메서드
    HttpResponse::Ok().body(format!("안녕하세요, {}님!", name))  // [ch02] ; 없음 → 반환값
}                                                         // [ch05] :: 연관 함수 → . 메서드 체이닝
```
| 조각 | 의미 |
|---|---|
| `web::Path<String>` | URL의 `{name}` 부분을 `String`으로 꺼내 담은 **포장지** 타입. 제네릭 **[ch08]** |
| `-> impl Responder` | "HTTP 응답으로 바뀔 수 있는 무언가를 돌려준다" **[ch08 §3, §7]** |
| `name.into_inner()` | 포장을 뜯어 `String`을 꺼냄. `into_`는 자기를 소비(move)하는 메서드 관례 **[ch03 §5]** |
| 마지막 줄에 `;` 없음 | 그 값이 함수의 반환값 **[ch02 §2]** |

```rust
let user_agent = req
    .headers()
    .get("User-Agent")                  // Option<&HeaderValue>  — 헤더가 없을 수 있음   [ch06]
    .and_then(|v| v.to_str().ok())      // 클로저 [ch09]. 문자열 변환 실패도 None으로   [ch06 §4, ch07 §6]
    .unwrap_or("Unknown");              // None이면 기본값                              [ch06 §4]
```
Java로 쓰면 `Optional.ofNullable(headers.get("User-Agent")).flatMap(v -> toStr(v)).orElse("Unknown")`

```rust
#[actix_web::main]                              // [ch12, ch13] async main을 런타임 위에서 실행
async fn main() -> std::io::Result<()> {        // [ch07] Result<(), io::Error>의 별칭
    HttpServer::new(|| {                        // [ch09] 매개변수 없는 클로저 = 워커마다 호출되는 팩토리
        App::new()
            .service(hello)                     // #[get]이 만든 핸들러를 등록
            .route("/manual", web::get().to(manual_hello))
    })
    .bind(("127.0.0.1", 8080))?                 // [ch01] 튜플, [ch07] ? — 포트 사용 중이면 main이 에러로 종료
    .run()
    .await                                      // [ch13] 서버가 끝날 때까지 기다림. ; 없음 → main의 반환값
}
```

---

## 02_routing — 경로와 쿼리

```rust
async fn get_user_post(path: web::Path<(u64, u64)>) -> impl Responder {
    let (user_id, post_id) = path.into_inner();     // [ch01 §4] 튜플 구조 분해
```
- `/users/{user_id}/posts/{post_id}`의 두 값을 `(u64, u64)` 튜플로 받음. 숫자가 아니면 actix가 자동으로 404/400 응답

```rust
#[derive(Deserialize)]                  // [ch12 §5] 쿼리 스트링 → 구조체 자동 변환
struct SearchQuery {
    keyword: String,                    // 필수 파라미터: 없으면 400
    page: Option<u32>,                  // [ch06 §3] 선택 파라미터: 없으면 None
}

let page = query.page.unwrap_or(1);     // [ch06 §4] None이면 1
```

```rust
.service(
    web::scope("/api/v1")               // 공통 접두사 그룹 (Spring의 클래스 레벨 @RequestMapping)
        .route("/health", web::get().to(api_health))
)
.route("/{tail:.*}", web::get().to(not_found))   // 나머지 전부 → 404 (등록 순서 중요)
```

---

## 03_request_response — JSON

```rust
#[derive(Serialize)]                    // [ch12 §5] 구조체 → JSON
struct ApiResponse<T: Serialize> {      // [ch08 §2] 제네릭 + 트레이트 바운드: T도 JSON으로 바뀔 수 있어야 함
    success: bool,
    data: Option<T>,                    // [ch06] 실패 시 None → JSON에서 null
    message: String,
}

impl<T: Serialize> ApiResponse<T> {     // [ch08] "Serialize 가능한 모든 T에 대해"
    fn ok(data: T, message: &str) -> Self {   // [ch04 §5] 인자는 &str, [ch05] Self = ApiResponse<T>
        ApiResponse { success: true, data: Some(data), message: message.to_string() }
    }
}

HttpResponse::NotFound().json(ApiResponse::<()>::error("사용자를 찾을 수 없습니다"))
//                                      ^^^^^^ [ch08 §6] 터보피시: T를 ()(데이터 없음)로 지정
```

```rust
async fn create_user(body: web::Json<CreateUserRequest>) -> impl Responder {
```
- `web::Json<T>`: 요청 body JSON을 `T`로 역직렬화해서 넘겨줌. 형식이 틀리면 **핸들러가 호출되기도 전에** 400 응답
- `body.name`처럼 포장을 안 뜯고 접근 가능 → `Deref` 덕분 **[ch08 §7 미니 actix]**

```rust
name: update.name.unwrap_or_else(|| "기존이름".to_string()),   // [ch06 §4] 필요할 때만 기본값 생성
```

---

## 04_middleware — 미들웨어

```rust
let user = extensions.get::<AuthenticatedUser>();   // [ch08 §6] 터보피시: "이 타입의 값을 꺼내줘"
```

```rust
.wrap_fn(|req, next| {                                   // [ch09] 매개변수 2개 클로저
    let auth_header = req.headers().get("Authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_string();                                    // [ch04] &str → String (요청보다 오래 써야 하니 소유)

    if let Some(token) = auth_header.strip_prefix("Bearer ") {   // [ch06 §5] if let, [ch04 §5] strip_prefix → Option<&str>
        if let Some(user) = validate_token(token) {
            req.extensions_mut().insert(user);           // 요청에 사용자 정보 저장 (Spring의 request attribute)
        }
    }

    let fut = next.call(req);                            // [ch13 §8] 다음 단계를 실행할 Future를 "만들기만" 함
    async move {                                         // [ch13] 클로저 안에서 await하려고 async 블록을 반환
        let res = fut.await?;                            // [ch13] 핸들러 실행 대기, [ch07] 에러면 전파
        Ok(res)                                          // 여기서 응답 후처리 가능
    }
})
```
➡️ ch13 §8의 `logging_middleware`가 이 구조를 그대로 흉내 낸 코드입니다.

---

## 05_state — 공유 상태 ⭐

```rust
#[derive(Serialize, Deserialize, Clone, Debug)]   // [ch08 §5] 자동 구현
struct Todo { id: u64, title: String, completed: bool }

struct AppState {
    todos: Mutex<HashMap<u64, Todo>>,   // [ch11] 여러 스레드가 수정 → Mutex로 감쌈
    next_id: Mutex<u64>,
    app_name: String,                   // 읽기만 함 → Mutex 불필요
}
```

```rust
async fn list_todos(state: web::Data<AppState>) -> impl Responder {   // web::Data<T> = Arc<T>  [ch11]
    let todos = state.todos.lock().unwrap();       // [ch11] 잠금 획득 → MutexGuard. [ch04 §4] 자동 역참조로 state.todos 접근
    let todo_list: Vec<&Todo> = todos.values().collect();   // [ch10] 값들을 빌려서 Vec으로 [ch09]
    HttpResponse::Ok().json(serde_json::json!({ "count": todo_list.len(), "todos": todo_list }))  // [ch12] json!
}                                                  // [ch03 §6] todos(가드) drop → 잠금 자동 해제
```

```rust
async fn get_todo(state: web::Data<AppState>, path: web::Path<u64>) -> impl Responder {
    let id = path.into_inner();
    let todos = state.todos.lock().unwrap();
    match todos.get(&id) {                         // [ch04 §1] 키는 빌려서(&) 넘김, [ch10] → Option<&Todo>
        Some(todo) => HttpResponse::Ok().json(todo),           // [ch06] match + Option
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Todo {} 를 찾을 수 없습니다", id)
        })),
    }                                              // match 전체가 표현식 → 반환값 [ch02]
}
```

```rust
let id = {                                         // [ch02 §3] 블록 표현식
    let mut next_id = state.next_id.lock().unwrap();
    let id = *next_id;                             // [ch04 §4] 역참조로 값 복사 (u64는 Copy [ch03 §3])
    *next_id += 1;                                 // [ch04 §4] 가드가 가리키는 값을 수정
    id                                             // 블록의 값
};                                                 // ← next_id 잠금 해제! 잠금 범위를 최소화하는 관용구

let todo = Todo { id, title: body.into_inner().title, completed: false };   // [ch05 §1] 필드 축약
let mut todos = state.todos.lock().unwrap();
todos.insert(id, todo.clone());                    // [ch03 §2] insert는 소유권을 가져가므로 복제본을 넣고
HttpResponse::Created().json(todo)                 //           원본은 응답에 사용
```

```rust
match todos.get_mut(&id) {                         // [ch04 §2] 수정용 빌림 → Option<&mut Todo>
    Some(todo) => {
        if let Some(title) = update.title {        // [ch06 §5] 요청에 title이 있을 때만
            todo.title = title;                    //           HashMap 안의 값을 직접 수정
        }
        HttpResponse::Ok().json(todo.clone())
    }
    None => HttpResponse::NotFound().json(...),
}
```

```rust
let state = web::Data::new(AppState::new());       // Arc::new(...)와 같음 [ch11]

HttpServer::new(move || {                          // [ch09 §4] move: state의 소유권을 클로저로
    App::new()
        .app_data(state.clone())                   // [ch09 §4] 클로저가 워커마다 호출되므로 매번 clone
        .service(get_info)                         //           Arc clone = 참조 카운트 +1 (싸다) [ch03 §4, ch11 §2]
})
```
➡️ ch11 §5 `actix_state_simulation`과 연습문제 ex03의 `TodoStore`가 이 코드를 그대로 재현합니다.

---

## 06_database — 비동기 DB

```rust
#[derive(Debug, Serialize, FromRow, Clone)]   // FromRow: DB 행 → 구조체 (JPA 엔티티 매핑과 비슷)
struct Todo { id: i64, ... }                  // SQLite INTEGER는 i64
```

```rust
async fn init_database(pool: &SqlitePool) -> Result<(), sqlx::Error> {   // [ch04] 풀을 빌려서 사용, [ch07] 성공 시 값 없음
    sqlx::query(r#"CREATE TABLE IF NOT EXISTS ..."#)   // [ch12] r#"..."# raw 문자열 (Java 텍스트 블록)
        .execute(pool)
        .await?;                                       // [ch13] 쿼리 완료 대기 + [ch07] 실패하면 즉시 반환
    Ok(())
}
```

```rust
match sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = ?")   // [ch08 §6] 터보피시: 결과를 Todo로. _ = 추론
    .bind(id)                                                        // PreparedStatement.setLong
    .fetch_optional(pool.get_ref())                                  // 0~1행 → Option<Todo>. get_ref: Data<T> → &T
    .await
{
    Ok(Some(todo)) => HttpResponse::Ok().json(todo),     // [ch06 §6] 중첩 패턴: Result 안의 Option
    Ok(None) => HttpResponse::NotFound().json(...),      // 쿼리 성공 + 결과 없음
    Err(e) => HttpResponse::InternalServerError()...,    // 쿼리 실패
}
```
- `Result<Option<Todo>, sqlx::Error>` 하나로 "성공/없음/DB 에러" 세 가지 경우를 표현 → `match`가 전부 처리하도록 강제

```rust
let pool = SqlitePool::connect(database_url)
    .await
    .expect("데이터베이스 연결 실패");                   // [ch07 §2] 시작 시 실패하면 그냥 종료(panic)해도 OK
```

---

## 07_error_handling — 커스텀 에러 ⭐

```rust
#[derive(Debug, Error)]                       // thiserror: std::error::Error 자동 구현 [ch07 §4]
pub enum AppError {                           // [ch06 §2] 데이터를 가진 enum
    #[error("{0}을(를) 찾을 수 없습니다")]       // Display 자동 구현. {0} = 첫 번째 필드
    NotFound(String),
    #[error("잘못된 요청: {message}")]
    BadRequest { message: String },
    #[error("IO 오류: {0}")]
    IoError(#[from] std::io::Error),          // impl From<io::Error> for AppError 자동 생성 → ? 자동 변환 [ch07 §4]
}
```
➡️ ch07 §4에서 thiserror 없이 `Display`, `Error`, `From`을 손으로 구현해 봤습니다. 매크로가 그 코드를 대신 생성합니다.

```rust
impl ResponseError for AppError {             // [ch08] actix의 트레이트 구현: "에러 → HTTP 응답" 변환법
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::NotFound(_) => HttpResponse::NotFound().json(error_body),      // [ch06 §2] _ 무시
            AppError::BadRequest { .. } => HttpResponse::BadRequest().json(error_body),   // { .. } 필드 무시
            AppError::InternalError(_) | AppError::IoError(_) => ...,             // | 여러 패턴
        }
    }
}
```

```rust
fn error_type_str(&self) -> &'static str { ... }   // [ch04 §6] 리터럴만 반환 → 'static
```

```rust
#[get("/users/{id}")]
async fn get_user(path: web::Path<u64>) -> Result<impl Responder, AppError> {   // [ch07] 성공=Responder, 실패=AppError
    let user = find_user_by_id(path.into_inner())?;   // Err면 즉시 반환 → actix가 ResponseError로 404 응답 생성
    Ok(HttpResponse::Ok().json(user))
}

let content = std::fs::read_to_string("nonexistent.txt")?;   // io::Error → (From) → AppError::IoError 자동 변환
```

---

## 08_advanced — WebSocket, SSE ⭐

```rust
async fn ws_echo(req: HttpRequest, body: web::Payload) -> Result<HttpResponse, actix_web::Error> {
    let (response, mut session, mut msg_stream) = actix_ws::handle(&req, body)?;
    //  [ch01 §4] 튜플 3개 분해. session과 msg_stream은 수정해야 하니 mut   [ch07] 업그레이드 실패 시 전파

    actix_web::rt::spawn(async move {                 // [ch13 §5] 백그라운드 태스크 + session/msg_stream 소유권 이동
        let _ = session.text("연결 성공!").await;      // [ch07 §6] let _ = : 전송 결과(Result) 의도적으로 무시

        while let Some(msg) = msg_stream.next().await {   // [ch06 §5] 다음 메시지가 있는 동안 반복. 끊기면 None
            match msg {
                Ok(Message::Text(text)) => {           // [ch06 §6] 중첩 패턴: Result 안의 enum 안의 값
                    if session.text(format!("에코: {}", text)).await.is_err() {
                        break;                         // 전송 실패 = 연결 끊김 → 루프 종료
                    }
                }
                Ok(Message::Ping(ping)) => { let _ = session.pong(&ping).await; }
                Ok(Message::Close(reason)) => break,
                _ => {}                                // 나머지는 무시 ({} = 아무것도 안 함)
            }
        }
    });

    Ok(response)                                      // spawn하고 업그레이드 응답은 바로 반환
}
```

```rust
let (tx, rx) = tokio::sync::mpsc::channel::<Result<web::Bytes, actix_web::Error>>(10);
//  [ch13 §7] 채널 생성. 터보피시로 메시지 타입 지정 [ch08 §6]

actix_web::rt::spawn(async move {                     // tx를 태스크로 이동
    for i in 1..=10 {                                 // [ch02 §5] 1 이상 10 이하
        if tx.send(Ok(web::Bytes::from(format!("data: 카운터 {}\n\n", i)))).await.is_err() {
            break;                                    // 받는 쪽(클라이언트)이 사라지면 종료
        }
        sleep(Duration::from_secs(1)).await;          // [ch13 §9] tokio의 비동기 sleep (스레드를 막지 않음)
    }
});

let stream = tokio_stream::wrappers::ReceiverStream::new(rx);   // 채널의 rx → HTTP 스트림
HttpResponse::Ok().content_type("text/event-stream").streaming(stream)
```

```rust
let (chat_tx, _) = broadcast::channel::<ChatMessage>(100);   // [ch13 §7-2] Pub/Sub. _ = 첫 수신기는 버림
let mut rx = tx.subscribe();                                  // 접속자마다 구독
while let Ok(msg) = rx.recv().await { ... }                   // [ch06 §5] Result에도 while let
```

---

## ✅ 셀프 체크

아래 질문에 답할 수 있으면 actix 코드를 "읽을 수 있는" 상태입니다.

1. `HttpServer::new(move || App::new().app_data(state.clone()))`에서 `move`와 `clone()`을 각각 빼면 왜 컴파일이 안 될까요? → ch09 §4
2. `let id = { ... };` 블록을 쓰지 않고 `next_id` 잠금을 함수 끝까지 잡고 있으면 무엇이 나빠질까요? → ch02 §3, ch11 §5
3. 핸들러가 `-> impl Responder`일 때 한쪽 분기에서는 `HttpResponse`, 다른 쪽에서는 `"문자열"`을 반환하면 왜 에러일까요? → ch08 §3
4. `find_user_by_id(id)?`가 실패했을 때 클라이언트가 404 JSON을 받게 되기까지 어떤 일이 일어날까요? → ch07 §4, 07_error_handling의 `ResponseError`
5. `todos.insert(id, todo.clone())`에서 `clone()`을 빼면? → ch03 §2
6. WebSocket 핸들러는 왜 `spawn`으로 메시지 루프를 따로 돌리고 응답부터 반환할까요? → ch13 §5
