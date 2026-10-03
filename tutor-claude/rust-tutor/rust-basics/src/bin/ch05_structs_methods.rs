// =============================================================================
// 챕터 05: 구조체와 메서드 (Structs & impl) — Java 의 class 에 해당
// =============================================================================
// 실행: cargo run --bin ch05_structs_methods
//
// 이 챕터에서 배울 것
//   1. struct 정의와 생성 — 필드 초기화 축약 `Todo { id, title }`
//   2. impl 블록 — 메서드를 데이터와 "따로" 정의
//   3. 연관 함수(associated fn) `Type::new()` = Java 의 static 메서드/생성자
//   4. 메서드의 self, &self, &mut self — 이 세 가지 차이가 핵심
//   5. Self, 구조체 업데이트 문법 `..`, 튜플 구조체, 유닛 구조체
//   6. #[derive(Debug, Clone)] 맛보기
//
// Java 와 가장 큰 차이
//   - 클래스 상속(extends)이 없습니다. 공통 동작은 트레이트(interface)로 (ch08)
//   - 생성자 문법이 따로 없습니다. 관례적으로 `fn new() -> Self` 를 만듭니다.
//   - 데이터(struct)와 동작(impl)을 따로 선언합니다.
//   - null 필드가 없습니다. "없을 수 있는 값"은 Option<T> 로 (ch06)
// =============================================================================

#![allow(dead_code, unused_variables)]

fn main() {
    println!("===== 챕터 05: 구조체와 메서드 =====\n");

    struct_basics();
    impl_and_methods();
    self_kinds();
    other_struct_forms();
}

// -----------------------------------------------------------------------------
// 1. 구조체 정의와 생성
// -----------------------------------------------------------------------------
//
//   Java:                                   Rust:
//   public class Todo {                     struct Todo {
//       private long id;                        id: u64,
//       private String title;                   title: String,
//       private boolean completed;              completed: bool,
//   }                                       }
//
// - 필드는 기본적으로 private (같은 모듈 안에서만 접근). 공개하려면 pub (ch12)
// - getter/setter 를 습관적으로 만들지 않습니다. 같은 모듈이면 필드에 바로 접근

// #[derive(Debug)] : {:?} 로 출력할 수 있게 Debug 구현을 자동 생성 (Java 의 Lombok @ToString 같은 것)
// #[derive(Clone)] : .clone() 을 자동 생성
// 📌 actix 05_state:  #[derive(Serialize, Deserialize, Clone, Debug)] struct Todo { ... }
#[derive(Debug, Clone)]
struct Todo {
    id: u64,
    title: String,
    completed: bool,
}

fn struct_basics() {
    println!("--- 1. 구조체 생성 ---");

    // 생성: 타입명 { 필드: 값, ... }  — new 키워드 없음. 모든 필드를 다 채워야 함
    let todo = Todo {
        id: 1,
        title: String::from("Rust 공부"),
        completed: false,
    };
    println!("{:?}", todo); // Debug 출력
    println!("{:#?}", todo); // 예쁘게

    // 필드 접근은 . 으로
    println!("title = {}", todo.title);

    // 필드를 바꾸려면 "변수 전체"가 mut 이어야 함 (Java 처럼 필드별 final 개념이 아님)
    let mut todo2 = todo.clone();
    todo2.completed = true;

    // ▶ 필드 초기화 축약 (field init shorthand)
    // 변수 이름과 필드 이름이 같으면 `id: id` 대신 `id` 만 써도 됩니다.
    let id = 2;
    let title = String::from("actix 공부");
    let todo3 = Todo {
        id,    // id: id 와 같음
        title, // title: title 과 같음 (title 의 소유권이 구조체로 이동!)
        completed: false,
    };
    // 📌 actix 05_state 의 create_todo:
    //     let todo = Todo { id, title: body.into_inner().title, completed: false };
    //                       ^^ 바로 이 축약 문법

    // ▶ 구조체 분해 (destructuring)
    let Todo { id, title, .. } = todo3; // .. = "나머지 필드는 무시"
    println!("분해: id={}, title={}\n", id, title);
}

