// =============================================================================
// 챕터 09: 클로저와 이터레이터 (Closures & Iterators)
// =============================================================================
// 실행: cargo run --bin ch09_closures_iterators
//
// 이 챕터에서 배울 것
//   1. 클로저 문법 |x| x + 1  — Java 의 람다 (x) -> x + 1
//   2. 환경 캡처: 빌려오기 vs move 로 소유권 가져오기
//   3. Fn / FnMut / FnOnce — 클로저를 인자로 받는 함수의 타입
//   4. ⭐ actix 의 HttpServer::new(move || App::new()...) 해석
//   5. 이터레이터: iter / iter_mut / into_iter 차이
//   6. map / filter / collect 등 — Java Stream API 와 1:1 비교
// =============================================================================

#![allow(dead_code, unused_variables)]

use std::collections::HashMap;

fn main() {
    println!("===== 챕터 09: 클로저와 이터레이터 =====\n");

    closure_syntax();
    capturing();
    fn_traits();
    actix_server_closure();
    iterator_kinds();
    iterator_adapters();
}

// -----------------------------------------------------------------------------
// 1. 클로저 문법
// -----------------------------------------------------------------------------
fn closure_syntax() {
    println!("--- 1. 클로저 문법 ---");

    //   Java:   Function<Integer, Integer> add1 = x -> x + 1;
    //   Rust:   let add1 = |x| x + 1;
    //
    // |매개변수| 본문 — 매개변수를 세로 막대 사이에 씁니다.
    let add1 = |x: i32| x + 1; // 타입 명시
    let add = |a, b| a + b; // 타입 추론 (첫 사용 시점에 결정됨)
    let say_hi = || println!("  안녕!"); // 매개변수 없음 → ||
    let complex = |x: i32| -> i32 {
        // 여러 줄이면 { } 블록. 마지막 표현식이 반환값
        let doubled = x * 2;
        doubled + 1
    };

    say_hi();
    println!("  add1(1)={}, add(2,3)={}, complex(5)={}\n", add1(1), add(2, 3), complex(5));

    // 📌 actix 코드의 클로저들
    //   HttpServer::new(|| { App::new()... })        ← 매개변수 없는 클로저
    //   .and_then(|v| v.to_str().ok())               ← 매개변수 v 하나
    //   .wrap_fn(|req, next| { ... })                ← 매개변수 둘
    //   .unwrap_or_else(|| "기존이름".to_string())   ← 필요할 때만 실행되는 기본값
}

// -----------------------------------------------------------------------------
// 2. 환경 캡처와 move
// -----------------------------------------------------------------------------
fn capturing() {
    println!("--- 2. 캡처와 move ---");

    // 클로저는 바깥 변수를 사용(캡처)할 수 있습니다. Java 람다처럼요.
    // 차이점: Java 는 "effectively final" 변수만 캡처 가능하지만,
    //         Rust 는 필요에 따라 &(빌림), &mut(가변 빌림), 소유권 이동 중 하나로 캡처합니다.

    // (a) 읽기만 → & 로 빌림
    let greeting = String::from("안녕");
    let print = || println!("  {}", greeting);
    print();
    println!("  원본도 사용 가능: {}", greeting);

    // (b) 수정 → &mut 로 빌림 (클로저 변수에도 mut 필요)
    let mut count = 0;
    let mut inc = || count += 1;
    inc();
    inc();
    println!("  count = {}", count);

    // (c) move → 소유권을 클로저 안으로 "이동"
    let name = String::from("철수");
    let owns = move || println!("  move 클로저: {}", name);
    owns();
    // println!("{}", name); // ❌ name 은 클로저로 이동했음

    // 🤔 move 는 언제 필요할까?
    //    클로저가 "지금 함수보다 더 오래 살아야" 할 때입니다.
    //    예) 다른 스레드에서 실행될 클로저, 나중에 실행될 비동기 작업
    //    빌린 참조(&)로 캡처하면 원본 함수가 끝나서 변수가 사라진 뒤에도 참조가 남게 되니까
    //    컴파일러가 막고 "move 를 붙이세요"라고 알려줍니다.
    let handle = std::thread::spawn(move || {
        // 이 스레드가 언제 끝날지 모르니, 쓸 데이터를 통째로 가져가야 함
        let data = vec![1, 2, 3];
        data.iter().sum::<i32>()
    });
    println!("  다른 스레드 결과: {}\n", handle.join().unwrap());
}

