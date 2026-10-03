// =============================================================================
// 챕터 08: 트레이트와 제네릭 (Traits & Generics)  ⭐⭐
// =============================================================================
// 실행: cargo run --bin ch08_traits_generics
//
// 이 챕터에서 배울 것
//   1. trait = Java 의 interface (+ 기본 메서드)
//   2. impl 트레이트 for 타입 — 남이 만든 타입에도 구현 가능
//   3. 제네릭 <T> 와 트레이트 바운드 <T: Trait>, where 절
//   4. ⭐ impl Trait — actix 핸들러의 `-> impl Responder` 의 정체
//   5. dyn Trait 과 Box<dyn Trait> — Java 의 다형성(인터페이스 타입 변수)
//   6. 자주 쓰는 표준 트레이트: Debug, Clone, Copy, PartialEq, Default, Display, From/Into, Deref
//   7. 터보피시 ::<> — `query_as::<_, Todo>`, `get::<AuthenticatedUser>()`
//
// 이 챕터 끝에서 actix 의 Responder / Json<T> 를 직접 흉내 내서 만들어 봅니다.
// =============================================================================

#![allow(dead_code, unused_variables)]

use std::collections::HashMap;
use std::fmt;
use std::ops::Deref;

fn main() {
    println!("===== 챕터 08: 트레이트와 제네릭 =====\n");

    trait_basics();
    generics();
    impl_trait_demo();
    dyn_trait_demo();
    std_traits();
    turbofish();
    mini_actix();
}

// -----------------------------------------------------------------------------
// 1. 트레이트 기본
// -----------------------------------------------------------------------------
//
//   Java:                                   Rust:
//   interface Describe {                    trait Describe {
//       String describe();                      fn describe(&self) -> String;
//       default String tag() {                  fn tag(&self) -> String {
//           return "[" + describe() + "]";          format!("[{}]", self.describe())
//       }                                       }
//   }                                       }
//   class User implements Describe {...}    impl Describe for User { ... }
//
trait Describe {
    // 구현해야 하는 메서드 (본문 없음)
    fn describe(&self) -> String;

    // 기본 구현이 있는 메서드 (Java 의 default 메서드)
    fn tag(&self) -> String {
        format!("[{}]", self.describe())
    }
}

struct User {
    name: String,
}
struct Product {
    title: String,
    price: u32,
}

impl Describe for User {
    fn describe(&self) -> String {
        format!("사용자 {}", self.name)
    }
}

impl Describe for Product {
    fn describe(&self) -> String {
        format!("상품 {} ({}원)", self.title, self.price)
    }
    // tag() 는 오버라이드 가능
    fn tag(&self) -> String {
        format!("<{}>", self.describe())
    }
}

// ⭐ Java 와 다른 점: 남이 만든 타입(표준 라이브러리의 i32 등)에도 내 트레이트를 구현할 수 있음
//   (Java 에서는 Integer 가 내 인터페이스를 implements 하게 만들 수 없죠)
impl Describe for i32 {
    fn describe(&self) -> String {
        format!("정수 {}", self)
    }
}

fn trait_basics() {
    println!("--- 1. 트레이트 기본 ---");
    let u = User { name: "철수".into() };
    let p = Product { title: "키보드".into(), price: 50000 };
    println!("{} / {}", u.tag(), p.tag());
    println!("{}\n", 7.tag()); // i32 에도 메서드가 생김!
}

// -----------------------------------------------------------------------------
// 2. 제네릭
// -----------------------------------------------------------------------------
// <T> : 타입 매개변수 (Java 의 <T> 와 같은 개념)
// <T: Describe> : "T 는 Describe 를 구현한 타입이어야 한다" (Java 의 <T extends Describe>)
fn print_all<T: Describe>(items: &[T]) {
    for item in items {
        println!("  {}", item.describe());
    }
}

// 바운드가 여러 개면 + 로 연결. 길어지면 where 절로 분리 (가독성용, 의미는 같음)
fn show_twice<T>(item: T)
where
    T: Describe + Clone, // Java: <T extends Describe & Cloneable>
{
    let copy = item.clone();
    println!("  {} / {}", item.describe(), copy.describe());
}

// 제네릭 구조체
// 📌 actix 03_request_response 의 공통 응답 래퍼와 같은 모양
//     struct ApiResponse<T: Serialize> { success: bool, data: Option<T>, message: String }
#[derive(Debug)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: String,
}

