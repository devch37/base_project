// =============================================================================
// 챕터 13: 비동기 프로그래밍 (async / .await / tokio)  ⭐⭐
// =============================================================================
// 실행: cargo run --bin ch13_async_await
//
// 이 챕터에서 배울 것
//   1. 왜 비동기인가 — 스레드 하나로 수천 개의 요청을 처리
//   2. async fn 과 Future — "호출해도 바로 실행되지 않는다"
//   3. .await — 결과가 준비될 때까지 "양보"하며 기다리기
//   4. 런타임(tokio) 과 #[tokio::main] / #[actix_web::main]
//   5. spawn(async move { ... }) — 백그라운드 작업 (actix 08_advanced)
//   6. join! / select! — 여러 작업 동시에
//   7. 채널 mpsc / broadcast — 작업 간 메시지 전달 (08_advanced 의 SSE, 채팅)
//   8. 미들웨어의 `async move { fut.await? }` 해석 (04_middleware)
//   9. ⚠️ 비동기 코드에서 하면 안 되는 것들
//
// Java 와 비교
//   Java (전통적인 Spring MVC) : 요청 1개 = 스레드 1개. DB 기다리는 동안 스레드는 그냥 놀며 대기(blocking)
//   Java CompletableFuture     : thenApply/thenCompose 체인 → 콜백 지옥이 되기 쉬움
//   Java 21 Virtual Thread     : JVM 이 알아서 가벼운 스레드로 전환
//   Rust async/await           : 코드는 동기 코드처럼 쓰고, .await 지점에서 스레드를 다른 작업에 양보
//                                (Spring WebFlux 와 같은 목적, 문법은 JS/Kotlin 코루틴과 비슷)
// =============================================================================

#![allow(dead_code, unused_variables)]

use std::time::{Duration, Instant};
use tokio::sync::{broadcast, mpsc};
use tokio::time::sleep;

// -----------------------------------------------------------------------------
// 4. 런타임 — 먼저 main 부터 보기
// -----------------------------------------------------------------------------
// Rust 언어 자체에는 async "문법"만 있고, 그걸 실제로 실행해 주는 엔진(런타임)은 라이브러리입니다.
// 가장 유명한 런타임이 tokio 이고, actix-web 도 내부적으로 tokio 를 사용합니다.
//
// #[tokio::main] 은 대략 이렇게 펼쳐집니다:
//   fn main() {
//       tokio::runtime::Runtime::new().unwrap().block_on(async { ...원래 본문... })
//   }
// 📌 actix 의 #[actix_web::main] 도 같은 역할입니다. (actix 런타임 = tokio 기반)
#[tokio::main]
async fn main() {
    println!("===== 챕터 13: async / await =====\n");

    future_is_lazy().await;
    sequential_vs_concurrent().await;
    spawn_demo().await;
    select_demo().await;
    mpsc_channel_demo().await;
    broadcast_demo().await;
    middleware_style_demo().await;
    pitfalls();
}

// -----------------------------------------------------------------------------
// 1 & 2. async fn 과 Future — 호출만으로는 실행되지 않는다
// -----------------------------------------------------------------------------
// async fn 은 "결과를 바로 돌려주는 함수"가 아니라
// "나중에 실행하면 결과가 나오는 작업(Future)"을 돌려주는 함수입니다.
//
//   async fn fetch_user(id: u64) -> String
//   ≒ fn fetch_user(id: u64) -> impl Future<Output = String>
//
// Java 로 치면 CompletableFuture<String> 을 반환하는 것과 비슷한데, 결정적 차이:
//   Java CompletableFuture.supplyAsync(...) → 만드는 순간 다른 스레드에서 실행 시작
//   Rust Future                             → .await (또는 spawn) 하기 전까지 아무 일도 안 함 (lazy)
async fn fetch_user(id: u64) -> String {
    println!("    fetch_user({}) 실행 시작", id);
    sleep(Duration::from_millis(100)).await; // DB 조회를 흉내: 100ms 기다림 (스레드를 막지 않음)
    format!("user{}", id)
}

