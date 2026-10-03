// =============================================================================
// 챕터 04: 빌림과 참조 (Borrowing & References)  ⭐⭐⭐
// =============================================================================
// 실행: cargo run --bin ch04_borrowing_references
//
// 이 챕터에서 배울 것
//   1. &T  : 공유(읽기 전용) 참조 — "빌려서 보기만"
//   2. &mut T : 가변 참조 — "빌려서 고치기"
//   3. 빌림 규칙: 읽기는 여럿이 동시에 OK / 쓰기는 혼자만
//   4. * 역참조 — actix 05_state 의 `*next_id += 1`
//   5. String vs &str, 슬라이스 &[T] — 함수 인자는 왜 &str 로 받나
//   6. 라이프타임 기초와 'static
//
// 앞 챕터의 문제:  take_ownership(s) 하면 s 를 다시 못 씀 → 불편!
// 해결책:          소유권은 그대로 두고 "빌려주자" → &s
// =============================================================================

#![allow(dead_code, unused_variables, unused_mut)]

fn main() {
    println!("===== 챕터 04: 빌림과 참조 =====\n");

    shared_references();
    mutable_references();
    borrowing_rules();
    deref_operator();
    strings_and_slices();
    lifetimes_intro();
}

// -----------------------------------------------------------------------------
// 1. 공유 참조 &T
// -----------------------------------------------------------------------------
// &String: "String 을 빌려 받음". 소유권은 호출한 쪽에 남아 있음
fn calculate_length(s: &String) -> usize {
    s.len() // 읽기는 가능
            // s.push_str("!"); // ❌ 공유 참조로는 수정 불가
} // s 는 빌린 것이라 여기서 drop 되지 않음 (주인이 아니니까)

fn shared_references() {
    println!("--- 1. 공유 참조 &T ---");

    let s = String::from("hello");
    let len = calculate_length(&s); // &s : s 를 "빌려줌"
    println!("'{}' 의 길이 = {}", s, len); // ✅ s 는 여전히 내 것

    //      s    [ptr ●─┼──▶ "hello"]     (주인)
    //      &s   [●─────┼──▶ s ]          (빌린 참조: s 를 가리키는 포인터)
    //
    // Java 의 참조와 비슷해 보이지만 결정적인 차이:
    //   - Rust 참조는 null 이 될 수 없음 (NullPointerException 이 원천적으로 불가능)
    //   - 참조가 살아있는 동안 원본이 사라질 수 없음을 컴파일러가 보장 (dangling pointer 불가)

    // 📌 actix 05_state:  todos.get(&id)
    //   HashMap::get 은 키를 &K (빌린 참조) 로 받습니다. 찾기만 할 건데 키를 넘겨줄(이동) 필요가 없으니까요.
    //   반대로 todos.insert(id, todo) 는 키와 값을 HashMap 이 "소유"해야 하므로 값 자체를 넘깁니다.
    println!();
}

// -----------------------------------------------------------------------------
// 2. 가변 참조 &mut T
// -----------------------------------------------------------------------------
fn add_exclamation(s: &mut String) {
    s.push_str("!"); // 빌려온 걸 수정
}

fn mutable_references() {
    println!("--- 2. 가변 참조 &mut T ---");

    let mut s = String::from("hello"); // ① 변수 자체가 mut 이어야 하고
    add_exclamation(&mut s); //            ② 넘길 때도 &mut 라고 명시해야 함
    println!("수정 후: {}", s);

    // 함수 호출부만 봐도 "아, 이 함수가 s 를 바꾸는구나"를 알 수 있습니다.
    // Java 에서는 list.sort() 를 넘겼을 때 내부에서 바뀌는지 시그니처만 보고는 모르죠.

    // 📌 actix 05_state 의 update_todo:
    //     match todos.get_mut(&id) {          // get_mut → Option<&mut Todo> (가변 참조)
    //         Some(todo) => { todo.title = title; ... }   // HashMap 안의 Todo 를 직접 수정
    println!();
}