// -----------------------------------------------------------------------------
// 3. Fn / FnMut / FnOnce — 클로저를 받는 함수
// -----------------------------------------------------------------------------
// 클로저는 각각 고유한 익명 타입이라 이름을 쓸 수 없습니다.
// 그래서 "이런 호출이 가능한 무언가" 라는 트레이트로 받습니다. (Java 의 Function, Consumer, Supplier 역할)
//
//   Fn()      : 여러 번 호출 가능, 캡처한 것을 읽기만        (Supplier/Function 느낌)
//   FnMut()   : 여러 번 호출 가능, 캡처한 것을 수정함
//   FnOnce()  : 한 번만 호출 가능, 캡처한 것을 소비(move out)함
//
fn call_twice<F: Fn() -> i32>(f: F) -> i32 {
    f() + f()
}
fn call_and_modify<F: FnMut()>(mut f: F) {
    f();
    f();
}
fn call_once<F: FnOnce() -> String>(f: F) -> String {
    f()
}
// 클로저를 반환할 수도 있음 (impl Trait 활용)
fn make_multiplier(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x * n // n 을 move 로 가져가야 함 (n 은 이 함수가 끝나면 사라지므로)
}

fn fn_traits() {
    println!("--- 3. Fn / FnMut / FnOnce ---");
    let base = 10;
    println!("  call_twice: {}", call_twice(|| base));

    let mut log = Vec::new();
    call_and_modify(|| log.push("호출됨"));
    println!("  call_and_modify: {:?}", log);

    let s = String::from("소비될 문자열");
    println!("  call_once: {}", call_once(move || s)); // s 를 반환(소비)하니 FnOnce

    let triple = make_multiplier(3);
    println!("  make_multiplier(3)(7) = {}\n", triple(7));
}

// -----------------------------------------------------------------------------
// 4. ⭐ actix 의 HttpServer::new(move || ...) 해석
// -----------------------------------------------------------------------------
// actix 의 실제 시그니처를 단순화하면 이렇습니다:
//
//   impl HttpServer {
//       pub fn new<F>(factory: F) -> Self
//       where F: Fn() -> App + Send + Clone + 'static
//   }
//
//   - Fn() -> App  : "호출하면 App 을 만들어 주는 함수"를 받는다 (팩토리)
//   - 왜 함수를 받을까? 워커 스레드가 CPU 코어 수만큼 생기는데, 각 스레드마다
//     자기 App 인스턴스가 필요해서 이 클로저를 "스레드마다 한 번씩" 호출합니다.
//   - Send          : 다른 스레드로 보낼 수 있어야 함 (ch11)
//   - 'static       : 빌린 참조를 품으면 안 됨 → 그래서 move 가 필요!
//
// 📌 05_state:
//   let state = web::Data::new(AppState::new());     // Arc 로 감싼 공유 상태
//   HttpServer::new(move || {                        // state 의 소유권을 클로저로 이동
//       App::new().app_data(state.clone())           // 스레드마다 Arc 를 복제(참조 카운트+1)
//   })
//
// 왜 clone 이 필요할까? 클로저가 여러 번 호출되기 때문에(Fn),
// 클로저 안의 state 를 매번 "줘버리면(move)" 두 번째 호출 때 줄 게 없습니다.
// 그래서 매번 복제본(싼 Arc clone)을 만들어 넘기는 것입니다.

struct Worker {
    id: usize,
    app_name: String,
}

// actix 의 HttpServer::new 를 아주 단순하게 흉내
fn start_server<F>(factory: F)
where
    F: Fn(usize) -> Worker,
{
    for worker_id in 0..3 {
        let w = factory(worker_id); // 워커마다 팩토리 호출
        println!("  워커 {} 시작: {}", w.id, w.app_name);
    }
}

fn actix_server_closure() {
    println!("--- 4. HttpServer::new(move || ...) 흉내 ---");
    let app_name = String::from("Todo API");
    start_server(move |id| Worker {
        id,
        app_name: app_name.clone(), // 클로저가 여러 번 호출되므로 매번 clone
    });
    println!();
}

// -----------------------------------------------------------------------------
// 5. 이터레이터의 세 가지 얼굴
// -----------------------------------------------------------------------------
fn iterator_kinds() {
    println!("--- 5. iter / iter_mut / into_iter ---");

    let mut v = vec![String::from("a"), String::from("b")];

    // iter()      : 각 원소를 &T 로 빌려서 순회 → v 는 그대로
    for s in v.iter() {
        print!("  {} ", s);
    }
    println!();

    // iter_mut()  : 각 원소를 &mut T 로 → 제자리 수정
    for s in v.iter_mut() {
        s.push('!');
    }
    println!("  수정 후 {:?}", v);

    // into_iter() : 각 원소를 T 로 (소유권 이동) → v 는 소비되어 더 못 씀
    for s in v.into_iter() {
        print!("  {} ", s);
    }
    println!();
    // println!("{:?}", v); // ❌ v 는 이동됨

    // for 문의 축약:
    //   for x in &v      == for x in v.iter()
    //   for x in &mut v  == for x in v.iter_mut()
    //   for x in v       == for x in v.into_iter()
    println!();
}

// -----------------------------------------------------------------------------
// 6. 이터레이터 어댑터 — Java Stream 과 비교
// -----------------------------------------------------------------------------
#[derive(Debug, Clone)]
struct Todo {
    id: u64,
    title: String,
    completed: bool,
}

