// =============================================================================
// 챕터 02: 함수와 제어 흐름 (Functions & Control Flow)
// =============================================================================
// 실행: cargo run --bin ch02_functions_control_flow
//
// 이 챕터에서 배울 것
//   1. 함수 선언 문법 (fn 이름(인자: 타입) -> 반환타입)
//   2. ⭐ 표현식(expression) vs 문장(statement) — 세미콜론의 의미
//   3. 블록 { } 도 값을 가진다 → actix 05_state 의 `let id = { ... };`
//   4. if 도 값을 가진다 (삼항 연산자 대신)
//   5. loop / while / for, 범위(range)
//   6. match 맛보기 (Java switch 의 강화판, 자세히는 ch06)
//
// ⭐ 이 챕터의 핵심 한 줄
//   "세미콜론(;)이 없는 마지막 줄 = 그 블록의 값(= 함수의 반환값)"
// =============================================================================

#![allow(dead_code, unused_variables)]

fn main() {
    println!("===== 챕터 02: 함수와 제어 흐름 =====\n");

    functions();
    expressions_vs_statements();
    block_expressions();
    if_expressions();
    loops();
    match_preview();
}

// -----------------------------------------------------------------------------
// 1. 함수 선언
// -----------------------------------------------------------------------------
//
//   Java:  public static int add(int a, int b) { return a + b; }
//   Rust:  fn add(a: i32, b: i32) -> i32 { a + b }
//
//   - fn 키워드로 시작
//   - 매개변수는 반드시 타입을 적어야 함 (함수 시그니처는 추론하지 않음)
//   - 반환 타입은 -> 뒤에. 없으면 생략 (= () 반환, Java 의 void)
//   - 함수는 어디에 선언하든 상관없음 (main 아래에 있어도 호출 가능)
//   - Java 처럼 클래스 안에 있을 필요 없음. 그냥 "자유 함수"로 존재 가능

fn add(a: i32, b: i32) -> i32 {
    a + b // ← 세미콜론 없음! 이 값이 반환됩니다. `return a + b;` 와 같은 의미
}

fn greet(name: &str) {
    // 반환 타입이 없음 → () 를 반환 (void)
    println!("안녕하세요, {}님!", name);
}

// 여러 값을 반환하고 싶으면 튜플로
fn divide(a: i32, b: i32) -> (i32, i32) {
    (a / b, a % b) // (몫, 나머지)
}

// return 키워드는 "중간에 일찍 빠져나갈 때" 주로 씁니다. (early return)
fn check_age(age: u8) -> &'static str {
    // &'static str 은 "프로그램이 끝날 때까지 살아있는 문자열" (문자열 리터럴 타입)
    // 'static 은 ch04 에서 설명합니다. 지금은 "문자열 리터럴을 반환할 때 쓰는 타입"으로 이해!
    if age < 18 {
        return "미성년자"; // 일찍 반환할 땐 return + 세미콜론
    }
    "성인" // 마지막 값은 return 없이
}

fn functions() {
    println!("--- 1. 함수 ---");
    let sum = add(3, 4);
    greet("영희");
    let (q, r) = divide(17, 5);
    println!("sum={}, 몫={}, 나머지={}, {}\n", sum, q, r, check_age(20));
}

// -----------------------------------------------------------------------------
// 2. ⭐ 표현식 vs 문장 — 세미콜론이 왜 중요한가
// -----------------------------------------------------------------------------
//
// 표현식(expression): 계산되어 "값"이 되는 것.        예) 5,  a + b,  add(1, 2),  if ...,  { ... }
// 문장(statement)   : 어떤 동작을 할 뿐 값이 없는 것. 예) let x = 5;   ,  x + 1;
//
// 표현식 끝에 ; 를 붙이면 → 값을 버리고 문장이 됩니다. (값은 () 가 됨)
//
// 그래서 아래 함수는 컴파일 에러가 납니다:
//
//   fn add_wrong(a: i32, b: i32) -> i32 {
//       a + b;    // ← 세미콜론 때문에 값이 버려지고, 블록의 값은 () 가 됨
//   }
//   error[E0308]: mismatched types — expected `i32`, found `()`
//   help: remove this semicolon to return this value   ← 컴파일러가 친절하게 알려줌
//
// Java 에서는 모든 줄에 ; 를 붙이는 습관이 있어서 처음에 자주 하는 실수입니다.

