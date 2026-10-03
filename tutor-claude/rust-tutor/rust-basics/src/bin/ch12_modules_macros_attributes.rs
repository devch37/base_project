// =============================================================================
// 챕터 12: 모듈, use, 매크로, 어트리뷰트, serde, 테스트
// =============================================================================
// 실행: cargo run  --bin ch12_modules_macros_attributes
// 테스트: cargo test --bin ch12_modules_macros_attributes
//
// 이 챕터에서 배울 것
//   1. mod / pub / use — Java 의 package / public / import
//   2. 경로 문법 ::, crate::, super::, self, { } 묶음 import
//   3. 매크로 ! — println!, vec!, format!, json!, 그리고 직접 만들기(macro_rules!)
//   4. 어트리뷰트 #[...] — derive, allow, cfg, test, 그리고 actix 의 #[get("/")]
//   5. serde — #[derive(Serialize, Deserialize)] 와 JSON 변환 (Jackson 역할)
//   6. 단위 테스트 #[cfg(test)] mod tests { #[test] fn ... }  (JUnit 역할)
// =============================================================================

#![allow(dead_code, unused_imports)]

// -----------------------------------------------------------------------------
// 1. 모듈 (mod)
// -----------------------------------------------------------------------------
// Java 에서는 "폴더 = 패키지, 파일 = 클래스" 였죠.
// Rust 에서는 mod 키워드로 모듈을 선언합니다. 보통 파일 하나가 모듈 하나지만,
// 학습 편의를 위해 여기서는 한 파일 안에 { } 로 인라인 모듈을 만듭니다.
//
// 실제 프로젝트 구조 예시:
//   src/
//   ├── main.rs          ← mod handlers;  mod models;  라고 선언
//   ├── handlers.rs      ← handlers 모듈
//   └── models/
//       ├── mod.rs       ← models 모듈 (또는 models.rs)
//       └── todo.rs      ← models::todo 모듈
//
// 가시성(visibility) — 기본이 private 입니다 (Java 의 package-private 보다 더 엄격)
//   (없음)       : 같은 모듈(과 그 자식 모듈) 안에서만
//   pub          : 어디서나 (public)
//   pub(crate)   : 이 크레이트(프로젝트) 안에서만 — 라이브러리 내부용
mod models {
    // 구조체가 pub 이어도 필드는 각각 pub 을 붙여야 밖에서 접근 가능
    #[derive(Debug)]
    pub struct Todo {
        pub id: u64,
        pub title: String,
        secret_note: String, // private 필드 → 모듈 밖에서는 직접 생성/접근 불가
    }

    impl Todo {
        // private 필드가 있으면 밖에서 Todo { .. } 로 못 만드니 생성자를 제공해야 함
        pub fn new(id: u64, title: &str) -> Self {
            Todo { id, title: title.to_string(), secret_note: String::new() }
        }
    }

    // 중첩 모듈
    pub mod validation {
        // super:: = 부모 모듈 (여기서는 models). Java 에는 없는 상대 경로
        use super::Todo;

        pub fn is_valid(todo: &Todo) -> bool {
            !todo.title.trim().is_empty() && super::helper_len(&todo.title) <= 100
        }
    }

    fn helper_len(s: &str) -> usize {
        // pub 이 아님 → models 모듈과 그 자식(validation)만 사용 가능
        s.chars().count()
    }
}

mod handlers {
    // crate:: = 이 크레이트의 최상위(루트)에서 시작하는 절대 경로
    use crate::models::validation;
    use crate::models::Todo;

    pub fn create(id: u64, title: &str) -> Result<Todo, String> {
        let todo = Todo::new(id, title);
        if validation::is_valid(&todo) {
            Ok(todo)
        } else {
            Err("제목이 비어 있습니다".to_string())
        }
    }
}

// -----------------------------------------------------------------------------
// 2. use — import
// -----------------------------------------------------------------------------
// :: 는 경로 구분자 (Java 의 . 에 해당).  std::collections::HashMap == java.util.HashMap
use std::collections::HashMap;
// { } 로 여러 개를 한 번에
use std::fmt::{self, Display}; // self = std::fmt 모듈 자체도 가져옴 → fmt::Result 처럼 사용 가능
// as 로 별칭
use std::io::Result as IoResult;

// 📌 actix 코드의 use 문 해석
//
//   use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
//     → actix_web 크레이트에서 매크로(get, post), 모듈(web), 타입(App ...), 트레이트(Responder)를 가져옴
//
//   use actix_web::{
//       web::{self, Json},     → web 모듈 자체(self)와 web::Json 타입을 가져옴
//       App, HttpResponse, ...    그래서 코드에서 web::Path 도 쓰고, Json<T> 도 바로 씀
//   };
//
//   use serde::{Deserialize, Serialize};   → derive 매크로 이름을 가져옴
//   use std::sync::Mutex;                  → 표준 라이브러리
//
//   use 없이 전체 경로로 써도 됩니다:
//     actix_web::HttpRequest, serde_json::json!(...), std::fs::read_to_string(...)
//   07_error_handling 에서 `req: actix_web::HttpRequest` 처럼 쓴 것이 그 예입니다.
//
// 💡 크레이트(crate) = 컴파일 단위 = Java 의 jar 하나. Cargo.toml [dependencies] 에 적으면 바로 use 가능.