// -----------------------------------------------------------------------------
// 2. impl 블록 — 메서드 정의
// -----------------------------------------------------------------------------
#[derive(Debug)]
struct Counter {
    name: String,
    value: u32,
}

// impl 타입명 { ... } 안에 이 타입의 함수/메서드를 정의합니다.
// 한 타입에 impl 블록을 여러 개 만들어도 됩니다.
impl Counter {
    // ▶ 연관 함수 (associated function): 첫 인자에 self 가 없음
    //   → Java 의 static 메서드. 호출은 Counter::new(...) 처럼 :: 로
    //   이름이 new 인 건 언어 규칙이 아니라 "관례"입니다.
    //
    //   Self = 지금 impl 하고 있는 타입(Counter)의 별칭
    fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            value: 0,
        }
    }

    // 생성 방법이 여러 개면 이름을 다르게 (Java 의 오버로딩이 Rust 엔 없음!)
    fn with_value(name: &str, value: u32) -> Self {
        Self {
            name: name.to_string(),
            value,
        }
    }

    // ▶ 메서드: 첫 인자가 self 계열. 호출은 counter.get() 처럼 . 으로
    fn get(&self) -> u32 {
        self.value // Java 의 this.value
    }

    fn increment(&mut self) {
        self.value += 1;
    }
}

fn impl_and_methods() {
    println!("--- 2. impl 과 메서드 ---");

    let mut c = Counter::new("방문자"); // 연관 함수는 ::
    c.increment(); // 메서드는 .
    c.increment();
    println!("{} = {}", c.name, c.get());

    let c2 = Counter::with_value("좋아요", 100);
    println!("{:?}", c2);

    // 📌 actix 에서 :: 와 . 구분하기
    //   HttpResponse::Ok()       ← 연관 함수 (HttpResponse 의 static 메서드)
    //     .json(todo)            ← 메서드 (위에서 만든 값에 대해 호출)
    //   AppState::new()          ← 05_state 에서 직접 정의한 생성자
    //   web::Data::new(...)      ← web 모듈 안의 Data 타입의 new 연관 함수
    //   state.todos.lock()       ← 필드 접근 + 메서드 호출
    println!();
}

// -----------------------------------------------------------------------------
// 3. self / &self / &mut self — 메서드가 자신을 어떻게 다루는가
// -----------------------------------------------------------------------------
//   &self      : 빌려서 읽기만.        Java 의 일반 getter 같은 메서드.   가장 흔함
//   &mut self  : 빌려서 수정.          setter, push, insert 같은 메서드
//   self       : 소유권을 가져감(소비). 호출 후 원래 변수는 사용 불가
//                → 변환 메서드(into_xxx), 빌더 패턴에서 사용
#[derive(Debug)]
struct Envelope {
    letter: String,
}

impl Envelope {
    fn peek(&self) -> &str {
        &self.letter // 빌려서 보기만
    }

    fn rewrite(&mut self, text: &str) {
        self.letter = text.to_string(); // 내용 수정
    }

    fn into_inner(self) -> String {
        self.letter // 봉투를 뜯어서(소비) 안의 편지를 꺼냄
    }
}

fn self_kinds() {
    println!("--- 3. self 의 세 종류 ---");

    let mut env = Envelope {
        letter: String::from("안녕"),
    };
    println!("peek: {}", env.peek());
    env.rewrite("반가워");
    println!("peek: {}", env.peek());

    let letter: String = env.into_inner(); // env 는 여기서 소비됨
    println!("꺼낸 편지: {}", letter);
    // env.peek(); // ❌ value used after move

    // 📌 actix 의 web::Path<T>, web::Json<T> 도 정확히 이 Envelope 와 같은 "포장지"입니다.
    //     let id   = path.into_inner();          // Path<u64>  → u64
    //     let req  = body.into_inner();          // Json<RegisterRequest> → RegisterRequest
    //   포장지를 뜯어서 내용물의 소유권을 가져오는 것이죠.
    //   (포장지를 안 뜯고 body.title 처럼 바로 접근해도 되는데, 이건 Deref 덕분입니다 → ch08)

    // ▶ 빌더 패턴: self 를 받아서 self 를 돌려주면 메서드 체이닝이 됩니다.
    let req = RequestBuilder::new()
        .header("Content-Type", "application/json")
        .body("{}")
        .build();
    println!("빌더 결과: {}", req);
    // 📌 actix 의 App::new().app_data(..).service(..).service(..) 와
    //     HttpResponse::Ok().content_type(..).body(..) 가 바로 이런 체이닝입니다.
    println!();
}

