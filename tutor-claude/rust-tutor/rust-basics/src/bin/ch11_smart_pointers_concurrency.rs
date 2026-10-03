// =============================================================================
// 챕터 11: 스마트 포인터와 동시성 (Box, Rc, Arc, Mutex, Send/Sync)  ⭐⭐
// =============================================================================
// 실행: cargo run --bin ch11_smart_pointers_concurrency
//
// 이 챕터에서 배울 것
//   1. Box<T>   — 값을 힙에 두기
//   2. Rc<T>    — 주인이 여러 명 필요할 때 (참조 카운트, 단일 스레드)
//   3. RefCell<T> — 불변 참조로도 내부 수정 (런타임 빌림 검사)
//   4. Arc<T>   — 스레드 간 공유하는 Rc  → actix 의 web::Data<T>
//   5. Mutex<T> — 스레드 간 안전한 수정   → actix 05_state
//   6. RwLock<T>, 원자적 타입(AtomicU64)
//   7. Send / Sync — 컴파일러가 스레드 안전성을 검사하는 방법
//
// 🤔 왜 필요한가?
//   ch03 에서 "값의 주인은 하나"라고 했습니다. 그런데 웹 서버에서는
//   여러 워커 스레드가 "같은" AppState 를 동시에 봐야 합니다. 주인이 여럿이어야 하죠.
//   Java 에서는 그냥 같은 객체 참조를 여러 스레드에 넘기면 됐지만(대신 동기화는 알아서),
//   Rust 에서는 "공유 소유(Arc)"와 "동기화(Mutex)"를 타입으로 명확히 표현해야 합니다.
// =============================================================================

#![allow(dead_code, unused_variables)]

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use std::thread;

fn main() {
    println!("===== 챕터 11: 스마트 포인터와 동시성 =====\n");

    box_demo();
    rc_demo();
    refcell_demo();
    arc_mutex_demo();
    actix_state_simulation();
    rwlock_atomic_demo();
    send_sync_notes();
}

// -----------------------------------------------------------------------------
// 1. Box<T> — 힙에 할당
// -----------------------------------------------------------------------------
// Java 에서는 모든 객체가 힙(new)에 있지만, Rust 는 기본이 스택입니다.
// 힙에 두고 싶을 때 Box::new(값). Box 가 drop 되면 힙 메모리도 해제됩니다.
//
// 언제 쓰나?
//   - 크기를 컴파일 시점에 알 수 없는 타입: Box<dyn Trait> (ch08)
//   - 재귀 타입(자기 자신을 필드로 가지는 타입) — 아래 예
#[derive(Debug)]
enum List {
    Node(i32, Box<List>), // Box 없이 List 를 직접 넣으면 크기가 무한대가 되어 컴파일 불가
    Nil,
}

fn box_demo() {
    println!("--- 1. Box<T> ---");
    let b = Box::new(5); // 5 가 힙에 저장됨
    println!("  b = {} (자동 역참조)", b);
    let list = List::Node(1, Box::new(List::Node(2, Box::new(List::Nil))));
    println!("  list = {:?}\n", list);
}

// -----------------------------------------------------------------------------
// 2. Rc<T> — 공유 소유 (Reference Counted)
// -----------------------------------------------------------------------------
fn rc_demo() {
    println!("--- 2. Rc<T> ---");

    // Rc::new 로 감싸면, clone 할 때마다 "데이터 복사" 없이 참조 카운트만 +1
    // 마지막 Rc 가 drop 되어 카운트가 0 이 되면 그때 데이터가 해제됩니다.
    // (Java GC 의 "참조가 없어지면 정리"를 카운트로 구현한 것. 단, 순환 참조는 해제 못 함)
    let config = Rc::new(String::from("공유 설정"));
    println!("  카운트 = {}", Rc::strong_count(&config)); // 1

    let a = Rc::clone(&config); // config.clone() 과 같음. 관례적으로 Rc::clone 으로 써서 "싼 복사"임을 드러냄
    {
        let b = Rc::clone(&config);
        println!("  카운트 = {}", Rc::strong_count(&config)); // 3
    } // b drop → 카운트 2
    println!("  카운트 = {}, a = {}", Rc::strong_count(&config), a);

    //      config ─┐
    //      a ──────┼──▶ [ count=2 | "공유 설정" ]   (힙에 하나만 존재)
    //
    // ⚠️ Rc 는 읽기 전용 공유입니다. Rc<String> 안의 String 을 수정할 수 없어요.
    //    (주인이 여럿인데 아무나 수정하면 빌림 규칙 "쓰는 사람은 혼자"가 깨지니까)
    // ⚠️ Rc 는 스레드 간 공유 불가 (카운트 증가가 원자적이지 않음) → 스레드 간에는 Arc
    println!();
}