// -----------------------------------------------------------------------------
// 3. 매크로
// -----------------------------------------------------------------------------
// 이름 뒤에 ! 가 붙은 것은 함수가 아니라 "매크로"입니다.
// 매크로 = 컴파일 전에 코드를 생성/변환하는 코드. 함수로는 할 수 없는 일을 합니다.
//   - println!("{} {}", a, b) : 인자 개수가 가변 + 포맷 문자열을 "컴파일 시점에" 검사
//   - vec![1, 2, 3]           : Vec 생성 + push 코드를 펼쳐줌
//   - format!, write!, panic!, assert!, assert_eq!, matches!, todo!, unimplemented!
//   - serde_json::json!({ "key": value }) : JSON 리터럴을 Rust 코드로 변환
//
// 직접 만들기: macro_rules! (규칙 기반 매크로)
macro_rules! square {
    // ($x:expr) : "표현식 하나를 받아 $x 라고 부르겠다"
    ($x:expr) => {
        $x * $x
    };
}

// 반복 패턴: $( ... ),*  = "쉼표로 구분된 0개 이상"
macro_rules! hashmap {
    ( $( $k:expr => $v:expr ),* $(,)? ) => {{
        let mut m = HashMap::new();
        $( m.insert($k, $v); )*
        m
    }};
}

fn macros_demo() {
    println!("--- 3. 매크로 ---");
    println!("  square!(7) = {}", square!(7)); // 컴파일 전에 7 * 7 로 바뀜
    let m = hashmap! { "a" => 1, "b" => 2 };
    println!("  hashmap! = {:?}", m.get("a"));

    // serde_json::json! — actix 응답에 정말 자주 나옴
    // 📌 05_state:
    //   HttpResponse::Ok().json(serde_json::json!({ "count": todo_list.len(), "todos": todo_list }))
    let count = 2;
    let v = serde_json::json!({
        "count": count,                // Rust 변수를 그대로 넣을 수 있음
        "tags": ["rust", "web"],
        "error": null
    });
    println!("  json! = {}", v);

    // assert! 계열: 조건이 거짓이면 panic. 테스트에서 주로 사용
    assert_eq!(square!(3), 9);

    // todo!() : "아직 구현 안 함" 표시. 실행되면 panic. 컴파일은 통과 → 뼈대 잡을 때 유용
    // fn later() -> u32 { todo!() }
    println!();
}

// -----------------------------------------------------------------------------
// 4. 어트리뷰트 #[...]  (Java 의 어노테이션 @... 과 비슷한 위치/모양)
// -----------------------------------------------------------------------------
//   #[derive(Debug, Clone)]        트레이트 자동 구현 코드 생성 (Lombok 느낌)
//   #[allow(dead_code)]            경고 끄기 (@SuppressWarnings)
//   #[test]                        테스트 함수 (@Test)
//   #[cfg(test)]                   테스트 빌드에서만 컴파일 (조건부 컴파일)
//   #[cfg(target_os = "linux")]    OS 별 코드
//   #![...] (느낌표)               "이 파일/크레이트 전체"에 적용 (이 파일 맨 위 #![allow] 처럼)
//
// 📌 actix 의 어트리뷰트 매크로 — 함수를 통째로 받아 다른 코드로 바꿔치기 합니다.
//
//   #[get("/hello/{name}")]
//   async fn greet(name: web::Path<String>) -> impl Responder { ... }
//
//     → greet 라는 이름의 "라우트 정보 + 핸들러를 담은 구조체"로 변환됩니다.
//       그래서 .service(greet) 에 함수 이름을 그대로 넘길 수 있는 것입니다.
//       Spring 의 @GetMapping("/hello/{name}") 과 역할이 같습니다.
//
//   #[actix_web::main]
//   async fn main() -> std::io::Result<()> { ... }
//
//     → 대략 이렇게 펼쳐집니다 (ch13 에서 다시):
//       fn main() -> std::io::Result<()> {
//           actix_web::rt::System::new().block_on(async { ...원래 본문... })
//       }
//       Rust 의 main 은 원래 async 일 수 없어서, 비동기 런타임을 띄우고 그 위에서 본문을 실행해 줍니다.

// -----------------------------------------------------------------------------
// 5. serde — 직렬화/역직렬화
// -----------------------------------------------------------------------------
use serde::{Deserialize, Serialize};

// Serialize   : Rust 값 → JSON  (응답 보낼 때)   Jackson 의 writeValueAsString
// Deserialize : JSON → Rust 값  (요청 받을 때)   Jackson 의 readValue
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Rust 의 snake_case 필드를 JSON 에선 camelCase 로 (@JsonNaming)
struct CreateUserRequest {
    user_name: String, //                      JSON: "userName"
    email: String,
    #[serde(default)] //                       JSON 에 없으면 기본값(0) 사용
    age: u8,
    nickname: Option<String>, //               없거나 null 이면 None
    #[serde(skip_serializing_if = "Option::is_none")]
    bio: Option<String>, //                    None 이면 JSON 출력에서 아예 빼기 (@JsonInclude(NON_NULL))
}

