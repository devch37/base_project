// =============================================================================
// 챕터 01: 변수와 기본 타입 (Variables & Types)
// =============================================================================
// 실행: cargo run --bin ch01_variables_types
//
// 이 챕터에서 배울 것
//   1. let / let mut  — Rust 변수는 "기본이 불변"
//   2. 섀도잉(shadowing) — 같은 이름으로 변수를 다시 선언
//   3. 정수/실수/불리언/문자 타입 — Java의 int, long 과 어떻게 대응되나
//   4. 튜플, 배열
//   5. String 과 &str 맛보기 (자세한 건 ch04)
//   6. println! / format! 의 {} {:?} {:#?}
//
// Java 개발자를 위한 한 줄 요약
//   Java:  int x = 5;        final int y = 5;
//   Rust:  let mut x = 5;    let y = 5;          ← 반대! Rust는 final 이 기본값
// =============================================================================

// #![allow(...)] : "이 파일 전체에서 이런 경고는 띄우지 마"라는 컴파일러 지시문입니다.
// 학습용 예제라 일부러 안 쓰는 변수가 많아서 넣었습니다. 실무 코드에서는 보통 빼요.
#![allow(unused_variables, unused_assignments, dead_code)]

fn main() {
    println!("===== 챕터 01: 변수와 기본 타입 =====\n");

    variables_and_mutability();
    shadowing();
    scalar_types();
    compound_types();
    string_preview();
    printing();
}

// -----------------------------------------------------------------------------
// 1. let 과 let mut
// -----------------------------------------------------------------------------
fn variables_and_mutability() {
    println!("--- 1. let / let mut ---");

    // let 으로 변수를 만듭니다. 타입을 안 적어도 컴파일러가 추론합니다.
    // (Java 10+ 의 var 와 비슷하지만, Rust는 훨씬 적극적으로 추론합니다)
    let x = 5; // 타입 추론 → i32 (Rust 정수의 기본 타입)

    // ❌ 아래 줄의 주석을 풀면 컴파일 에러가 납니다.
    // x = 6;
    // error[E0384]: cannot assign twice to immutable variable `x`
    //
    // 왜 기본이 불변일까?
    //  - 값이 바뀌지 않는다는 보장이 있으면 코드를 읽기 쉽고,
    //  - 여러 스레드가 동시에 읽어도 안전하다는 걸 컴파일러가 증명할 수 있기 때문입니다.
    //  - Java 에서 "가능하면 final 을 붙여라"라는 조언을 언어 차원에서 강제한 셈입니다.

    // 바꿀 변수에는 mut(mutable) 을 붙입니다.
    let mut count = 0;
    count += 1;
    count += 1;
    println!("count = {}", count); // 2

    // 타입을 명시하고 싶으면 `이름: 타입` 형태로 씁니다. (Java 와 순서가 반대)
    //   Java: long id = 1L;
    //   Rust: let id: u64 = 1;
    let id: u64 = 1;

    // 상수(const): 컴파일 시점에 값이 정해져야 하고, 타입을 반드시 적어야 합니다.
    // Java 의 `static final int MAX_USERS = 100;` 과 같습니다. 이름은 대문자_스네이크.
    const MAX_USERS: u32 = 100;
    println!("id = {}, MAX_USERS = {}\n", id, MAX_USERS);

    // 💡 이름 규칙 (컴파일러가 경고로 강제합니다)
    //   변수/함수   : snake_case       (Java: camelCase)
    //   타입/구조체 : PascalCase       (Java 와 동일)
    //   상수        : SCREAMING_SNAKE  (Java 와 동일)
}

// -----------------------------------------------------------------------------
// 2. 섀도잉(Shadowing) — Java 에는 없는 개념
// -----------------------------------------------------------------------------
fn shadowing() {
    println!("--- 2. 섀도잉 ---");

    // 같은 이름으로 let 을 "다시" 하면, 새 변수가 이전 변수를 가립니다(shadow).
    // mut 로 값을 바꾸는 것과 다릅니다: 아예 새로운 변수이고, 타입까지 바뀔 수 있습니다.
    let input = "42"; // &str (문자열)
    let input: i32 = input.parse().unwrap(); // i32 (숫자) — 같은 이름, 다른 타입!
    let input = input * 2; // 84
    println!("input = {}", input);

    // 📌 actix 코드에서 자주 보는 패턴 (01_basic, 05_state 등)
    //
    //     async fn greet(name: web::Path<String>) -> impl Responder {
    //         let name = name.into_inner();   // ← 섀도잉!
    //
    // 매개변수 name 은 web::Path<String> 타입(포장지)인데,
    // 포장을 벗긴 String 을 같은 이름 name 으로 다시 선언한 것입니다.
    // Java 라면 String nameValue = name.getValue(); 처럼 새 이름을 지어야 했겠죠.

    // 섀도잉은 블록 { } 안에서만 유효할 수도 있습니다.
    let level = 1;
    {
        let level = 99; // 이 블록 안에서만 99
        println!("블록 안 level = {}", level);
    }
    println!("블록 밖 level = {}\n", level); // 다시 1
}