// -----------------------------------------------------------------------------
// 3. 빌림 규칙 (Borrow Checker) — Rust 의 핵심 안전장치
// -----------------------------------------------------------------------------
//   어떤 값에 대해, 같은 시점에
//     (A) 공유 참조 &T 는 여러 개 있어도 된다          → "여러 명이 동시에 읽기 OK"
//     (B) 가변 참조 &mut T 는 단 하나만 있어야 하고,  → "쓰는 사람은 혼자"
//         그동안 공유 참조도 있으면 안 된다            → "쓰는 동안 아무도 못 읽음"
//
//   = 읽기-쓰기 잠금(ReadWriteLock)을 "컴파일러가 컴파일 시점에" 검사해 주는 것!
//   이 규칙 덕분에 데이터 경쟁(data race)이 컴파일 단계에서 막힙니다.
fn borrowing_rules() {
    println!("--- 3. 빌림 규칙 ---");

    let mut list = vec![1, 2, 3];

    // (A) 공유 참조 여러 개: OK
    let r1 = &list;
    let r2 = &list;
    println!("r1={:?}, r2={:?}", r1, r2);
    // ↑ r1, r2 는 여기서 마지막으로 사용됨 → 이후로는 "빌림이 끝난 것"으로 취급 (NLL)

    // (B) 가변 참조: 공유 참조들이 더 이상 안 쓰이니 OK
    let r3 = &mut list;
    r3.push(4);
    println!("r3={:?}", r3);

    // ❌ 이런 코드는 안 됩니다:
    //   let first = &list[0];   // 공유 참조로 첫 원소를 빌려놓고
    //   list.push(5);           // 리스트를 수정(가변 빌림) → 에러!
    //   println!("{}", first);
    //
    // 왜 막을까? Vec 은 push 할 때 공간이 부족하면 힙에 더 큰 공간을 새로 잡고 옮깁니다.
    // 그러면 first 는 "옛날 메모리"를 가리키는 dangling 포인터가 됩니다.
    // Java 의 ConcurrentModificationException 을 런타임이 아니라 컴파일 타임에 잡는 셈입니다.

    println!();
}

// -----------------------------------------------------------------------------
// 4. 역참조 연산자 *
// -----------------------------------------------------------------------------
fn deref_operator() {
    println!("--- 4. 역참조 * ---");

    // 참조는 "값이 있는 곳의 주소"입니다. 값 자체에 접근하려면 * 를 붙입니다.
    let mut count = 10;
    let r = &mut count;
    *r += 1; // r 이 가리키는 곳의 값에 1 더하기 (r += 1 은 에러: 주소에 숫자를 더할 순 없음)
    println!("count = {}", count); // 11

    // 📌 actix 05_state 의 create_todo:
    //     let mut next_id = state.next_id.lock().unwrap();   // MutexGuard<u64> (u64 를 가리키는 스마트 포인터)
    //     let id = *next_id;                               // 가리키는 u64 값을 복사해 옴
    //     *next_id += 1;                                   // 가리키는 u64 값을 1 증가
    //
    // 🤔 그런데 메서드 호출할 땐 * 를 안 붙이던데요?  예) s.len()  (s 가 &String 인데도)
    //    → 자동 역참조(auto-deref): `.` 으로 메서드/필드에 접근할 때는 Rust 가 * 를 알아서 붙여줍니다.
    //      그래서 state.app_name 처럼 web::Data<AppState> 에서 바로 필드에 접근할 수 있는 것입니다.
    //      * 를 직접 써야 하는 경우는 주로 "값 자체를 읽거나 대입할 때" 입니다.
    let s = String::from("abc");
    let rs = &s;
    println!("rs.len() = {} (자동 역참조)", rs.len());
    println!();
}

// -----------------------------------------------------------------------------
// 5. String vs &str, 그리고 슬라이스
// -----------------------------------------------------------------------------
// 함수 인자로 문자열을 받을 때는 &String 보다 &str 이 관례입니다. 이유는 아래에서.
fn first_word(s: &str) -> &str {
    // 공백 전까지의 부분 문자열을 "복사 없이" 빌려서 돌려줌
    match s.find(' ') {
        Some(idx) => &s[..idx], // 0 ~ idx 바이트 구간의 슬라이스
        None => s,
    }
}

fn strings_and_slices() {
    println!("--- 5. String vs &str, 슬라이스 ---");

    // &str 은 "문자열 슬라이스" = 어딘가에 있는 UTF-8 글자들의 (시작 주소, 길이) 묶음입니다.
    //
    //   let owned = String::from("hello world");
    //   let word: &str = &owned[0..5];
    //
    //   owned [ptr ●─┼──▶ h e l l o _ w o r l d ]   (힙, 주인은 owned)
    //   word  [ptr ●─┼──▶ ↑        ]  len = 5       (빌린 view, 복사 없음)
    let owned = String::from("hello world");
    let word = first_word(&owned); // &String 은 자동으로 &str 로 변환됨 (deref coercion)
    let word2 = first_word("rust is fun"); // 문자열 리터럴도 &str 이라 바로 넘길 수 있음
    println!("word={}, word2={}", word, word2);

    // 💡 그래서 함수 인자는 &str 로 받는 게 좋습니다: String 과 리터럴 둘 다 받을 수 있으니까요.
    //    📌 actix 03_request_response:  fn ok(data: T, message: &str) -> Self
    //
    // 💡 구조체 필드/반환값처럼 "오래 보관해야 하는" 곳은 String 으로 소유합니다.
    //    📌 struct Todo { title: String }

    // ⚠️ 한글은 UTF-8 에서 3바이트라 &s[0..1] 처럼 자르면 panic! 글자 단위는 chars() 사용
    let korean = "안녕하세요";
    println!("바이트 길이={}, 글자 수={}", korean.len(), korean.chars().count()); // 15, 5
    // Rust 문자열에는 Java 처럼 s.charAt(i) 가 없습니다 (UTF-8 이라 i번째 글자를 바로 찾을 수 없어서).

    // 자주 쓰는 &str 메서드 (actix 코드에 나오는 것 위주)
    let header = "Bearer my-token";
    if let Some(token) = header.strip_prefix("Bearer ") {
        // 📌 04_middleware
        println!("토큰 = {}", token);
    }
    println!("contains @ ? {}", "a@b.com".contains('@')); // 📌 07_error_handling
    println!("trim = '{}'", "  공백  ".trim());
    let parts: Vec<&str> = "a,b,c".split(',').collect();
    println!("split = {:?}", parts);

    // 배열/Vec 의 슬라이스는 &[T]  (Java 로 치면 List.subList 를 복사 없이)
    let nums = vec![10, 20, 30, 40];
    let middle: &[i32] = &nums[1..3]; // [20, 30]
    println!("middle = {:?}", middle);
    println!();
}

