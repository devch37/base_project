// =============================================================================
// 챕터 06: 열거형과 패턴 매칭 (Enums, Option, match)
// =============================================================================
// 실행: cargo run --bin ch06_enums_pattern_matching
//
// 이 챕터에서 배울 것
//   1. enum — Java enum 보다 강력: 각 variant 가 "서로 다른 데이터"를 가질 수 있음
//   2. Option<T> — Rust 에는 null 이 없다! "없을 수도 있음"을 타입으로 표현
//   3. match — 모든 경우를 강제로 처리
//   4. if let / while let — 하나의 경우만 관심 있을 때
//   5. 패턴 문법 모음: _, .., |, 범위, 가드(if), 바인딩(@)
//
// 📌 actix 코드 곳곳에 나오는 문법들:
//     match todos.get(&id) { Some(todo) => ..., None => ... }       (05_state)
//     if let Some(title) = update.title { ... }                     (05_state)
//     while let Some(msg) = msg_stream.next().await { ... }         (08_advanced)
//     AppError::BadRequest { .. } => ...                            (07_error_handling)
// =============================================================================

#![allow(dead_code, unused_variables)]

fn main() {
    println!("===== 챕터 06: 열거형과 패턴 매칭 =====\n");

    enum_basics();
    enum_with_data();
    option_basics();
    option_helpers();
    if_let_while_let();
    pattern_syntax();
}

// -----------------------------------------------------------------------------
// 1. enum 기본
// -----------------------------------------------------------------------------
#[derive(Debug, Clone, Copy, PartialEq)] // PartialEq: == 비교 가능하게
enum HttpMethod {
    Get,
    Post,
    Put,
    Delete,
}

// enum 에도 impl 로 메서드를 붙일 수 있습니다.
impl HttpMethod {
    fn is_safe(&self) -> bool {
        // match self: 자기 자신이 어떤 variant 인지에 따라 분기
        match self {
            HttpMethod::Get => true,
            HttpMethod::Post | HttpMethod::Put | HttpMethod::Delete => false,
        }
    }
}

fn enum_basics() {
    println!("--- 1. enum 기본 ---");
    let m = HttpMethod::Get; // 타입명::Variant
    println!("{:?} is_safe = {}", m, m.is_safe());
    println!("Get == Post ? {}\n", HttpMethod::Get == HttpMethod::Post);
}

// -----------------------------------------------------------------------------
// 2. 데이터를 가진 enum — Rust enum 의 진짜 힘
// -----------------------------------------------------------------------------
// Java enum 은 모든 상수가 같은 필드를 가지지만,
// Rust enum 은 variant 마다 다른 모양의 데이터를 담을 수 있습니다.
// (Java 17 의 sealed interface + record 조합과 같은 개념. "합 타입(sum type)"이라고 부릅니다)
#[derive(Debug)]
enum AppError {
    NotFound(String),             // 튜플 형태: 값 1개
    BadRequest { message: String }, // 구조체 형태: 이름 붙은 필드
    Unauthorized,                 // 데이터 없음
    Internal(u16, String),        // 값 여러 개
}
// 📌 actix 07_error_handling 의 AppError 가 정확히 이 모양입니다.

impl AppError {
    fn status_code(&self) -> u16 {
        match self {
            // ( _ ) : 안의 값은 필요 없으니 무시
            AppError::NotFound(_) => 404,
            // { .. } : 구조체 형태 variant 의 필드를 전부 무시
            AppError::BadRequest { .. } => 400,
            AppError::Unauthorized => 401,
            // 값을 꺼내 쓰고 싶으면 변수 이름을 적음 → 바인딩
            AppError::Internal(code, _) => *code,
        }
    }

    fn message(&self) -> String {
        match self {
            AppError::NotFound(what) => format!("{} 을(를) 찾을 수 없음", what),
            AppError::BadRequest { message } => format!("잘못된 요청: {}", message),
            AppError::Unauthorized => "인증 필요".to_string(),
            AppError::Internal(_, msg) => format!("서버 오류: {}", msg),
        }
        // 💡 새로운 variant 를 추가하면? 이 match 들이 전부 컴파일 에러를 냅니다.
        //    "처리 안 한 경우가 있어요!" — 리팩터링 시 빠뜨리는 곳이 없게 해 줌.
        //    Java switch 의 default 에 묻혀서 놓치는 버그가 원천 차단됩니다.
    }
}

fn enum_with_data() {
    println!("--- 2. 데이터를 가진 enum ---");
    let errors = vec![
        AppError::NotFound("사용자 1".to_string()),
        AppError::BadRequest {
            message: "나이가 음수".to_string(),
        },
        AppError::Unauthorized,
        AppError::Internal(503, "DB 연결 실패".to_string()),
    ];
    for e in &errors {
        println!("[{}] {}", e.status_code(), e.message());
    }
    println!();
}