// impl<T> : "모든 T 에 대해 이 메서드들을 구현한다"
impl<T> ApiResponse<T> {
    fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), message: "성공".into() }
    }
    fn error(message: &str) -> Self {
        Self { success: false, data: None, message: message.into() }
    }
}

fn generics() {
    println!("--- 2. 제네릭 ---");
    print_all(&[User { name: "A".into() }, User { name: "B".into() }]);
    show_twice(42);

    let ok: ApiResponse<u64> = ApiResponse::ok(1);
    let err: ApiResponse<()> = ApiResponse::error("없음"); // () = 데이터 없음
    println!("  {:?}\n  {:?}", ok, err);

    // 💡 Java 제네릭과의 차이: Java 는 런타임에 타입 정보를 지우지만(type erasure),
    //    Rust 는 사용된 타입마다 코드를 따로 찍어냅니다(monomorphization).
    //    ApiResponse<u64>, ApiResponse<String> 이 각각 별도의 코드로 컴파일 → 런타임 비용 0
    println!();
}

// -----------------------------------------------------------------------------
// 3. ⭐ impl Trait — "구체 타입은 안 알려줄게, 이 트레이트를 구현한 무언가야"
// -----------------------------------------------------------------------------
// 반환 위치의 impl Trait:
//   "이 함수는 Describe 를 구현한 어떤 타입을 돌려준다. 정확히 뭔지는 몰라도 된다"
//   컴파일러는 실제 타입(여기선 Product)을 알고 있고, 호출하는 쪽에만 숨깁니다.
fn make_item() -> impl Describe {
    Product { title: "마우스".into(), price: 20000 }
}

// 인자 위치의 impl Trait: fn f<T: Describe>(x: T) 의 축약 문법
fn print_one(item: impl Describe) {
    println!("  print_one: {}", item.describe());
}

fn impl_trait_demo() {
    println!("--- 3. impl Trait ---");
    let item = make_item();
    println!("  {}", item.describe());
    print_one(User { name: "영희".into() });

    // 📌 actix 의 모든 핸들러:
    //     async fn hello() -> impl Responder {
    //         HttpResponse::Ok().body("hi")
    //     }
    //   "Responder 트레이트를 구현한 무언가를 돌려준다"는 뜻입니다.
    //   HttpResponse, String, &'static str, Json<T> ... 모두 Responder 를 구현하고 있어서
    //   그중 아무거나 돌려줄 수 있습니다. 실제 타입명을 길게 적지 않아도 되니 편하죠.
    //
    // ⚠️ 주의: impl Trait 반환은 "하나의 구체 타입"이어야 합니다.
    //     if a { HttpResponse::Ok()... } else { "문자열" }   ← ❌ 두 가지 타입이라 에러
    //   그래서 actix 예제에서 분기마다 HttpResponse 로 통일해서 반환하는 것입니다.
    //   서로 다른 타입을 돌려줘야 하면 → 아래의 Box<dyn Trait>
    println!();
}

// -----------------------------------------------------------------------------
// 4. dyn Trait — 런타임 다형성
// -----------------------------------------------------------------------------
fn dyn_trait_demo() {
    println!("--- 4. dyn Trait / Box<dyn Trait> ---");

    // 서로 다른 타입을 한 Vec 에 담고 싶다면?
    //   Java: List<Describe> list = List.of(new User(), new Product());  ← 당연히 됨
    //   Rust: Vec<User> 처럼 원소 타입이 하나여야 함. 크기도 컴파일 시점에 알아야 함.
    //   → 힙에 넣고(Box) 포인터로 다루면 크기가 일정해짐 → Vec<Box<dyn Describe>>
    let items: Vec<Box<dyn Describe>> = vec![
        Box::new(User { name: "철수".into() }),
        Box::new(Product { title: "모니터".into(), price: 300000 }),
        Box::new(99),
    ];
    for it in &items {
        println!("  {}", it.tag()); // 런타임에 실제 타입의 메서드를 찾아 호출 (vtable, Java 의 가상 메서드 호출과 동일)
    }

    //   impl Trait  : 컴파일 시점에 타입 결정 (정적 디스패치). 빠름. 한 가지 타입만
    //   dyn Trait   : 런타임에 결정 (동적 디스패치). 여러 타입 섞기 가능. 항상 & 나 Box 뒤에
    //
    // 📌 ch07 의 Box<dyn std::error::Error> 도 "어떤 에러든 담는 상자"였습니다.
    println!();
}