struct RequestBuilder {
    headers: Vec<String>,
    body: String,
}

impl RequestBuilder {
    fn new() -> Self {
        Self {
            headers: Vec::new(),
            body: String::new(),
        }
    }
    // mut self: "소유권을 받은 self 를 내 맘대로 수정하겠다"
    fn header(mut self, key: &str, value: &str) -> Self {
        self.headers.push(format!("{}: {}", key, value));
        self // 수정한 자신을 돌려줌 → 다음 메서드로 이어짐
    }
    fn body(mut self, body: &str) -> Self {
        self.body = body.to_string();
        self
    }
    fn build(self) -> String {
        format!("headers={:?}, body={}", self.headers, self.body)
    }
}

// -----------------------------------------------------------------------------
// 4. 그 밖의 구조체 형태
// -----------------------------------------------------------------------------

// ▶ 튜플 구조체: 필드 이름 없이 타입만. .0, .1 로 접근
//   "같은 u64 지만 의미가 다른 값"을 구분할 때 유용 (newtype 패턴)
struct UserId(u64);
struct OrderId(u64);
// fn find_user(id: UserId) 에 OrderId 를 실수로 넘기면 컴파일 에러 → 타입 안전!
// 📌 actix 의 web::Path<T>, web::Json<T>, web::Data<T> 도 내부적으로 이런 감싸는 구조체입니다.

// ▶ 유닛 구조체: 필드가 아예 없음. 트레이트를 구현하는 "표식"으로 씀 (ch08)
struct Marker;

#[derive(Debug, Clone)]
struct Config {
    host: String,
    port: u16,
    workers: usize,
}

fn other_struct_forms() {
    println!("--- 4. 튜플/유닛 구조체, 업데이트 문법 ---");

    let uid = UserId(42);
    println!("user id = {}", uid.0);
    let _m = Marker;

    // ▶ 구조체 업데이트 문법: 일부 필드만 바꾸고 나머지는 다른 인스턴스에서 가져오기
    let default_config = Config {
        host: "127.0.0.1".to_string(),
        port: 8080,
        workers: 4,
    };
    let custom = Config {
        port: 9090,
        ..default_config.clone() // 나머지 필드는 여기서 가져옴 (반드시 맨 마지막)
    };
    println!("{:?}", custom);
}

// =============================================================================
// 📝 정리
// =============================================================================
//   struct T { a: u64, b: String }       데이터 정의 (필드 기본 private)
//   T { a, b: s }                        생성 (a: a 는 a 로 축약)
//   impl T { ... }                       메서드 정의 블록
//   fn new() -> Self                     연관 함수(static) → T::new()
//   fn f(&self)                          읽기 메서드      → t.f()
//   fn f(&mut self)                      수정 메서드
//   fn f(self)                           소비 메서드 (into_xxx, 빌더)
//   Self                                 현재 타입 별칭
//   T { x: 1, ..other }                  업데이트 문법
//   struct Id(u64);                      튜플 구조체 (newtype)
//   #[derive(Debug, Clone)]              자동 구현
//
// ✏️ 직접 해보기
//   1. Counter 에 reset(&mut self) 메서드를 추가해보세요.
//   2. Counter 에서 #[derive(Debug)] 를 지우고 println!("{:?}", c2) 가 어떻게 되는지 보세요.
// =============================================================================