fn iterator_adapters() {
    println!("--- 6. map / filter / collect ... ---");

    let todos = vec![
        Todo { id: 1, title: "Rust 공부".into(), completed: true },
        Todo { id: 2, title: "actix 공부".into(), completed: false },
        Todo { id: 3, title: "운동".into(), completed: false },
    ];

    //   Java:
    //     List<String> titles = todos.stream()
    //         .filter(t -> !t.isCompleted())
    //         .map(Todo::getTitle)
    //         .collect(Collectors.toList());
    //
    //   Rust:
    let titles: Vec<&String> = todos
        .iter() //                      .stream()
        .filter(|t| !t.completed) //    .filter(...)    t 는 &&Todo (iter 의 &Todo 를 다시 빌림)
        .map(|t| &t.title) //           .map(...)
        .collect(); //                  .collect(...)  — 결과 타입은 변수 타입으로 결정
    println!("  미완료: {:?}", titles);

    // 💡 Java Stream 처럼 lazy 입니다: collect/sum/for 같은 "최종 연산" 전엔 아무것도 실행 안 됨

    // 자주 쓰는 것들
    let count = todos.iter().filter(|t| t.completed).count(); //            count()
    let ids: Vec<u64> = todos.iter().map(|t| t.id).collect();
    let sum: u64 = ids.iter().sum(); //                                      mapToLong().sum()
    let any_done = todos.iter().any(|t| t.completed); //                     anyMatch
    let all_done = todos.iter().all(|t| t.completed); //                     allMatch
    let first = todos.iter().find(|t| t.id == 2); //                         filter().findFirst() → Option
    let pos = todos.iter().position(|t| t.id == 3); //                       인덱스 찾기 → Option<usize>
    println!("  count={} ids={:?} sum={} any={} all={}", count, ids, sum, any_done, all_done);
    println!("  find={:?} position={:?}", first.map(|t| &t.title), pos);

    // 문자열로 합치기 (Collectors.joining)
    let joined = todos.iter().map(|t| t.title.as_str()).collect::<Vec<_>>().join(", ");
    println!("  joined = {}", joined);

    // HashMap 으로 모으기 (Collectors.toMap)
    let by_id: HashMap<u64, Todo> = todos.iter().map(|t| (t.id, t.clone())).collect();
    println!("  by_id[2] = {}", by_id[&2].title);

    // enumerate / zip / skip / take / rev / chain
    for (i, t) in todos.iter().enumerate().skip(1).take(1) {
        println!("  enumerate+skip+take: {} {}", i, t.title);
    }
    let pairs: Vec<(u64, char)> = ids.iter().copied().zip(['a', 'b', 'c']).collect();
    println!("  zip = {:?}", pairs);

    // fold: 누적 (reduce)
    let total_len = todos.iter().fold(0, |acc, t| acc + t.title.chars().count());
    println!("  fold(제목 글자 수 합) = {}", total_len);

    // 정렬은 이터레이터가 아니라 Vec 의 메서드 (제자리 정렬)
    let mut sorted = todos.clone();
    sorted.sort_by(|a, b| b.id.cmp(&a.id)); // id 내림차순 (Comparator)
    sorted.sort_by_key(|t| t.completed); // 키 기준
    println!("  sorted ids = {:?}", sorted.iter().map(|t| t.id).collect::<Vec<_>>());

    // 📌 actix 05_state:
    //   let todo_list: Vec<&Todo> = todos.values().collect();
    //   → HashMap 의 값들을 빌린 참조로 순회해서 Vec 으로 모음

    // filter_map: 변환 + 실패한 것 버리기 (Option 을 반환하는 map)
    let raw = ["1", "x", "3"];
    let nums: Vec<i32> = raw.iter().filter_map(|s| s.parse().ok()).collect();
    println!("  filter_map = {:?}", nums);

    // Result 들을 모으면서 하나라도 실패하면 전체 실패
    let all: Result<Vec<i32>, _> = raw.iter().map(|s| s.parse::<i32>()).collect();
    println!("  collect into Result = {:?}", all.is_err());
}

// =============================================================================
// 📝 정리
// =============================================================================
//   |a, b| a + b              클로저 (Java 람다)
//   move || ...               캡처한 변수의 소유권을 클로저로 이동 (스레드/비동기/'static)
//   F: Fn() / FnMut() / FnOnce()   클로저를 받는 제네릭 바운드
//   HttpServer::new(move || App::new().app_data(state.clone()))
//                             워커마다 호출되는 팩토리 → move + 매번 clone
//   .iter() / .iter_mut() / .into_iter()   &T / &mut T / T
//   map filter find any all count sum fold enumerate zip filter_map collect
//
// ✏️ 직접 해보기
//   1. actix_server_closure 에서 move 를 지우거나 .clone() 을 지우면 각각 어떤 에러가 나나요?
//   2. todos 에서 완료된 것들의 id 를 Vec<u64> 로 모아보세요.
// =============================================================================