async fn future_is_lazy() {
    println!("--- 1/2. Future 는 lazy ---");

    let fut = fetch_user(1); // ← 아직 아무것도 출력되지 않음! Future 를 만들기만 함
    println!("  Future 생성 완료 (아직 실행 안 됨)");
    let user = fut.await; //    ← 여기서 비로소 실행. 끝날 때까지 이 함수는 "양보"하며 대기
    println!("  결과: {}", user);

    // ⚠️ .await 를 깜빡하면? → 컴파일러 경고: "unused implementor of `Future` that must be used"
    //    그리고 그 작업은 실행되지 않습니다. 비동기 코드에서 가장 흔한 실수!
    // ⚠️ .await 는 async 함수/블록 안에서만 쓸 수 있습니다.
    println!();
}

// -----------------------------------------------------------------------------
// 3 & 6. 순차 실행 vs 동시 실행 (join!)
// -----------------------------------------------------------------------------
async fn sequential_vs_concurrent() {
    println!("--- 3/6. 순차 vs 동시 (join!) ---");

    // 순차: 하나 끝나고 다음 → 약 200ms
    let start = Instant::now();
    let a = fetch_user(1).await;
    let b = fetch_user(2).await;
    println!("  순차: {}, {} → {}ms", a, b, start.elapsed().as_millis());

    // 동시: 둘 다 시작해 놓고 함께 기다림 → 약 100ms
    // (Java: CompletableFuture.allOf(f1, f2).join())
    let start = Instant::now();
    let (a, b) = tokio::join!(fetch_user(3), fetch_user(4));
    println!("  동시: {}, {} → {}ms", a, b, start.elapsed().as_millis());

    // 💡 어떻게 스레드 하나로 동시에? .await 지점에서 "나 기다리는 중이니 다른 일 해"라고 양보하면,
    //    런타임이 그 사이 다른 Future 를 진행시킵니다. 웹 서버가 적은 스레드로 많은 요청을 처리하는 원리.
    println!();
}

// -----------------------------------------------------------------------------
// 5. spawn(async move { ... }) — 백그라운드 태스크
// -----------------------------------------------------------------------------
async fn spawn_demo() {
    println!("--- 5. tokio::spawn(async move {{ ... }}) ---");

    // spawn: Future 를 런타임에 맡겨 "독립적으로" 실행 (Java: executor.submit(...))
    //        현재 함수가 기다리지 않아도 알아서 진행됩니다.
    //        반환값 JoinHandle 을 .await 하면 결과를 받을 수 있음 (Future.get())
    //
    // async move { ... } : 비동기 블록 + 캡처한 변수의 소유권을 블록 안으로 이동
    //   - 왜 move? spawn 된 작업은 현재 함수보다 오래 살 수 있음 → 빌린 참조는 안 됨 ('static 필요)
    //   - ch09 의 thread::spawn(move || ...) 과 같은 이유입니다.
    let name = String::from("작업A");
    let handle = tokio::spawn(async move {
        sleep(Duration::from_millis(50)).await;
        format!("{} 완료", name) // name 은 이 블록이 소유
    });
    // println!("{}", name); // ❌ name 은 이동됨

    println!("  spawn 직후: 메인은 계속 진행 중...");
    let result = handle.await.unwrap(); // JoinHandle 의 결과는 Result (작업이 panic 했을 수 있으니까)
    println!("  {}", result);

    // 📌 actix 08_advanced 의 WebSocket 핸들러:
    //     actix_web::rt::spawn(async move {
    //         while let Some(msg) = msg_stream.next().await { ... }   // 메시지를 계속 처리
    //     });
    //     Ok(response)   // ← spawn 해놓고 핸들러는 즉시 응답 반환!
    //
    //   핸들러는 "WebSocket 업그레이드 응답"을 바로 돌려줘야 하고,
    //   메시지 주고받기는 연결이 끊길 때까지 계속돼야 하니 백그라운드 태스크로 넘긴 것입니다.
    //   session, msg_stream 의 소유권을 그 태스크로 move 해야 하므로 async move.
    println!();
}

// -----------------------------------------------------------------------------
// 6. select! — 먼저 끝나는 것 하나만
// -----------------------------------------------------------------------------
async fn select_demo() {
    println!("--- 6. select! (타임아웃 패턴) ---");

    // 여러 Future 중 가장 먼저 끝나는 것의 결과만 쓰고, 나머지는 취소
    // (Java: CompletableFuture.anyOf, 또는 orTimeout)
    tokio::select! {
        user = fetch_user(9) => println!("  응답 도착: {}", user),
        _ = sleep(Duration::from_millis(30)) => println!("  ⏰ 30ms 타임아웃! (fetch_user 는 취소됨)"),
    }

    // 타임아웃은 전용 함수도 있음
    match tokio::time::timeout(Duration::from_millis(200), fetch_user(10)).await {
        Ok(u) => println!("  timeout 안에 성공: {}", u),
        Err(_) => println!("  타임아웃"),
    }
    println!();
}