// -----------------------------------------------------------------------------
// 3. Option<T> — null 대신
// -----------------------------------------------------------------------------
// 표준 라이브러리에 이렇게 정의돼 있습니다 (그냥 평범한 enum!):
//
//   enum Option<T> {
//       Some(T),   // 값이 있음
//       None,      // 값이 없음
//   }
//
// Java:  String findName(long id)   ← null 을 반환할 수도, 안 할 수도. 시그니처로 알 수 없음
// Rust:  fn find_name(id: u64) -> Option<String>   ← "없을 수 있음"이 타입에 드러남
//
// Option<String> 을 String 처럼 바로 쓸 수 없고, 반드시 Some/None 을 확인해야
// 안의 값을 꺼낼 수 있습니다 → NullPointerException 이 컴파일 단계에서 사라집니다.
// (Java 의 Optional<T> 와 같은 아이디어인데, Rust 에는 null 자체가 없어서 "강제"됩니다)

fn find_user_name(id: u64) -> Option<String> {
    if id == 1 {
        Some("홍길동".to_string())
    } else {
        None
    }
}

fn option_basics() {
    println!("--- 3. Option<T> ---");

    // match 로 꺼내기 — 가장 기본
    for id in [1, 2] {
        match find_user_name(id) {
            Some(name) => println!("id {} → {}", id, name),
            None => println!("id {} → 없음", id),
        }
    }

    // ❌ 바로 쓰기는 불가
    // let n: String = find_user_name(1);  // expected `String`, found `Option<String>`

    // 📌 actix 05_state:
    //     match todos.get(&id) {                   // HashMap::get → Option<&Todo>
    //         Some(todo) => HttpResponse::Ok().json(todo),
    //         None => HttpResponse::NotFound().json(...),
    //     }
    // 📌 actix 03_request_response:  struct UpdateUserRequest { name: Option<String>, ... }
    //     → JSON 에 "name" 필드가 없거나 null 이면 None 이 됩니다. (PATCH 요청에 딱 맞음)
    println!();
}

// -----------------------------------------------------------------------------
// 4. Option 의 편의 메서드 — match 를 매번 쓰기 귀찮을 때
// -----------------------------------------------------------------------------
fn option_helpers() {
    println!("--- 4. Option 편의 메서드 ---");

    let some: Option<u32> = Some(3);
    let none: Option<u32> = None;

    // unwrap_or(기본값): 없으면 기본값  (Java Optional.orElse)
    // 📌 02_routing:  let page = query.page.unwrap_or(1);
    println!("unwrap_or: {}, {}", some.unwrap_or(1), none.unwrap_or(1));

    // unwrap_or_else(|| ...): 기본값을 "필요할 때만" 계산 (Java orElseGet)
    // 📌 03_request_response:  update.name.unwrap_or_else(|| "기존이름".to_string())
    //   |...| 는 클로저(람다)입니다 → ch09
    let name: Option<String> = None;
    println!("unwrap_or_else: {}", name.unwrap_or_else(|| "익명".to_string()));

    // unwrap(): 있으면 꺼내고, None 이면 panic(프로그램 중단)!
    //   → "절대 None 일 리 없다"고 확신할 때만. 실무 코드에선 가급적 피하기
    // expect("메시지"): unwrap 과 같은데 panic 메시지를 지정
    println!("unwrap: {}", some.unwrap());

    // map: 값이 있으면 변환, 없으면 그대로 None (Java Optional.map)
    let doubled = some.map(|n| n * 2); // Some(6)
    println!("map: {:?}, {:?}", doubled, none.map(|n| n * 2));

    // and_then: 변환 함수 자체가 Option 을 돌려줄 때 (Java Optional.flatMap)
    // 📌 01_basic:
    //     req.headers().get("User-Agent")      // Option<&HeaderValue>
    //        .and_then(|v| v.to_str().ok())    // 문자열 변환도 실패할 수 있음 → Option<&str>
    //        .unwrap_or("Unknown")             // 없으면 기본값 → &str
    let header: Option<&str> = Some("42");
    let parsed: Option<u32> = header.and_then(|s| s.parse().ok());
    println!("and_then: {:?}", parsed);

    // is_some / is_none
    println!("is_some: {}, is_none: {}", some.is_some(), none.is_none());

    // ok_or: Option → Result 로 바꾸기 (None 을 에러로) → ch07 에서 ? 와 함께 자주 씀
    let r: Result<u32, &str> = none.ok_or("값이 없습니다");
    println!("ok_or: {:?}\n", r);
}