fn serde_demo() {
    println!("--- 5. serde ---");

    // JSON → 구조체 (actix 의 web::Json<T> 가 내부에서 이걸 해줍니다)
    let raw = r#"{ "userName": "kim", "email": "kim@example.com" }"#;
    //         r#"..."# : raw 문자열. 안의 " 를 \" 로 이스케이프 안 해도 됨 (Java 의 텍스트 블록 """)
    let req: CreateUserRequest = serde_json::from_str(raw).unwrap();
    println!("  from_str → {:?}", req);

    // 구조체 → JSON (actix 의 HttpResponse::Ok().json(x) 가 이걸 해줍니다)
    let out = serde_json::to_string(&req).unwrap();
    println!("  to_string → {}", out);

    // 타입이 안 맞으면 에러 → actix 에서는 자동으로 400 Bad Request
    let bad = r#"{ "userName": "kim", "email": "a", "age": 300 }"#; // u8 범위 초과
    let err = serde_json::from_str::<CreateUserRequest>(bad).unwrap_err();
    println!("  잘못된 JSON → 에러: {}\n", err);
}

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------
fn main() {
    println!("===== 챕터 12: 모듈, use, 매크로, 어트리뷰트 =====\n");

    println!("--- 1/2. 모듈과 use ---");
    let ok = handlers::create(1, "Rust 공부");
    let bad = handlers::create(2, "   ");
    println!("  {:?}", ok.map(|t| t.title));
    println!("  {:?}", bad);
    // let t = models::Todo { id: 1, title: "x".into(), secret_note: "".into() };
    // ❌ field `secret_note` of struct `Todo` is private
    println!();

    macros_demo();
    serde_demo();

    println!("--- 6. 테스트 ---");
    println!("  cargo test --bin ch12_modules_macros_attributes 로 아래 테스트를 실행해보세요.");
}

// -----------------------------------------------------------------------------
// 6. 단위 테스트 — 같은 파일 안에 둡니다 (Java 처럼 src/test 로 분리하지 않음)
// -----------------------------------------------------------------------------
// #[cfg(test)] : cargo test 할 때만 컴파일 → 실제 바이너리에는 포함 안 됨
#[cfg(test)]
mod tests {
    use super::*; // 부모 모듈(이 파일)의 모든 것을 가져옴 — private 함수도 테스트 가능!

    #[test]
    fn create_valid_todo() {
        let todo = handlers::create(1, "공부").unwrap();
        assert_eq!(todo.id, 1); //            assertEquals
        assert_eq!(todo.title, "공부");
    }

    #[test]
    fn reject_empty_title() {
        let result = handlers::create(1, "  ");
        assert!(result.is_err()); //           assertTrue
    }

    #[test]
    fn serde_camel_case() {
        let json = r#"{"userName":"a","email":"b"}"#;
        let req: CreateUserRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.user_name, "a");
        assert_eq!(req.age, 0); // #[serde(default)]
        assert!(req.nickname.is_none());
    }

    #[test]
    #[should_panic] // panic 이 나야 성공 (assertThrows)
    fn square_overflow_panics() {
        // 그냥 16 이라고 쓰면 컴파일러가 "16*16 은 u8 범위 초과"를 컴파일 시점에 잡아 에러로 만듭니다(똑똑하죠).
        // black_box 는 컴파일러가 값을 미리 계산하지 못하게 숨기는 함수 → 런타임 panic 을 확인할 수 있음
        let x: u8 = std::hint::black_box(16);
        let _ = square!(x); // 256 → u8 오버플로 → 디버그 빌드에서 panic
    }
}

// =============================================================================
// 📝 정리
// =============================================================================
//   mod a { pub fn f() {} }        모듈 선언, pub 으로 공개
//   use crate::a::f;               절대 경로 import
//   use super::X;                  부모 모듈 기준 상대 경로
//   use a::{self, B, C};           묶음 import (self = a 자체)
//   name!(...)                     매크로 호출 (println!, vec!, json!)
//   macro_rules! m { ... }         매크로 정의
//   #[derive(..)] #[allow(..)]     어트리뷰트
//   #[get("/")]                    actix 라우트 매크로 (Spring @GetMapping)
//   #[actix_web::main]             async main 을 런타임 위에서 실행
//   #[derive(Serialize, Deserialize)] + #[serde(...)]   JSON 변환
//   #[cfg(test)] mod tests { #[test] fn t() { assert_eq!(..) } }
//
// ✏️ 직접 해보기
//   1. models 모듈의 helper_len 을 handlers 에서 호출해보세요. 어떤 에러가 나나요? pub 을 붙이면?
//   2. CreateUserRequest 에 #[serde(rename = "mail")] 를 email 필드에 붙이고 테스트를 고쳐보세요.
// =============================================================================