// -----------------------------------------------------------------------------
// 7. 채널 — 작업 간 메시지 전달
// -----------------------------------------------------------------------------
// mpsc = multi-producer, single-consumer: 여러 곳에서 보내고(tx), 한 곳에서 받음(rx)
// (Java: BlockingQueue 와 비슷하지만 대기할 때 스레드를 막지 않음)
async fn mpsc_channel_demo() {
    println!("--- 7-1. mpsc 채널 (SSE 패턴) ---");

    // channel::<타입>(버퍼 크기) → (보내는 쪽, 받는 쪽) 튜플
    // 📌 08_advanced:  let (tx, rx) = tokio::sync::mpsc::channel::<Result<web::Bytes, actix_web::Error>>(10);
    let (tx, mut rx) = mpsc::channel::<String>(10);

    // 생산자: 백그라운드에서 이벤트를 만들어 보냄 (08_advanced 의 sse_counter 와 같은 구조)
    tokio::spawn(async move {
        for i in 1..=3 {
            let event = format!("data: count={}\n\n", i);
            // send 는 버퍼가 가득 차면 기다림 → .await
            // 받는 쪽이 사라졌으면(클라이언트 연결 끊김) Err → 루프 종료
            if tx.send(event).await.is_err() {
                break;
            }
            sleep(Duration::from_millis(20)).await;
        }
        // 블록이 끝나면 tx 가 drop → 채널 닫힘 → 받는 쪽 recv() 가 None 반환
    });

    // 소비자: 채널이 닫힐 때까지 받기 — while let (ch06)
    // 📌 actix 에서는 ReceiverStream::new(rx) 로 감싸 HTTP 응답 스트림으로 흘려보냅니다.
    while let Some(event) = rx.recv().await {
        println!("  받음: {:?}", event); // {:?} 로 찍으면 \n 이 그대로 보여서 SSE 형식을 확인하기 좋음
    }
    println!("  채널 닫힘 → 루프 종료\n");
}

async fn broadcast_demo() {
    println!("--- 7-2. broadcast 채널 (채팅 패턴) ---");

    // broadcast: 보낸 메시지를 "모든" 구독자가 받음 (Pub/Sub)
    // 📌 08_advanced 의 채팅방:
    //     let (chat_tx, _) = broadcast::channel::<ChatMessage>(100);
    //     let mut rx = chat_tx.subscribe();       // 접속자마다 구독
    //     while let Ok(msg) = rx.recv().await { session.text(...).await }
    let (tx, _) = broadcast::channel::<String>(16);

    let mut handles = vec![];
    for user in ["철수", "영희"] {
        let mut rx = tx.subscribe(); // 사용자마다 수신기
        handles.push(tokio::spawn(async move {
            // broadcast 의 recv 는 Result: 송신자가 모두 사라지면 Err(Closed) → 루프 종료
            while let Ok(msg) = rx.recv().await {
                println!("  [{} 화면] {}", user, msg);
            }
        }));
    }

    tx.send("민수: 안녕하세요!".to_string()).unwrap();
    tx.send("민수: 다들 반가워요".to_string()).unwrap();
    drop(tx); // 송신자 정리 → 구독자들의 루프 종료

    for h in handles {
        h.await.unwrap();
    }
    println!();
}

// -----------------------------------------------------------------------------
// 8. 미들웨어 스타일: Future 를 받아서 감싸기
// -----------------------------------------------------------------------------
// 📌 04_middleware:
//     .wrap_fn(|req, next| {
//         // (A) 요청 전처리 — 동기 코드
//         ...
//         let fut = next.call(req);    // (B) 다음 단계(핸들러)를 실행할 Future 를 "만들기만" 함
//         async move {                 // (C) 이 클로저는 Future 를 반환해야 함 → async 블록
//             let res = fut.await?;    // (D) 실제로 핸들러 실행을 기다림. 에러면 ? 로 전파
//             Ok(res)                  // (E) 응답 후처리 후 반환
//         }
//     })
//
// 왜 async move 블록이 따로 있을까?
//   wrap_fn 의 클로저 자체는 async 가 아닌 일반 클로저라 안에서 .await 를 못 씁니다.
//   그래서 "기다리는 부분"을 async 블록으로 감싸 Future 로 돌려주는 것입니다.
//   fut 를 블록 안으로 옮겨야(소유) 하니까 move.

