// =============================================================================
// 챕터 07: 에러 처리 (Result, ? 연산자, 커스텀 에러)
// =============================================================================
// 실행: cargo run --bin ch07_error_handling
//
// 이 챕터에서 배울 것
//   1. Rust 에는 예외(exception)가 없다 → Result<T, E> 를 "반환"
//   2. panic! — 복구 불가능한 버그일 때만
//   3. ? 연산자 — 에러면 즉시 return (Java 의 throws 처럼 위로 전달)
//   4. From 트레이트 — ? 가 에러 타입을 자동 변환하는 원리
//   5. 커스텀 에러 enum 만들기 (thiserror 가 대신 해주는 일을 손으로)
//   6. map_err, ok(), Box<dyn Error>, main 에서 Result 반환
//
// Java 와 비교
//   Java:  User findUser(long id) throws NotFoundException { ... throw new NotFoundException(); }
//          try { findUser(1); } catch (NotFoundException e) { ... }
//
//   Rust:  fn find_user(id: u64) -> Result<User, AppError> { ... Err(AppError::NotFound) }
//          match find_user(1) { Ok(u) => ..., Err(e) => ... }
//
//   - 에러도 그냥 "반환값"입니다. 숨은 제어 흐름(throw)이 없어요.
//   - 함수 시그니처만 보면 실패할 수 있는지, 어떤 에러인지 다 보입니다. (checked exception 의 장점)
//   - 그런데 ? 덕분에 try-catch 처럼 장황하지 않습니다.
// =============================================================================

#![allow(dead_code, unused_variables)]

use std::fmt; // fmt::Display 구현에 필요
use std::num::ParseIntError;

fn main() {
    println!("===== 챕터 07: 에러 처리 =====\n");

    result_basics();
    panic_vs_result();
    question_mark_operator();
    custom_error_demo();
    error_helpers();

    // main 이 Result 를 반환하는 예 (아래 run 함수 참고)
    if let Err(e) = run() {
        println!("run() 실패: {}", e);
    }
}

// -----------------------------------------------------------------------------
// 1. Result<T, E>
// -----------------------------------------------------------------------------
// 표준 라이브러리 정의 (역시 평범한 enum):
//   enum Result<T, E> {
//       Ok(T),    // 성공 값
//       Err(E),   // 에러 값
//   }
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("0으로 나눌 수 없습니다".to_string())
    } else {
        Ok(a / b)
    }
}

fn result_basics() {
    println!("--- 1. Result 기본 ---");

    match divide(10, 2) {
        Ok(v) => println!("성공: {}", v),
        Err(e) => println!("실패: {}", e),
    }
    match divide(1, 0) {
        Ok(v) => println!("성공: {}", v),
        Err(e) => println!("실패: {}", e),
    }

    // 표준 라이브러리의 많은 함수가 Result 를 돌려줍니다
    let n: Result<i32, ParseIntError> = "123".parse::<i32>();
    let bad = "abc".parse::<i32>();
    println!("parse: {:?}, {:?}", n, bad);

    // Result<(), E> : 성공 시 돌려줄 값이 없는 경우 (Java 의 void + throws)
    // 📌 07_error_handling:  fn validate_age(age: u8) -> Result<(), AppError>  →  성공은 Ok(())
    println!();
}

// -----------------------------------------------------------------------------
// 2. panic! vs Result
// -----------------------------------------------------------------------------
fn panic_vs_result() {
    println!("--- 2. panic! vs Result ---");

    // panic!: 프로그램(정확히는 현재 스레드)을 즉시 중단. 잡아서 복구하는 용도가 아님!
    //   - 배열 범위 초과, unwrap() on None 등 "프로그래머의 버그"를 의미
    //   - Java 로 치면 RuntimeException 중에서도 "절대 나면 안 되는" 것들
    // panic!("치명적 오류");

    // 복구 가능한 에러(파일 없음, 잘못된 입력, DB 실패...)는 Result 로!
    //
    // unwrap() / expect() 는 Err 일 때 panic 을 일으킵니다.
    //   - 예제/테스트/프로토타입에서는 편하게 씀
    //   - 📌 actix 05_state 의 `state.todos.lock().unwrap()` 은
    //     "다른 스레드가 잠금 중 panic 한 경우(poisoned)"에만 실패하므로 관례적으로 unwrap 을 씁니다.
    let v: i32 = "42".parse().expect("숫자여야 합니다");
    println!("expect 성공: {}\n", v);
}

