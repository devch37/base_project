# 🦀 Rust 기초 문법 — Java 개발자를 위한 가이드

`actix-web-tutorial`을 읽기 전에 필요한 Rust 문법을 **Java와 비교하며** 정리한 프로젝트입니다.
모든 챕터는 **실행 가능한 코드 + 한글 주석**으로 되어 있고, 각 개념이 actix 코드의 **어디에** 나오는지 `📌` 표시로 연결해 두었습니다.

> 💡 목표: 이 과정을 마치면 `actix-web-tutorial`의 모든 코드를 한 줄씩 "왜 이렇게 썼는지" 설명할 수 있게 됩니다.

---

## 🚀 실행 방법

```bash
cd rust-tutor/rust-basics

cargo run --bin ch01_variables_types        # 챕터 실행
cargo test --bin ex01_basics                # 연습문제 채점
cargo test --bin ex01_basics grade          # 특정 문제만 채점
```

> ⚠️ asdf로 Rust를 설치했다면 이 폴더의 `.tool-versions`(rust 1.93.0) 덕분에 `cargo`가 바로 동작합니다.
> `actix-web-tutorial`에서 `No version is set for command cargo` 에러가 나면 그 폴더에도 같은 파일을 두거나 `asdf set rust 1.93.0`을 실행하세요.

---

## 📚 학습 로드맵

### 1단계: 기초 — "Java와 비슷한데 조금 다른 것들"
| 챕터 | 주제 | 핵심 | actix에서 만나는 곳 |
|---|---|---|---|
| [ch01](src/bin/ch01_variables_types.rs) | 변수와 타입 | `let`/`mut`, 섀도잉, `u64`/`u8`, 튜플, `{:?}` | `let name = name.into_inner();` |
| [ch02](src/bin/ch02_functions_control_flow.rs) | 함수와 제어 흐름 | ⭐ **세미콜론 없는 마지막 줄 = 반환값**, 블록 표현식 | 모든 핸들러의 마지막 줄, `let id = { ... };` |

### 2단계: Rust만의 핵심 — "GC 없이 메모리 안전하게" ⭐⭐⭐
| 챕터 | 주제 | 핵심 | actix에서 만나는 곳 |
|---|---|---|---|
| [ch03](src/bin/ch03_memory_ownership.rs) | 메모리와 소유권 | 스택/힙, move, `clone()`, drop(RAII) | `todos.insert(id, todo.clone())`, 잠금 자동 해제 |
| [ch04](src/bin/ch04_borrowing_references.rs) | 빌림과 참조 | `&`/`&mut`, 빌림 규칙, `*`, `String` vs `&str`, `'static` | `todos.get(&id)`, `*next_id += 1`, `&'static str` |

### 3단계: 타입으로 설계하기
| 챕터 | 주제 | 핵심 | actix에서 만나는 곳 |
|---|---|---|---|
| [ch05](src/bin/ch05_structs_methods.rs) | 구조체와 메서드 | `impl`, `new()`, `&self`/`&mut self`/`self`, 빌더 | `AppState::new()`, `HttpResponse::Ok().json(..)` |
| [ch06](src/bin/ch06_enums_pattern_matching.rs) | enum과 패턴 매칭 | `Option`(null 없음), `match`, `if let`, `while let` | `match todos.get(&id) { Some/None }` |
| [ch07](src/bin/ch07_error_handling.rs) | 에러 처리 | `Result`, `?`, `From`, 커스텀 에러 | `Result<impl Responder, AppError>`, `thiserror` |
| [ch08](src/bin/ch08_traits_generics.rs) | 트레이트와 제네릭 | interface, `impl Trait`, `dyn`, `derive`, `::<>` | ⭐ **`-> impl Responder`의 정체** (미니 actix 직접 구현) |

### 4단계: 웹 서버를 위한 도구
| 챕터 | 주제 | 핵심 | actix에서 만나는 곳 |
|---|---|---|---|
| [ch09](src/bin/ch09_closures_iterators.rs) | 클로저와 이터레이터 | `\|x\|`, `move`, `Fn`, map/filter/collect | ⭐ `HttpServer::new(move \|\| ...)` |
| [ch10](src/bin/ch10_collections_strings.rs) | 컬렉션과 문자열 | `Vec`, `HashMap`, entry API, 문자열 변환 | 05_state의 인메모리 저장소 |
| [ch11](src/bin/ch11_smart_pointers_concurrency.rs) | 스마트 포인터와 동시성 | `Box`/`Rc`/`Arc`, `Mutex`, `Send`/`Sync` | ⭐ `web::Data<T>` = `Arc<T>`, `Mutex<HashMap>` |
| [ch12](src/bin/ch12_modules_macros_attributes.rs) | 모듈, 매크로, 어트리뷰트 | `mod`/`use`, `!`, `#[...]`, serde, 테스트 | `#[get("/")]`, `#[derive(Serialize)]`, `json!` |
| [ch13](src/bin/ch13_async_await.rs) | 비동기 | `async`/`.await`, tokio, spawn, 채널 | `#[actix_web::main]`, `spawn(async move {..})` |

### 5단계: 연결하기
| 문서 | 내용 |
|---|---|
| [ACTIX_DECODER.md](ACTIX_DECODER.md) | actix 실제 코드를 한 줄씩 해부. 각 문법이 몇 챕터 내용인지 표시 |