// -----------------------------------------------------------------------------
// 6. 라이프타임 기초 ('a, 'static)
// -----------------------------------------------------------------------------
// 라이프타임 = "이 참조가 언제까지 유효한가"를 나타내는 이름표입니다.
// 대부분은 컴파일러가 알아서 추론(생략 규칙)하므로 직접 쓸 일이 많지 않습니다.
//
// 직접 써야 하는 대표적인 경우: 참조를 2개 받아서 그중 하나를 돌려줄 때
// → 컴파일러는 "반환된 참조가 x 에서 온 건지 y 에서 온 건지" 모르니까 알려줘야 함
fn longer<'a>(x: &'a str, y: &'a str) -> &'a str {
    // <'a> : 'a 라는 라이프타임 이름을 선언 (제네릭처럼 꺾쇠 안에)
    // "x 와 y 와 반환값은 모두 'a 동안 유효하다"
    //  = "반환값은 x, y 중 더 짧게 사는 쪽만큼만 쓸 수 있다"
    if x.len() > y.len() { x } else { y }
}

// 'static : "프로그램이 끝날 때까지 유효" — 문자열 리터럴이 대표적 (바이너리에 박혀 있으니까)
// 📌 actix 07_error_handling:
//     fn error_type_str(&self) -> &'static str { match self { AppError::NotFound(_) => "NOT_FOUND", ... } }
//   → 리터럴만 돌려주니 'static. self 가 사라져도 반환된 문자열은 계속 쓸 수 있음.
fn status_text(code: u16) -> &'static str {
    match code {
        200 => "OK",
        404 => "NOT_FOUND",
        _ => "UNKNOWN",
    }
}

fn lifetimes_intro() {
    println!("--- 6. 라이프타임 기초 ---");

    let a = String::from("long string");
    let result;
    {
        let b = String::from("xyz");
        result = longer(a.as_str(), b.as_str());
        println!("더 긴 문자열 = {}", result); // ✅ b 가 살아있는 동안 사용
    }
    // println!("{}", result); // ❌ b 가 이미 drop 됐는데 result 가 b 를 가리킬 수도 있음 → 컴파일 에러

    println!("{}", status_text(404));

    // 💬 라이프타임은 처음엔 "컴파일러가 참조의 유효기간을 검사하는 장치" 정도로만 이해해도 충분합니다.
    //    에러가 나면 대부분 해결책은 ① 참조 대신 소유 타입(String)을 쓰거나 ② clone() 하는 것입니다.
    //    actix 코드에서 마주치는 건 거의 'static 뿐입니다. (spawn 에 넘기는 클로저가 'static 이어야 함 → ch13)
}

// =============================================================================
// 📝 정리
// =============================================================================
//   &x          빌려서 읽기 (여러 개 가능)
//   &mut x      빌려서 수정 (한 번에 하나만, 원본도 let mut 이어야)
//   *r          참조가 가리키는 값 자체 (메서드 호출 시엔 자동이라 생략)
//   &str        문자열 슬라이스 — 함수 인자로 받을 때 추천
//   String      소유 문자열 — 구조체 필드/반환값으로 보관할 때
//   &v[1..3]    슬라이스 (복사 없음)
//   'a          참조의 유효기간 이름표,  'static = 프로그램 끝까지
//
// 💬 Java 관점: "모든 객체를 아무 데서나 참조하고 아무 데서나 수정" → Rust 는
//    "읽는 사람 여럿 XOR 쓰는 사람 하나" 를 컴파일러가 강제. 처음엔 답답하지만
//    멀티스레드 웹 서버(actix)에서 동시성 버그를 원천 차단해 줍니다.
//
// ✏️ 직접 해보기
//   1. borrowing_rules() 의 ❌ 예시 코드를 실제로 넣어보고 에러 메시지를 확인하세요.
//   2. calculate_length 의 인자를 &String → &str 로 바꿔도 잘 동작하는지 확인해보세요.
// =============================================================================