// -----------------------------------------------------------------------------
// 3. 스칼라 타입 (값 하나짜리 타입)
// -----------------------------------------------------------------------------
fn scalar_types() {
    println!("--- 3. 스칼라 타입 ---");

    // ▶ 정수: i = signed(음수 가능), u = unsigned(0 이상), 뒤 숫자 = 비트 수
    //
    //   Rust   | Java    | 범위 / 용도
    //   -------+---------+-----------------------------------------
    //   i8     | byte    | -128 ~ 127
    //   i16    | short   |
    //   i32    | int     | 정수 기본 타입
    //   i64    | long    |
    //   u8     | (없음)  | 0 ~ 255. 바이트 데이터, 나이(age) 등
    //   u32    | (없음)  |
    //   u64    | (없음)  | 0 이상의 큰 수. DB id 에 자주 씀 (actix 예제의 id: u64)
    //   usize  | (없음)  | "이 컴퓨터의 포인터 크기". 배열 인덱스/길이(len) 타입
    //
    // Java 에는 unsigned 가 없지만, Rust 는 "음수가 나올 수 없는 값"을 타입으로 표현합니다.
    // 예: 03_request_response 의 `age: u8` → JSON 으로 -1 이나 300 이 오면 역직렬화 단계에서 거부됩니다.
    let age: u8 = 30;
    let user_id: u64 = 1_000_000; // _ 는 가독성용 구분자 (Java 의 1_000_000 과 같음)
    let len: usize = 3;

    // 접미사로 타입을 지정할 수도 있습니다.
    let big = 10u64; // let big: u64 = 10; 과 같음

    // ▶ 타입 변환은 자동으로 일어나지 않습니다! `as` 로 명시해야 합니다.
    //   Java 에서는 int → long 이 자동이지만, Rust 는 i32 → i64 도 직접 적어야 합니다.
    let a: i32 = 10;
    let b: i64 = 20;
    // let c = a + b;          // ❌ 에러: i32 와 i64 는 더할 수 없음
    let c = a as i64 + b; // ✅
    println!("c = {}", c);

    // ▶ 정수 오버플로: 디버그 빌드에서는 panic(프로그램 중단), Java 처럼 조용히 넘어가지 않음.
    // let overflow: u8 = 255 + 1; // ❌ 컴파일 에러로 바로 잡아줌

    // ▶ 실수: f32(float), f64(double). 기본은 f64
    let pi = 3.14; // f64
    let ratio: f32 = 0.5;

    // ▶ 불리언: bool (true / false)
    let completed: bool = false;

    // ▶ 문자: char — 작은따옴표. Java 의 char(2바이트)와 달리 4바이트 유니코드라 한글/이모지 OK
    let ch: char = '한';
    let emoji: char = '🦀'; // Rust 마스코트 Ferris (게)

    println!(
        "age={}, user_id={}, len={}, big={}, pi={}, ratio={}, completed={}, ch={}, emoji={}\n",
        age, user_id, len, big, pi, ratio, completed, ch, emoji
    );
}

// -----------------------------------------------------------------------------
// 4. 복합 타입: 튜플, 배열
// -----------------------------------------------------------------------------
fn compound_types() {
    println!("--- 4. 튜플 / 배열 ---");

    // ▶ 튜플(tuple): 서로 다른 타입 여러 개를 하나로 묶음. Java 에는 없음(Pair 클래스 등으로 흉내)
    let pair: (u64, &str) = (1, "홍길동");
    println!("pair.0 = {}, pair.1 = {}", pair.0, pair.1); // .0, .1 로 접근

    // 구조 분해(destructuring): 튜플을 풀어서 각각 변수로 받기
    let (id, name) = pair;
    println!("id = {}, name = {}", id, name);

    // 📌 actix 에서 이렇게 쓰입니다
    //   02_routing:  async fn get_user_post(path: web::Path<(u64, u64)>)
    //                let (user_id, post_id) = path.into_inner();   ← URL 의 {user_id}/{post_id}
    //   01_basic:    .bind(("127.0.0.1", 8080))                    ← (주소, 포트) 튜플
    //   08_advanced: let (response, mut session, mut msg_stream) = actix_ws::handle(...)?;

    // ▶ 유닛 타입 () : 원소가 0개인 튜플. "반환값 없음"을 뜻함 → Java 의 void 에 해당
    let nothing: () = ();
    // Result<(), AppError> 는 "성공하면 돌려줄 값은 없고, 실패하면 AppError" 라는 뜻 (07_error_handling)

    // ▶ 배열: 길이가 컴파일 타임에 고정. 타입 표기는 [원소타입; 길이]
    let scores: [i32; 3] = [90, 85, 70];
    let zeros = [0; 5]; // [0, 0, 0, 0, 0]
    println!("scores[0] = {}, 길이 = {}", scores[0], scores.len());

    // 범위를 벗어나면? Java 의 ArrayIndexOutOfBoundsException 처럼 panic 이 납니다.
    // (C 처럼 엉뚱한 메모리를 읽지 않습니다 — 이게 Rust 의 "메모리 안전성")

    // 길이가 바뀌는 리스트가 필요하면 Vec<T> 를 씁니다 (Java 의 ArrayList). ch10 에서 자세히.
    let mut list: Vec<i32> = Vec::new();
    list.push(1);
    list.push(2);
    println!("list = {:?}\n", list);
}