// -----------------------------------------------------------------------------
// 3. RefCell<T> — 내부 가변성 (단일 스레드)
// -----------------------------------------------------------------------------
fn refcell_demo() {
    println!("--- 3. RefCell<T> ---");

    // 빌림 규칙 검사를 컴파일 타임 → 런타임으로 미룹니다.
    // borrow()     : 읽기 빌림 (&T 처럼)
    // borrow_mut() : 쓰기 빌림 (&mut T 처럼) — 이미 다른 빌림이 살아 있으면 panic!
    let shared = Rc::new(RefCell::new(vec![1, 2]));
    let other = Rc::clone(&shared);
    other.borrow_mut().push(3); // Rc 로 공유하면서도 수정 가능
    println!("  {:?}", shared.borrow());

    // Rc<RefCell<T>>  (단일 스레드: 공유 + 수정)
    // Arc<Mutex<T>>   (멀티 스레드: 공유 + 수정)  ← 아래에서. 구조가 똑같습니다!
    println!();
}

// -----------------------------------------------------------------------------
// 4. Arc<T> + Mutex<T> — 멀티스레드 공유 + 수정
// -----------------------------------------------------------------------------
fn arc_mutex_demo() {
    println!("--- 4. Arc<Mutex<T>> ---");

    //   Arc   = Atomic Reference Counted. 스레드 안전한 Rc  → "여러 스레드가 함께 소유"
    //   Mutex = 상호 배제 잠금                              → "한 번에 한 스레드만 수정"
    //
    //   Java:
    //     class Counter { private int value; synchronized void inc() { value++; } }
    //     Counter c = new Counter();  // 여러 스레드에 그냥 넘김
    //
    //   Rust:
    //     let c = Arc::new(Mutex::new(0));  // 데이터가 잠금 "안에" 들어있음!
    //
    //   ⭐ 핵심 차이: Java 는 잠금과 데이터가 따로라서, synchronized 를 깜빡하면 그냥 버그.
    //      Rust 의 Mutex<T> 는 데이터를 잠금 안에 가둬서, lock() 을 하지 않으면
    //      데이터에 "접근하는 방법 자체가 없습니다". 실수가 컴파일 단계에서 불가능.
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..5 {
        let counter = Arc::clone(&counter); // 스레드마다 Arc 복제 (카운트+1). 섀도잉!
        let h = thread::spawn(move || {
            // move: 복제한 Arc 의 소유권을 스레드로 가져감
            for _ in 0..1000 {
                // lock(): 잠금 획득. 다른 스레드가 잡고 있으면 풀릴 때까지 대기
                //         반환값은 Result<MutexGuard<i32>, PoisonError> → unwrap
                let mut guard = counter.lock().unwrap();
                *guard += 1; // MutexGuard 는 &mut i32 처럼 동작 → * 로 값 수정
            } // ← guard 가 drop 되면서 잠금 자동 해제 (RAII, ch03)
        });
        handles.push(h);
    }

    for h in handles {
        h.join().unwrap(); // 모든 스레드가 끝날 때까지 대기 (Thread.join)
    }
    println!("  최종 카운트 = {} (5 스레드 × 1000)\n", *counter.lock().unwrap());
}

// -----------------------------------------------------------------------------
// 5. 🎯 actix 05_state 를 스레드로 흉내 내기
// -----------------------------------------------------------------------------
#[derive(Debug, Clone)]
struct Todo {
    id: u64,
    title: String,
}

// 05_state 의 AppState 와 같은 구조
struct AppState {
    todos: Mutex<HashMap<u64, Todo>>, // 수정되는 데이터 → Mutex
    next_id: Mutex<u64>,              // 수정되는 데이터 → Mutex
    app_name: String,                 // 읽기만 하는 데이터 → Mutex 필요 없음
}

// 05_state 의 create_todo 핸들러와 같은 로직
fn create_todo(state: &AppState, title: String) -> Todo {
    // ① id 발급: 블록으로 잠금 범위를 최소화 (ch02 블록 표현식)
    let id = {
        let mut next_id = state.next_id.lock().unwrap();
        let id = *next_id;
        *next_id += 1;
        id
    }; // ← next_id 잠금 해제. 아래에서 todos 잠금을 잡는 동안 next_id 는 다른 스레드가 쓸 수 있음

    // ② 저장
    let todo = Todo { id, title };
    let mut todos = state.todos.lock().unwrap();
    todos.insert(id, todo.clone()); // HashMap 이 소유할 복제본을 넣고
    todo //                            원본은 반환 (= actix 에서는 JSON 응답)
} // ← todos 잠금 해제