// -----------------------------------------------------------------------------
// 5. 자주 쓰는 표준 트레이트
// -----------------------------------------------------------------------------
// #[derive(...)] 로 자동 구현할 수 있는 것들:
//   Debug      {:?} 출력                       (Lombok @ToString)
//   Clone      .clone()                        (Cloneable)
//   Copy       대입 시 이동 대신 복사 (Clone 필요, 모든 필드가 Copy 여야)
//   PartialEq  == 비교                          (equals)
//   Eq, Hash   HashMap 의 키로 쓰려면 필요       (equals + hashCode)
//   Default    기본값 생성 T::default()
//   PartialOrd, Ord  < > 비교, 정렬               (Comparable)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Default)]
struct Point {
    x: i32,
    y: i32,
}

// Display 는 derive 불가 → 직접 구현 ({} 출력 형식은 개발자가 정해야 하니까)
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// From: 타입 변환. 구현하면 반대 방향 Into 는 공짜로 생김
impl From<(i32, i32)> for Point {
    fn from(t: (i32, i32)) -> Self {
        Point { x: t.0, y: t.1 }
    }
}

fn std_traits() {
    println!("--- 5. 표준 트레이트 ---");
    let p = Point { x: 1, y: 2 };
    let origin = Point::default(); // Point { x: 0, y: 0 }
    println!("  Debug: {:?}, Display: {}, to_string: {}", p, p, p.to_string());
    println!("  p == origin ? {}", p == origin);

    let mut visits: HashMap<Point, u32> = HashMap::new(); // Hash + Eq 덕분에 키로 사용
    *visits.entry(p.clone()).or_insert(0) += 1;
    println!("  visits = {:?}", visits);

    let a = Point::from((3, 4)); // From
    let b: Point = (5, 6).into(); // Into (받는 쪽 타입을 명시해야 함)
    println!("  from: {}, into: {}", a, b);

    // 문자열에서 자주 보는 into():  let s: String = "hi".into();  ← &str → String
    println!();
}

// -----------------------------------------------------------------------------
// 6. 터보피시 ::<> — 제네릭 타입을 직접 지정
// -----------------------------------------------------------------------------
fn turbofish() {
    println!("--- 6. 터보피시 ::<> ---");

    // 컴파일러가 제네릭 타입을 추론할 수 없을 때 직접 알려줍니다.
    // 방법 1: 변수에 타입 명시
    let a: i32 = "10".parse().unwrap();
    // 방법 2: 터보피시 (모양이 물고기 ::<> 같아서 붙은 이름)
    let b = "10".parse::<i32>().unwrap();
    let v = (1..=3).collect::<Vec<i32>>();
    let w = (1..=3).collect::<Vec<_>>(); // _ : "이 부분은 추론해줘"
    println!("  {} {} {:?} {:?}", a, b, v, w);

    // 📌 actix 06_database:  sqlx::query_as::<_, Todo>("SELECT ...")
    //      → "결과 행을 Todo 로 변환해줘. 첫 번째 타입 매개변수(DB 종류)는 알아서 추론해"
    // 📌 actix 04_middleware:  req.extensions().get::<AuthenticatedUser>()
    //      → "확장 데이터 저장소에서 AuthenticatedUser 타입의 값을 꺼내줘"
    // 📌 actix 03:  ApiResponse::<()>::error("...")  → T 를 () 로 지정
    println!();
}

// -----------------------------------------------------------------------------
// 7. 🎯 종합: actix 의 Responder 와 Json<T> 를 직접 흉내 내기
// -----------------------------------------------------------------------------
// 실제 actix 와 똑같지는 않지만, "왜 이렇게 쓰는지" 원리는 같습니다.

// (1) "HTTP 응답으로 바뀔 수 있는 것" 이라는 트레이트
trait Responder {
    fn respond_to(self) -> HttpResponse;
}

#[derive(Debug)]
struct HttpResponse {
    status: u16,
    body: String,
}

impl HttpResponse {
    // HttpResponse::Ok() — 연관 함수 이름이 대문자로 시작하는 건 actix 의 스타일(상태 이름처럼)
    #[allow(non_snake_case)]
    fn Ok() -> Self {
        HttpResponse { status: 200, body: String::new() }
    }
    fn body(mut self, b: impl Into<String>) -> Self {
        // impl Into<String> : String 으로 바뀔 수 있는 건 다 받음 (&str, String ...)
        self.body = b.into();
        self
    }
}