// -----------------------------------------------------------------------------
// 3. ? 연산자 — 에러 전파
// -----------------------------------------------------------------------------
// ? 를 안 쓰면:
fn sum_strings_verbose(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let x = match a.parse::<i32>() {
        Ok(v) => v,
        Err(e) => return Err(e), // 에러면 그대로 반환
    };
    let y = match b.parse::<i32>() {
        Ok(v) => v,
        Err(e) => return Err(e),
    };
    Ok(x + y)
}

// ? 를 쓰면: 위와 완전히 같은 의미
fn sum_strings(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let x = a.parse::<i32>()?; // Ok 면 값을 꺼내고, Err 면 즉시 return Err(...)
    let y = b.parse::<i32>()?;
    Ok(x + y)
}
// ⚠️ ? 는 "Result(또는 Option)를 반환하는 함수 안에서만" 쓸 수 있습니다.
//
// 📌 actix 곳곳에서:
//     .bind(("127.0.0.1", 8080))?      ← 포트 바인딩 실패(이미 사용 중 등)면 main 이 에러로 종료
//     let user = find_user_by_id(id)?;  ← 07: 없으면 AppError 를 반환 → actix 가 404 응답으로 변환
//     sqlx::query(...).execute(&pool).await?;   ← 06: DB 에러 전파

fn question_mark_operator() {
    println!("--- 3. ? 연산자 ---");
    println!("{:?}", sum_strings_verbose("1", "2"));
    println!("{:?}", sum_strings("1", "2"));
    println!("{:?}", sum_strings("1", "x"));

    // Option 에도 ? 사용 가능 (None 이면 즉시 return None)
    fn first_char_upper(s: &str) -> Option<char> {
        let c = s.chars().next()?; // 빈 문자열이면 None 반환
        Some(c.to_ascii_uppercase())
    }
    println!("{:?}, {:?}\n", first_char_upper("rust"), first_char_upper(""));
}

// -----------------------------------------------------------------------------
// 4 & 5. 커스텀 에러 + From 트레이트 → ? 의 자동 변환
// -----------------------------------------------------------------------------
// 실무에서는 앱 전용 에러 enum 을 하나 만들고, 모든 함수가 그걸 반환하게 합니다.
#[derive(Debug)]
enum AppError {
    NotFound(String),
    BadRequest { message: String },
    Parse(ParseIntError), // 다른 에러를 감싸기(wrapping)
}

// ① Display 구현: 에러를 사람이 읽을 메시지로 ( {} 로 출력, .to_string() 가능해짐 )
//    Java 의 getMessage() 에 해당
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::NotFound(what) => write!(f, "{}을(를) 찾을 수 없습니다", what),
            AppError::BadRequest { message } => write!(f, "잘못된 요청: {}", message),
            AppError::Parse(e) => write!(f, "숫자 변환 실패: {}", e),
        }
    }
}

// ② std::error::Error 구현: "이건 에러 타입이다"라는 표식 (Java 의 extends Exception)
//    Debug + Display 가 있으면 본문은 비워도 됩니다.
impl std::error::Error for AppError {}

// ③ From 구현: ParseIntError → AppError 변환 방법을 알려줌
impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        AppError::Parse(e)
    }
}
// ⭐ ? 연산자의 숨은 동작:
//    expr?  ==  match expr { Ok(v) => v, Err(e) => return Err(From::from(e)) }
//                                                          ^^^^^^^^^^^^^^^ 자동 변환!
//    그래서 함수 반환 타입이 Result<_, AppError> 인데 ParseIntError 가 나는 코드에 ? 를 붙여도 됩니다.

fn parse_user_id(raw: &str) -> Result<u64, AppError> {
    let id: u64 = raw.parse::<u64>()?; // ParseIntError → (From) → AppError::Parse 자동 변환
    if id == 0 {
        return Err(AppError::BadRequest {
            message: "id 는 1 이상".to_string(),
        });
    }
    Ok(id)
}

fn find_user(raw_id: &str) -> Result<String, AppError> {
    let id = parse_user_id(raw_id)?; // AppError → AppError (변환 없음)
    if id == 1 {
        Ok("홍길동".to_string())
    } else {
        Err(AppError::NotFound(format!("사용자 {}", id)))
    }
}