fn expressions_vs_statements() {
    println!("--- 2. 표현식 vs 문장 ---");

    // 📌 actix 의 거의 모든 핸들러가 이 규칙을 이용합니다 (01_basic)
    //
    //   async fn hello() -> impl Responder {
    //       HttpResponse::Ok().body("안녕하세요!")    ← ; 없음 → 이 값이 반환값
    //   }
    //
    //   그리고 main 함수 마지막도:
    //       HttpServer::new(...).bind(...)?.run().await   ← ; 없음 → main 의 반환값(Result)
    println!("add(1, 2) = {}\n", add(1, 2));
}

// -----------------------------------------------------------------------------
// 3. 블록 { } 도 표현식이다
// -----------------------------------------------------------------------------
fn block_expressions() {
    println!("--- 3. 블록 표현식 ---");

    // 중괄호 블록의 마지막 표현식이 블록 전체의 값이 됩니다.
    let y = {
        let a = 10;
        let b = 20;
        a + b // ← 세미콜론 없음 → 블록의 값 = 30
    }; // ← let 문장 끝이라서 여기엔 ; 가 필요
    println!("y = {}", y);

    // 📌 actix 05_state 의 create_todo 에 나오는 바로 그 코드!
    //
    //     let id = {
    //         let mut next_id = state.next_id.lock().unwrap();  // 잠금(lock) 획득
    //         let id = *next_id;                               // 현재 값 복사
    //         *next_id += 1;                                   // 1 증가
    //         id                                               // ← 블록의 값
    //     };                                                   // ← 여기서 잠금 자동 해제!
    //
    // 왜 이렇게 쓸까?
    //   블록이 끝나면 블록 안에서 만든 변수(next_id = 잠금 객체)가 자동으로 정리(drop)됩니다.
    //   즉 "잠금을 최대한 짧게 잡고, 필요한 값(id)만 바깥으로 꺼내기" 위한 관용구입니다.
    //   Java 로 치면 synchronized 블록을 짧게 잡고 결과만 밖으로 꺼내는 것과 같은 효과.
    //   (잠금 해제가 왜 자동인지는 ch03 의 drop, ch11 의 Mutex 에서 설명)

    // 흉내 내 보기 (Mutex 없이)
    let mut next_id = 1;
    let id = {
        let current = next_id;
        next_id += 1;
        current
    };
    println!("발급된 id = {}, 다음 id = {}\n", id, next_id);
}

// -----------------------------------------------------------------------------
// 4. if 도 표현식
// -----------------------------------------------------------------------------
fn if_expressions() {
    println!("--- 4. if 표현식 ---");

    let age = 20;

    // 기본형: 조건에 괄호가 필요 없음. 대신 중괄호는 필수
    if age >= 18 {
        println!("성인");
    } else if age >= 13 {
        println!("청소년");
    } else {
        println!("어린이");
    }

    // 조건은 반드시 bool 이어야 함. Java 처럼 숫자를 조건으로 쓸 수 없고 (C 의 if (1) 같은 것 불가)
    // if age { }   // ❌ expected `bool`, found integer

    // if 가 값을 돌려주므로 삼항 연산자(조건 ? a : b)가 따로 없습니다.
    //   Java: String label = age >= 18 ? "성인" : "미성년";
    let label = if age >= 18 { "성인" } else { "미성년" };
    println!("label = {}", label);
    // 양쪽 가지(branch)의 타입은 같아야 합니다. if ... { 1 } else { "a" } 는 에러.

    // 📌 actix 07_error_handling 의 validate_age 도 if/else 전체가 반환값입니다
    //   fn validate_age(age: u8) -> Result<(), AppError> {
    //       if age < 18 { Err(...) } else if age > 150 { Err(...) } else { Ok(()) }
    //   }
    println!();
}