// next.call(req) 흉내: 요청을 받아 Future 를 돌려주는 핸들러
async fn handler(path: String) -> Result<String, String> {
    if path == "/error" {
        Err("핸들러 에러".to_string())
    } else {
        Ok(format!("200 OK ({})", path))
    }
}

// wrap_fn 흉내: "일반 함수"가 Future 를 반환 (impl Future — ch08 의 impl Trait!)
fn logging_middleware(path: String) -> impl std::future::Future<Output = Result<String, String>> {
    println!("  → 요청 들어옴: {}", path); // 전처리 (동기)
    let fut = handler(path); //               Future 만들기 (아직 실행 X)
    async move {
        let start = Instant::now();
        let res = fut.await?; //              실행 + 에러 전파
        println!("  ← 처리 시간 {}µs", start.elapsed().as_micros()); // 후처리
        Ok(format!("{} [X-Logged: true]", res))
    }
}

async fn middleware_style_demo() {
    println!("--- 8. 미들웨어 스타일 (async move {{ fut.await? }}) ---");
    println!("  결과: {:?}", logging_middleware("/todos".to_string()).await);
    println!("  결과: {:?}", logging_middleware("/error".to_string()).await);
    println!();
}

// -----------------------------------------------------------------------------
// 9. ⚠️ 비동기 코드의 함정
// -----------------------------------------------------------------------------
fn pitfalls() {
    println!("--- 9. 주의사항 (주석 참고) ---");
    // ① async 안에서 블로킹 함수 호출 금지
    //    std::thread::sleep(...)       ❌ → tokio::time::sleep(...).await   ✅
    //    std::fs::read_to_string(...)  ⚠️ → tokio::fs::read_to_string(...).await
    //    무거운 CPU 계산               ⚠️ → tokio::task::spawn_blocking(|| ...)
    //    이유: 워커 스레드가 몇 개 안 되는데 하나를 막아버리면 그 스레드의 모든 요청이 멈춤.
    //    (Spring WebFlux 에서 블로킹 JDBC 를 쓰면 안 되는 것과 같은 이유)
    //    → 그래서 06_database 는 비동기 DB 드라이버인 sqlx 를 사용하고 .await 합니다.
    //
    // ② std::sync::MutexGuard 를 잡은 채로 .await 하지 않기
    //      let guard = state.todos.lock().unwrap();
    //      some_io().await;      ❌ 잠금을 쥔 채 양보 → 다른 작업들이 줄줄이 대기 (+ Send 아님 → 컴파일 에러)
    //    잠금은 블록 { } 으로 짧게 잡고, .await 전에 풀기. (05_state 가 그렇게 되어 있음)
    //    정말 await 너머로 잡아야 하면 tokio::sync::Mutex 사용.
    //
    // ③ spawn 하는 Future 는 'static + Send 여야 함 → 빌린 참조 대신 async move 로 소유권 이동,
    //    공유 데이터는 Arc 로 감싸서 clone 해서 넘기기.
    println!("  ① 블로킹 금지  ② 잠금 쥔 채 await 금지  ③ spawn 엔 async move + Arc");
}

// =============================================================================
// 📝 정리
// =============================================================================
//   async fn f() -> T          호출하면 Future<Output = T> 반환 (lazy)
//   f().await                  실행하고 결과 기다림 (async 안에서만)
//   #[tokio::main] / #[actix_web::main]   async main 을 런타임 위에서 실행
//   tokio::spawn(async move { })          백그라운드 태스크 (actix_web::rt::spawn)
//   tokio::join!(a, b)                    동시에 실행, 모두 기다림
//   tokio::select! { .. }                 먼저 끝나는 것 하나
//   mpsc::channel(n) → (tx, rx)           tx.send(x).await / rx.recv().await → Option
//   broadcast::channel(n)                 tx.subscribe() 로 구독자마다 rx
//   while let Some(x) = rx.recv().await   채널/스트림 소비 패턴
//   fn mw() -> impl Future { let f = ..; async move { f.await? ; .. } }   미들웨어 패턴
//
// ✏️ 직접 해보기
//   1. future_is_lazy 에서 fut.await 줄을 지우면 fetch_user 의 출력이 나오나요? 경고는?
//   2. sequential_vs_concurrent 를 fetch_user 3개로 늘려 시간 차이를 확인해보세요.
// =============================================================================