### ✏️ 연습문제
| 파일 | 범위 | 내용 |
|---|---|---|
| [ex01_basics](src/bin/ex01_basics.rs) | ch01~04 | 함수, match, 문자열 빌림, 슬라이스 (7문제) |
| [ex02_types](src/bin/ex02_types.rs) | ch05~08 | 은행 계좌 도메인: struct, 에러 enum, `?`, trait (6문제) |
| [ex03_web_ready](src/bin/ex03_web_ready.rs) | ch09~13 | 프레임워크 없이 Todo API 핵심 로직 구현: Mutex 저장소, serde, async (7문제) |

정답 예시는 [`solutions/`](solutions/)에 있습니다. 먼저 직접 풀어보세요!

---

## ☕ Java → Rust 치트시트

### 기본 문법
| Java | Rust | 비고 |
|---|---|---|
| `final int x = 5;` | `let x = 5;` | Rust는 **불변이 기본** |
| `int x = 5;` (변경 가능) | `let mut x = 5;` | |
| `long id` | `id: u64` | `이름: 타입` 순서 |
| `void` | `()` | 유닛 타입 |
| `return a + b;` | `a + b` | 마지막 줄 세미콜론 없음 |
| `cond ? a : b` | `if cond { a } else { b }` | if가 값을 가짐 |
| `for (int i=0; i<n; i++)` | `for i in 0..n` | |
| `switch` | `match` | 모든 경우 처리 강제 |
| `String.format("%s", x)` | `format!("{}", x)` | |
| `System.out.println` | `println!` | |

### 객체지향
| Java | Rust |
|---|---|
| `class User { ... }` | `struct User { ... }` + `impl User { ... }` |
| 생성자 `new User()` | 관례상 `User::new()` (그냥 함수) |
| `static` 메서드 | 연관 함수 `fn f() -> ..` → `User::f()` |
| `this` | `self` (`&self`, `&mut self`, `self`) |
| `interface` | `trait` |
| `implements` | `impl Trait for Type` |
| `extends` (상속) | ❌ 없음. 트레이트 + 조합(composition) |
| `@Override toString()` | `impl Display` |
| Lombok `@ToString @EqualsAndHashCode` | `#[derive(Debug, PartialEq, Hash)]` |
| 어노테이션 `@GetMapping` | 어트리뷰트 `#[get("/")]` |
| `<T extends Comparable>` | `<T: PartialOrd>` |

### null과 예외
| Java | Rust |
|---|---|
| `null` | ❌ 없음 → `Option<T>` (`Some(v)` / `None`) |
| `Optional.orElse(x)` | `.unwrap_or(x)` |
| `Optional.map / flatMap` | `.map` / `.and_then` |
| `throws Exception` | 반환 타입 `Result<T, E>` |
| `throw new XxxException()` | `return Err(AppError::Xxx)` |
| `try { } catch` | `match result { Ok(v) => .., Err(e) => .. }` |
| 예외를 위로 전달 | `?` 연산자 |
| `RuntimeException` (버그) | `panic!` |

### 컬렉션 / 스트림
| Java | Rust |
|---|---|
| `ArrayList<T>` | `Vec<T>` |
| `HashMap<K, V>` | `HashMap<K, V>` |
| `list.stream().filter().map().collect()` | `v.iter().filter().map().collect()` |
| `map.merge(k, 1, Integer::sum)` | `*map.entry(k).or_insert(0) += 1` |
| `x -> x + 1` (람다) | `\|x\| x + 1` (클로저) |

### 동시성
| Java | Rust |
|---|---|
| 같은 객체 참조를 여러 스레드에 공유 | `Arc<T>` (+ `Arc::clone`) |
| `synchronized` / `ReentrantLock` | `Mutex<T>` (데이터가 잠금 **안**에 있음) |
| `finally { lock.unlock(); }` | 필요 없음 (스코프 끝에서 자동 해제) |
| `ReadWriteLock` | `RwLock<T>` |
| `AtomicLong` | `AtomicU64` |
| `CompletableFuture` | `async fn` / `Future` + `.await` |
| `executor.submit(..)` | `tokio::spawn(async move { .. })` |
| `BlockingQueue` | `tokio::sync::mpsc` 채널 |

### 메모리 (Java에 없는 개념)
| 개념 | 한 줄 요약 |
|---|---|
| 소유권 | 값의 주인은 하나. 주인이 스코프를 벗어나면 자동 해제 |
| 이동(move) | `let b = a;` 하면 `a`는 더 이상 못 씀 (String, Vec 등) |
| `clone()` | 명시적인 깊은 복사 |
| `&T` | 빌려서 읽기 (여러 개 가능) |
| `&mut T` | 빌려서 수정 (한 번에 하나만) |
| `String` vs `&str` | 소유하는 문자열 vs 빌린 문자열 뷰 |
| 라이프타임 `'a` | 참조가 언제까지 유효한지 표시 (대부분 자동 추론) |

---

## 🧭 공부 팁

1. **컴파일 에러를 두려워하지 마세요.** Rust 컴파일러는 에러 메시지에 `help:`로 고치는 방법까지 알려줍니다. 각 챕터 끝의 "✏️ 직접 해보기"는 일부러 에러를 내보는 연습입니다.
2. **ch03, ch04가 가장 중요합니다.** 여기가 이해되면 나머지는 "Java에도 있던 개념의 Rust 버전"입니다.
3. **ch08의 "미니 actix"를 꼭 실행해 보세요.** actix가 마법처럼 보이던 부분이 트레이트와 제네릭의 조합이라는 걸 알게 됩니다.
4. 다 끝나면 [ACTIX_DECODER.md](ACTIX_DECODER.md)를 보면서 `actix-web-tutorial`을 01부터 다시 읽어보세요.