// -----------------------------------------------------------------------------
// 5. 문자열 맛보기: String vs &str
// -----------------------------------------------------------------------------
fn string_preview() {
    println!("--- 5. String vs &str (맛보기) ---");

    // Rust 에는 문자열 타입이 대표적으로 두 개 있습니다. 처음엔 이게 제일 헷갈려요.
    //
    //   &str   : "빌려 보는" 문자열 (읽기 전용 view). 문자열 리터럴 "..." 의 타입
    //   String : "소유하는" 문자열 (힙에 있고, 수정/확장 가능). Java 의 StringBuilder + String 느낌
    //
    // 비유: &str 은 도서관 책을 빌려 읽는 것, String 은 책을 사서 내 것으로 가진 것.
    let literal: &str = "안녕"; // 프로그램 바이너리에 박혀 있는 문자열을 가리킴
    let mut owned: String = String::from("안녕"); // 힙에 새로 만든 내 문자열
    owned.push_str("하세요"); // 내 것이니까 수정 가능

    // &str → String 변환 방법들 (actix 코드에 계속 나옵니다)
    let s1 = "Todo API".to_string(); // 05_state: app_name: "Todo API".to_string()
    let s2 = String::from("Todo API");
    let s3 = format!("Todo {}", 1); // 05_state: format!("Todo {} 를 찾을 수 없습니다", id)

    // 왜 구조체 필드는 거의 String 일까?
    //   struct Todo { title: String } ← 구조체가 문자열을 "소유"해야
    //   원본이 사라져도 Todo 가 계속 유효하기 때문입니다. (ch03 소유권에서 자세히)
    println!("literal={}, owned={}, s1={}, s2={}, s3={}\n", literal, owned, s1, s2, s3);
}

// -----------------------------------------------------------------------------
// 6. 출력 매크로: println!, format!
// -----------------------------------------------------------------------------
fn printing() {
    println!("--- 6. println! / format! ---");

    // 이름 끝의 ! 는 "함수가 아니라 매크로"라는 표시입니다. (ch12 에서 자세히)
    // {} 자리에 값이 순서대로 들어갑니다. Java 의 String.format("%s", x) 와 비슷.
    let name = "철수";
    let age = 25;
    println!("{}님은 {}살", name, age);

    // 변수 이름을 {} 안에 바로 쓸 수도 있습니다 (Rust 2021+)
    println!("{name}님은 {age}살");

    // {}   : Display  — 사용자에게 보여줄 "예쁜" 출력 (Java 의 toString())
    // {:?} : Debug    — 개발자용 디버그 출력. Vec, 튜플, 구조체 등은 보통 이걸로 찍습니다.
    // {:#?}: Debug 를 줄바꿈해서 보기 좋게 (pretty print)
    let v = vec![1, 2, 3];
    println!("{:?}", v); // [1, 2, 3]
    // println!("{}", v);   // ❌ Vec 은 Display 가 구현돼 있지 않아 {} 로 못 찍음

    let t = (1, "a");
    println!("{:#?}", t);

    // 숫자 포맷
    println!("소수 둘째 자리: {:.2}", 3.14159); // 3.14
    println!("오른쪽 정렬 5칸: [{:>5}]", 42); // [   42]

    // 중괄호 자체를 출력하려면 {{ }} 로 두 번 씁니다.
    // 📌 05_state 의 curl 안내문:  println!("  -d '{{\"title\": \"새로운 할 일\"}}'");
    println!("{{\"title\": \"할 일\"}}");

    // format! 은 출력 대신 String 을 만들어 돌려줍니다.
    let msg: String = format!("{}님 환영합니다", name);
    println!("{}", msg);

    // eprintln! 은 표준 에러(stderr)로 출력 (System.err.println)
    eprintln!("(이 줄은 stderr 로 출력됩니다)");
}

// =============================================================================
// 📝 정리
// =============================================================================
//   let x = 1;          불변 변수 (Java final)
//   let mut x = 1;      가변 변수
//   let x: u64 = 1;     타입 명시 (이름: 타입)
//   let x = x * 2;      섀도잉 — 같은 이름으로 새 변수
//   const MAX: u32 = 1; 상수
//   (a, b)              튜플,  let (a, b) = t; 로 분해
//   ()                  유닛 = void
//   x as i64            명시적 형 변환 (자동 변환 없음)
//   {} / {:?}           Display / Debug 출력
//
// ✏️ 직접 해보기
//   1. variables_and_mutability() 의 `x = 6;` 주석을 풀고 cargo run → 에러 메시지를 읽어보세요.
//      Rust 컴파일러 에러는 "어떻게 고치면 되는지"까지 알려주는 걸로 유명합니다.
//   2. let age: u8 = 300; 으로 바꿔보면 어떤 에러가 나나요?
// =============================================================================