// -----------------------------------------------------------------------------
// 5. 반복문
// -----------------------------------------------------------------------------
fn loops() {
    println!("--- 5. 반복문 ---");

    // ▶ loop : 무한 루프 (while(true)). break 로 빠져나오며 값을 돌려줄 수도 있음
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 5 {
            break counter * 10; // loop 의 값 = 50
        }
    };
    println!("loop 결과 = {}", result);

    // ▶ while
    let mut n = 3;
    while n > 0 {
        print!("{} ", n); // print! 은 줄바꿈 없는 출력
        n -= 1;
    }
    println!("발사!");

    // ▶ for — Rust 에는 C 스타일 for (int i=0; i<n; i++) 가 없습니다.
    //   대신 "반복 가능한 것(iterator)"을 순회합니다. Java 의 향상된 for (for (x : list)) 와 같음.

    // 범위(range):  a..b 는 a 이상 b 미만,  a..=b 는 a 이상 b 이하
    for i in 0..3 {
        print!("{} ", i); // 0 1 2
    }
    println!();
    for i in (1..=3).rev() {
        // rev(): 뒤집기
        print!("{} ", i); // 3 2 1
    }
    println!();

    // 컬렉션 순회
    let fruits = vec!["사과", "바나나", "포도"];
    for fruit in &fruits {
        // &fruits : "빌려서" 순회 (ch04). & 를 빼면 fruits 가 소비되어 이후 못 씀
        print!("{} ", fruit);
    }
    println!();

    // 인덱스가 필요하면 enumerate()  (Java 에선 for (int i...) 로 하던 것)
    for (i, fruit) in fruits.iter().enumerate() {
        print!("{}:{} ", i, fruit);
    }
    println!();

    // ▶ 레이블 붙은 break — 중첩 루프를 한 번에 빠져나오기 (Java 의 label: 과 동일)
    'outer: for x in 0..5 {
        for y in 0..5 {
            if x * y == 6 {
                println!("찾음: {} * {} = 6", x, y);
                break 'outer;
            }
        }
    }

    // 📌 actix 08_advanced 에 나오는 `while let` 은 ch06(패턴 매칭)에서 다룹니다.
    //     while let Some(msg) = msg_stream.next().await { ... }
    println!();
}

// -----------------------------------------------------------------------------
// 6. match 맛보기
// -----------------------------------------------------------------------------
fn match_preview() {
    println!("--- 6. match 맛보기 ---");

    // match 는 Java 의 switch 를 훨씬 강력하게 만든 것입니다.
    //  - 값을 돌려주는 표현식이고 (Java 14+ switch expression 과 비슷)
    //  - 모든 경우를 다 처리하지 않으면 컴파일 에러 (exhaustive)
    //  - break 가 필요 없음 (fall-through 없음)
    let status = 404;
    let text = match status {
        200 => "OK",
        201 | 204 => "성공(본문 없음 또는 생성)", // | 로 여러 값
        400..=499 => "클라이언트 에러",          // 범위
        500..=599 => "서버 에러",
        _ => "기타", // _ 는 "나머지 전부" (Java 의 default). 없으면 컴파일 에러!
    };
    println!("{} → {}", status, text);

    // 진짜 힘은 enum 과 함께 쓸 때 나옵니다. (ch06)
    //   match todos.get(&id) {
    //       Some(todo) => HttpResponse::Ok().json(todo),
    //       None       => HttpResponse::NotFound().json(...),
    //   }
}

// =============================================================================
// 📝 정리
// =============================================================================
//   fn f(a: i32) -> i32 { a + 1 }   마지막 표현식(; 없음)이 반환값
//   return x;                        조기 반환할 때만
//   let v = { ...; 값 };             블록도 값을 가짐 → 잠금 범위 줄이기 등에 활용
//   let v = if c { a } else { b };   삼항 연산자 대신
//   loop / while / for x in 0..n     C 스타일 for 없음
//   match x { 패턴 => 값, _ => 기본 } 모든 경우를 처리해야 함
//
// ✏️ 직접 해보기
//   1. add 함수의 `a + b` 뒤에 ; 를 붙여 보고 컴파일러 메시지(help: ...)를 읽어보세요.
//   2. match_preview 에서 `_ => "기타",` 줄을 지우면 어떤 에러가 나나요?
// =============================================================================