// (2) 여러 타입이 Responder 를 구현 → 핸들러가 이 중 아무거나 반환 가능
impl Responder for HttpResponse {
    fn respond_to(self) -> HttpResponse {
        self
    }
}
impl Responder for &'static str {
    fn respond_to(self) -> HttpResponse {
        HttpResponse::Ok().body(self)
    }
}
impl Responder for String {
    fn respond_to(self) -> HttpResponse {
        HttpResponse::Ok().body(self)
    }
}

// (3) Json<T>: T 를 감싸는 포장지 (튜플 구조체 = newtype)
struct Json<T>(T);

impl<T> Json<T> {
    fn into_inner(self) -> T {
        self.0
    }
}

// Deref 구현: Json<T> 를 &T 처럼 쓸 수 있게 해 줌
// → body.title 처럼 포장을 안 뜯고도 안의 필드에 바로 접근 가능해지는 비밀
impl<T> Deref for Json<T> {
    type Target = T; // 연관 타입: "역참조하면 T 가 나온다"
    fn deref(&self) -> &T {
        &self.0
    }
}

// T 가 Debug 를 구현할 때만 Json<T> 가 Responder 가 됨 (조건부 구현)
// 실제 actix 에서는 T: Serialize 일 때 JSON 문자열로 직렬화합니다.
impl<T: fmt::Debug> Responder for Json<T> {
    fn respond_to(self) -> HttpResponse {
        HttpResponse::Ok().body(format!("{:?}", self.0))
    }
}

#[derive(Debug)]
struct CreateTodo {
    title: String,
}

// (4) 핸들러들 — 반환 타입이 전부 impl Responder
fn hello() -> impl Responder {
    "안녕하세요" // &'static str
}
fn greet(name: String) -> impl Responder {
    format!("반가워요 {}님", name) // String
}
fn create(body: Json<CreateTodo>) -> impl Responder {
    println!("    (핸들러 안) Deref 로 바로 접근: body.title = {}", body.title);
    let req = body.into_inner(); // 포장 뜯기
    Json(req) // 다시 Json 으로 감싸 응답
}

// (5) "프레임워크" 쪽: 무엇이 오든 Responder 면 응답으로 변환할 수 있음
fn framework_dispatch<R: Responder>(result: R) {
    let res = result.respond_to();
    println!("  → HTTP {} body={}", res.status, res.body);
}

fn mini_actix() {
    println!("--- 7. 미니 actix: Responder / Json<T> 흉내 ---");
    framework_dispatch(hello());
    framework_dispatch(greet("철수".to_string()));
    framework_dispatch(create(Json(CreateTodo { title: "공부하기".into() })));

    // 정리: actix 가 마법처럼 보이는 이유는 대부분
    //   - 트레이트(Responder, FromRequest, ResponseError ...)를 여러 타입에 구현해 두고
    //   - 제네릭 + 트레이트 바운드로 "이 트레이트만 구현하면 다 받아줌" 하기 때문입니다.
    //   핸들러 인자(web::Path, web::Json, web::Data, HttpRequest)도 모두 FromRequest 트레이트를 구현해서
    //   actix 가 요청에서 알아서 꺼내 넣어주는 것입니다.
}

// =============================================================================
// 📝 정리
// =============================================================================
//   trait T { fn f(&self); fn g(&self) { 기본구현 } }   interface
//   impl T for Type { ... }                             implements (남의 타입에도 가능)
//   fn f<X: T>(x: X) / fn f(x: impl T)                  제네릭 + 바운드
//   where X: T + Clone                                  바운드가 길 때
//   fn f() -> impl T                                    "T 를 구현한 무언가" 반환 (한 타입만)
//   Box<dyn T>, &dyn T                                  런타임 다형성 (여러 타입 섞기)
//   #[derive(Debug, Clone, PartialEq, Default ...)]     자동 구현
//   impl From<A> for B  → a.into()                      타입 변환
//   impl Deref          → 포장지를 안의 값처럼 사용
//   f::<Type>()                                         터보피시
//
// ✏️ 직접 해보기
//   1. Responder 를 u16 에도 구현해서 `fn status() -> impl Responder { 204 }` 가 되게 해보세요.
//   2. hello() 에서 if 문으로 &str 과 String 을 섞어 반환해보고, 에러를 Box<dyn ...> 없이 고칠 방법을 생각해보세요.
//      (힌트: 둘 다 String 으로 통일)
// =============================================================================