// -----------------------------------------------------------------------------
// 5. if let / while let
// -----------------------------------------------------------------------------
fn if_let_while_let() {
    println!("--- 5. if let / while let ---");

    // if let: "이 패턴에 맞으면 실행" — match 에서 한 가지 경우만 관심 있을 때의 축약
    let title: Option<String> = Some("새 제목".to_string());

    // match 로 쓰면:
    match &title {
        Some(t) => println!("(match) 제목 변경: {}", t),
        None => {} // 아무것도 안 함 — 이게 귀찮으니까 if let 을 씀
    }

    // if let 으로 쓰면:
    if let Some(t) = &title {
        println!("(if let) 제목 변경: {}", t);
    }
    // 📌 actix 05_state 의 update_todo:
    //     if let Some(title) = update.title { todo.title = title; }
    //     if let Some(completed) = update.completed { todo.completed = completed; }
    //   → 요청 JSON 에 들어온 필드만 골라서 업데이트

    // else 도 가능
    let missing: Option<i32> = None;
    if let Some(v) = missing {
        println!("{}", v);
    } else {
        println!("(if let ... else) 값 없음");
    }

    // let-else: "패턴에 안 맞으면 즉시 빠져나가라" (Rust 1.65+) — early return 에 유용
    let Some(v) = Some(10) else {
        return; // else 블록은 반드시 빠져나가야 함 (return/break/continue/panic)
    };
    println!("(let-else) v = {}", v);

    // while let: "패턴에 맞는 동안 계속 반복"
    let mut stack = vec![1, 2, 3];
    while let Some(top) = stack.pop() {
        // pop() → Option<i32>. 비면 None → 루프 종료
        print!("{} ", top);
    }
    println!();
    // 📌 actix 08_advanced:
    //     while let Some(msg) = msg_stream.next().await { ... }
    //   → "다음 메시지가 있는 동안 계속 처리, 스트림이 끝나면(None) 루프 종료"
    //     while let Ok(msg) = rx.recv().await { ... }   ← Result 에도 똑같이 쓸 수 있음
    println!();
}

// -----------------------------------------------------------------------------
// 6. 패턴 문법 모음
// -----------------------------------------------------------------------------
enum Message {
    Text(String),
    Binary(Vec<u8>),
    Ping,
    Close(Option<String>),
}

fn pattern_syntax() {
    println!("--- 6. 패턴 문법 모음 ---");

    let n = 15;
    let desc = match n {
        0 => "영",
        1 | 2 | 3 => "작음",                   // | : 여러 패턴 중 하나
        4..=9 => "한 자리",                    // ..= : 범위
        x if x % 2 == 0 => "두 자리 이상 짝수", // if : 매치 가드(추가 조건)
        _ => "두 자리 이상 홀수",               // _ : 나머지 전부
    };
    println!("{} → {}", n, desc);

    // @ 바인딩: 범위 검사하면서 값도 변수로 받기
    let age = 25;
    match age {
        a @ 20..=29 => println!("20대 ({}살)", a),
        _ => println!("기타"),
    }

    // 튜플 매칭
    let point = (0, 7);
    match point {
        (0, 0) => println!("원점"),
        (0, y) => println!("y축 위 (y={})", y),
        (x, 0) => println!("x축 위 (x={})", x),
        _ => println!("그 외"),
    }

    // 중첩 enum 매칭 — 📌 08_advanced 의 WebSocket 메시지 처리와 같은 모양
    //   match msg {
    //       Ok(Message::Text(text)) => ...,     // Result 안의 Message 안의 text
    //       Ok(Message::Close(reason)) => ...,
    //       _ => {}                             // 나머지는 무시 ({} = 아무것도 안 함)
    //   }
    let incoming: Vec<Result<Message, String>> = vec![
        Ok(Message::Text("안녕".to_string())),
        Ok(Message::Binary(vec![1, 2, 3])),
        Ok(Message::Ping),
        Err("연결 끊김".to_string()),
        Ok(Message::Close(Some("bye".to_string()))),
    ];
    for msg in incoming {
        match msg {
            Ok(Message::Text(text)) => println!("텍스트: {}", text),
            Ok(Message::Binary(bin)) => println!("바이너리: {} bytes", bin.len()),
            Ok(Message::Close(reason)) => {
                println!("종료: {:?}", reason);
                break;
            }
            Err(e) => println!("에러: {}", e),
            _ => {} // Ping 등 나머지
        }
    }

    // matches! 매크로: 패턴에 맞는지 bool 로
    let m = HttpMethod::Post;
    println!("쓰기 메서드? {}", matches!(m, HttpMethod::Post | HttpMethod::Put));
}

// =============================================================================
// 📝 정리
// =============================================================================
//   enum E { A, B(i32), C { x: u8 } }   variant 마다 다른 데이터
//   Option<T> = Some(T) | None          null 대신
//   match v { 패턴 => 값, ... }          모든 경우 처리 강제
//   if let Some(x) = opt { }            한 경우만 처리
//   let Some(x) = opt else { return };  안 맞으면 탈출
//   while let Some(x) = it.next() { }   맞는 동안 반복
//   _  ..  |  a..=b  if 가드  x @ 패턴    패턴 문법
//   opt.unwrap_or(d) / unwrap_or_else(|| d) / map / and_then / ok_or
//
// ✏️ 직접 해보기
//   1. AppError 에 Forbidden variant 를 추가하고 cargo build → 어디서 에러가 나는지 보세요.
//   2. option_helpers 의 none.unwrap() 을 호출하면 어떤 panic 메시지가 나오나요?
// =============================================================================