fn custom_error_demo() {
    println!("--- 4/5. 커스텀 에러 + From ---");
    for input in ["1", "2", "0", "abc"] {
        match find_user(input) {
            Ok(name) => println!("'{}' → 성공: {}", input, name),
            Err(e) => println!("'{}' → 에러: {}   (Debug: {:?})", input, e, e),
        }
    }

    // 📌 actix 07_error_handling 의 thiserror 는 위의 ①②③ 을 자동으로 만들어 주는 매크로입니다.
    //
    //     #[derive(Debug, Error)]                       ← ② Error 구현 자동
    //     pub enum AppError {
    //         #[error("{0}을(를) 찾을 수 없습니다")]       ← ① Display 의 해당 줄 자동
    //         NotFound(String),
    //         #[error("IO 오류: {0}")]
    //         IoError(#[from] std::io::Error),          ← ③ From<io::Error> 자동
    //     }
    //
    //   그리고 actix 의 ResponseError 트레이트를 구현하면 "에러 → HTTP 응답" 변환까지 됩니다.
    //   그래서 핸들러가 Result<impl Responder, AppError> 를 반환하고 ? 만 붙이면
    //   에러가 자동으로 404/400/500 JSON 응답이 되는 것입니다.
    println!();
}

// -----------------------------------------------------------------------------
// 6. 자주 쓰는 Result 메서드
// -----------------------------------------------------------------------------
fn error_helpers() {
    println!("--- 6. Result 편의 메서드 ---");

    // map_err: 에러 타입을 다른 걸로 바꾸기 (From 구현이 없을 때 직접 변환)
    let r: Result<i32, AppError> = "x".parse::<i32>().map_err(|e| AppError::BadRequest {
        message: format!("숫자가 아님: {}", e),
    });
    println!("map_err: {}", r.unwrap_err());

    // ok(): Result → Option (에러 정보는 버림)
    // 📌 01_basic:  .and_then(|v| v.to_str().ok())   ← 변환 실패는 그냥 "없음" 취급
    let o: Option<i32> = "5".parse::<i32>().ok();
    println!("ok(): {:?}", o);

    // unwrap_or / unwrap_or_default
    let n = "x".parse::<i32>().unwrap_or(0);
    let d = "x".parse::<i32>().unwrap_or_default(); // 타입의 기본값(i32 → 0)
    println!("unwrap_or: {}, unwrap_or_default: {}", n, d);

    // map: 성공 값만 변환
    let doubled = "21".parse::<i32>().map(|v| v * 2);
    println!("map: {:?}", doubled);

    // is_ok / is_err
    // 📌 08_advanced:  if session.text(reply).await.is_err() { break; }
    println!("is_err: {}", "x".parse::<i32>().is_err());

    // let _ = ... : Result 를 일부러 무시 (Rust 는 Result 를 안 쓰면 경고를 띄움)
    // 📌 08_advanced:  let _ = session.text("연결 성공!").await;
    let _ = divide(1, 0);
    println!();
}

// -----------------------------------------------------------------------------
// Box<dyn Error> — "아무 에러나" 받기 (프로토타입/main 에서 편리)
// -----------------------------------------------------------------------------
// dyn Error = "Error 트레이트를 구현한 어떤 타입이든" (ch08 에서 dyn 설명)
// 서로 다른 종류의 에러를 ? 로 한꺼번에 전파할 때 편합니다. (Java 의 throws Exception)
fn run() -> Result<(), Box<dyn std::error::Error>> {
    let a: i32 = "10".parse()?; // ParseIntError 도
    let user = find_user("1")?; // AppError 도 → 모두 Box<dyn Error> 로 자동 변환
    println!("run(): a={}, user={}", a, user);
    let _missing = find_user("7")?; // 여기서 에러 → run 이 Err 반환
    Ok(())
}
// 📌 actix 의 main 은 `async fn main() -> std::io::Result<()>` 입니다.
//    std::io::Result<()> 는 Result<(), std::io::Error> 의 별칭(type alias)입니다.
//    main 이 Err 를 반환하면 에러를 출력하고 종료 코드 1 로 끝납니다.

// =============================================================================
// 📝 정리
// =============================================================================
//   Result<T, E> = Ok(T) | Err(E)      예외 대신 반환값
//   expr?                              Err 면 즉시 return (From 으로 자동 변환)
//   impl From<A> for MyError           ? 가 A 를 MyError 로 바꿀 수 있게
//   impl Display + impl Error          커스텀 에러의 기본 구성 (thiserror 가 자동화)
//   .map_err(|e| ...)                  에러 타입 직접 변환
//   .ok() / .unwrap_or(x) / .is_err()  편의 메서드
//   unwrap()/expect()                  Err 면 panic — 확신할 때만
//   Box<dyn Error>                     아무 에러나 (간단한 앱/main)
//
// ✏️ 직접 해보기
//   1. impl From<ParseIntError> for AppError 블록을 지우면 parse_user_id 에서 어떤 에러가 나나요?
//   2. AppError 에 Unauthorized 를 추가하고 Display 까지 구현해보세요.
// =============================================================================