fn actix_state_simulation() {
    println!("--- 5. actix 05_state 흉내 ---");

    // actix:  let state = web::Data::new(AppState::new());
    //         web::Data<T> 는 내부적으로 Arc<T> 입니다. 그래서 여기서는 Arc 로.
    let state = Arc::new(AppState {
        todos: Mutex::new(HashMap::new()),
        next_id: Mutex::new(1),
        app_name: "Todo API".to_string(),
    });

    // actix:  HttpServer::new(move || App::new().app_data(state.clone()))
    //         워커 스레드마다 state 의 Arc 복제본을 받음
    let mut workers = vec![];
    for w in 0..4 {
        let state = Arc::clone(&state);
        workers.push(thread::spawn(move || {
            // 각 "요청"을 처리하는 핸들러 호출
            let t = create_todo(&state, format!("워커{}의 할 일", w));
            // &state : Arc<AppState> 를 &AppState 로 (자동 역참조)
            println!("  [{}] 워커 {} 가 생성: {:?}", state.app_name, w, t);
        }));
    }
    for h in workers {
        h.join().unwrap();
    }

    let todos = state.todos.lock().unwrap();
    let mut ids: Vec<&u64> = todos.keys().collect();
    ids.sort();
    println!("  저장된 id = {:?} (중복 없음 = 동시성 안전)\n", ids);

    // 💡 MutexGuard 를 .await 너머로 들고 있으면 안 됩니다 (비동기 코드에서 교착/컴파일 에러 원인).
    //    05_state 의 핸들러들이 lock() 후 바로 처리하고 반환하는 것도 그 때문입니다.
}

// -----------------------------------------------------------------------------
// 6. RwLock 과 원자적 타입
// -----------------------------------------------------------------------------
fn rwlock_atomic_demo() {
    println!("--- 6. RwLock / Atomic ---");

    // RwLock: 읽기는 여러 스레드 동시에, 쓰기는 하나만 (Java ReentrantReadWriteLock)
    //         읽기가 대부분인 설정/캐시에 적합
    let config = Arc::new(RwLock::new(String::from("v1")));
    {
        let r1 = config.read().unwrap();
        let r2 = config.read().unwrap(); // 읽기 잠금은 동시에 여러 개 OK
        println!("  read: {} {}", *r1, *r2);
    }
    *config.write().unwrap() = String::from("v2");
    println!("  write 후: {}", config.read().unwrap());

    // AtomicU64: 숫자 하나만 다룰 때는 Mutex 보다 가볍고 빠름 (Java AtomicLong)
    let next_id = Arc::new(AtomicU64::new(1));
    let id = next_id.fetch_add(1, Ordering::SeqCst); // getAndIncrement
    println!("  발급 id = {}, 다음 = {}\n", id, next_id.load(Ordering::SeqCst));
    // 05_state 의 next_id: Mutex<u64> 는 AtomicU64 로 바꿔도 됩니다 (연습해보세요)
}

// -----------------------------------------------------------------------------
// 7. Send / Sync
// -----------------------------------------------------------------------------
fn send_sync_notes() {
    println!("--- 7. Send / Sync ---");
    // 이 둘은 "표시용 트레이트(marker trait)"로, 컴파일러가 자동으로 붙여줍니다.
    //
    //   Send : 이 값을 다른 스레드로 "보내도(소유권 이동)" 안전하다
    //   Sync : 이 값을 여러 스레드가 "&로 동시에 봐도" 안전하다
    //
    //   Rc<T>         → Send ❌  (카운트 증가가 원자적이지 않아서)
    //   Arc<T>        → Send ✅
    //   RefCell<T>    → Sync ❌
    //   Mutex<T>      → Sync ✅
    //
    // 그래서 아래 코드는 컴파일이 안 됩니다:
    //   let rc = Rc::new(1);
    //   thread::spawn(move || println!("{}", rc));
    //   error[E0277]: `Rc<i32>` cannot be sent between threads safely
    //
    // Java 에서는 HashMap 을 여러 스레드에서 쓰다가 운영 중에 터지는 버그를,
    // Rust 는 "그 타입은 스레드 간에 못 보내요"라고 컴파일 때 막아버립니다.
    // 📌 actix 의 HttpServer::new 클로저와 app_data 가 Send + 'static 을 요구하는 이유입니다.
    //    AppState 안에 Rc 나 RefCell 을 넣으면 컴파일 에러가 납니다 → Arc, Mutex 를 쓰세요.
    println!("  (주석을 읽어보세요)");
}

// =============================================================================
// 📝 정리
// =============================================================================
//                단일 스레드          멀티 스레드
//   힙에 두기     Box<T>               Box<T>
//   공유 소유     Rc<T>                Arc<T>          ← clone 은 카운트만 +1 (싸다)
//   공유+수정     Rc<RefCell<T>>       Arc<Mutex<T>> / Arc<RwLock<T>>
//
//   mutex.lock().unwrap()  → MutexGuard (스코프 끝나면 자동 unlock)
//   *guard += 1            → 가드를 통해 값 수정
//   web::Data<T>           = Arc<T>  (actix)
//   잠금은 { } 블록으로 짧게!
//
// ✏️ 직접 해보기
//   1. AppState 의 next_id 를 AtomicU64 로 바꿔 create_todo 를 다시 써보세요.
//   2. arc_mutex_demo 에서 Arc 대신 Rc 를 써서 어떤 에러가 나는지 보세요.
// =============================================================================
