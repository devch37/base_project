// =============================================================================
// Rust 문법 종합 가이드
// Rust Syntax Comprehensive Guide
//
// 기본 문법부터 심화 문법까지 한 파일에 정리한 학습용 가이드입니다.
// 모든 예제는 실제로 컴파일 가능합니다.
// Rust Edition 2021 기준
// =============================================================================

use std::collections::HashMap;
use std::fmt;
use std::rc::Rc;
use std::cell::RefCell;
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    println!("=== Rust 문법 종합 가이드 ===\n");

    // 각 섹션별 예제 함수 호출
    section_01_variables();
    section_02_data_types();
    section_03_functions();
    section_04_control_flow();
    section_05_ownership();
    section_06_references_borrowing();
    section_07_slices();
    section_08_structs();
    section_09_enums_match();
    section_10_traits();
    section_11_generics();
    section_12_lifetimes();
    section_13_error_handling();
    section_14_closures();
    section_15_iterators();
    section_16_smart_pointers();
    section_17_concurrency();

    println!("\n=== 모든 예제 실행 완료 ===");
}

// =============================================================================
// 섹션 01: 변수와 불변성
// Variables and Immutability
// =============================================================================
fn section_01_variables() {
    println!("\n--- 섹션 01: 변수와 불변성 ---");

    // 1-1. 불변 변수 (기본값: 불변)
    // Rust에서 변수는 기본적으로 불변(immutable)입니다.
    let x = 5;
    println!("불변 변수 x = {}", x);
    // x = 6; // 컴파일 에러! 불변 변수는 값을 변경할 수 없습니다.

    // 1-2. 가변 변수 (mut 키워드 사용)
    // mut을 붙이면 값을 변경할 수 있는 가변 변수가 됩니다.
    let mut y = 10;
    println!("변경 전 y = {}", y);
    y = 20;
    println!("변경 후 y = {}", y);

    // 1-3. 상수 (const)
    // 상수는 항상 불변이며, 타입을 반드시 명시해야 합니다.
    // 프로그램 실행 중 절대 변하지 않는 값에 사용합니다.
    const MAX_SCORE: u32 = 100_000; // 언더스코어로 숫자 가독성 향상
    println!("상수 MAX_SCORE = {}", MAX_SCORE);

    // 1-4. 섀도잉 (Shadowing)
    // 같은 이름의 변수를 다시 선언해서 기존 변수를 가리는 기법입니다.
    // mut과 달리, 타입을 바꿀 수도 있습니다.
    let z = 5;
    let z = z + 1;       // 새로운 z 변수 (이전 z를 섀도잉)
    let z = z * 2;       // 또 다른 새로운 z 변수
    println!("섀도잉 후 z = {}", z); // 12

    // 섀도잉으로 타입 변환: 문자열 -> 숫자
    let spaces = "   "; // 문자열 타입
    let spaces = spaces.len(); // 숫자 타입으로 변경 (섀도잉)
    println!("공백 문자 수 = {}", spaces);
    // mut으로는 타입 변경이 불가능합니다:
    // let mut spaces = "   ";
    // spaces = spaces.len(); // 컴파일 에러!
}

// =============================================================================
// 섹션 02: 기본 데이터 타입
// Basic Data Types
// =============================================================================
fn section_02_data_types() {
    println!("\n--- 섹션 02: 기본 데이터 타입 ---");

    // 2-1. 정수형 (Integer)
    // i8, i16, i32, i64, i128, isize (부호 있음)
    // u8, u16, u32, u64, u128, usize (부호 없음)
    let signed: i32 = -42;       // 부호 있는 32비트 정수
    let unsigned: u32 = 42;      // 부호 없는 32비트 정수
    let byte: u8 = 255;          // 0~255 범위
    println!("정수: signed={}, unsigned={}, byte={}", signed, unsigned, byte);

    // 정수 리터럴 표기법
    let decimal = 98_222;        // 10진수 (언더스코어 구분자)
    let hex = 0xff;              // 16진수
    let octal = 0o77;            // 8진수
    let binary = 0b1111_0000;   // 2진수
    println!("다양한 정수 표기: {}, {}, {}, {}", decimal, hex, octal, binary);

    // 2-2. 부동소수점 (Floating-Point)
    // f32: 단정밀도, f64: 배정밀도 (기본값)
    let f1: f64 = 3.14;
    let f2: f32 = 2.5;
    println!("부동소수점: f64={}, f32={}", f1, f2);

    // 2-3. 불리언 (Boolean)
    let is_active: bool = true;
    let is_closed = false; // 타입 추론으로 bool이 됨
    println!("불리언: is_active={}, is_closed={}", is_active, is_closed);

    // 2-4. 문자 (Character)
    // Rust의 char는 유니코드 스칼라 값으로, 4바이트를 차지합니다.
    let c = 'z';
    let emoji = '😻';   // 이모지도 char로 표현 가능
    let korean = '한';  // 한글도 char로 표현 가능
    println!("문자: c='{}', emoji='{}', korean='{}'", c, emoji, korean);

    // 2-5. 튜플 (Tuple)
    // 서로 다른 타입의 값들을 묶을 수 있습니다. 크기가 고정됩니다.
    let tup: (i32, f64, bool) = (500, 6.4, true);

    // 구조분해(destructuring)로 값 추출
    let (a, b, c_val) = tup;
    println!("튜플 구조분해: a={}, b={}, c={}", a, b, c_val);

    // 인덱스로 접근 (0부터 시작)
    println!("튜플 인덱스 접근: tup.0={}, tup.1={}", tup.0, tup.1);

    // 2-6. 배열 (Array)
    // 같은 타입의 고정 크기 데이터 집합입니다.
    // 스택(Stack)에 저장되며, 크기가 컴파일 타임에 결정됩니다.
    let arr = [1, 2, 3, 4, 5];
    let months = ["1월", "2월", "3월", "4월", "5월", "6월",
                  "7월", "8월", "9월", "10월", "11월", "12월"];

    // 같은 값으로 초기화: [값; 개수]
    let zeros = [0; 5]; // [0, 0, 0, 0, 0]

    println!("배열 arr[0]={}, arr[4]={}", arr[0], arr[4]);
    println!("months[0]={}", months[0]);
    println!("zeros = {:?}", zeros);
}

// =============================================================================
// 섹션 03: 함수 선언과 반환값
// Functions
// =============================================================================
fn section_03_functions() {
    println!("\n--- 섹션 03: 함수 선언과 반환값 ---");

    // 3-1. 기본 함수 호출
    greet("Alice");

    // 3-2. 매개변수와 반환값이 있는 함수
    let sum = add(3, 5);
    println!("3 + 5 = {}", sum);

    // 3-3. 표현식 vs 문장
    // Rust에서 표현식(expression)은 값을 반환하고,
    // 문장(statement)은 값을 반환하지 않습니다.
    let result = {
        // 이 블록 전체가 하나의 표현식입니다
        let x = 3;
        x * x + 1  // 세미콜론 없음 = 블록의 반환값
    };
    println!("블록 표현식 결과: {}", result); // 10

    // 3-4. 여러 값 반환 (튜플 사용)
    let (min_val, max_val) = min_max(&[3, 1, 4, 1, 5, 9, 2, 6]);
    println!("최솟값={}, 최댓값={}", min_val, max_val);
}

// 반환값이 없는 함수 (실제로는 () 유닛 타입을 반환)
fn greet(name: &str) {
    println!("안녕하세요, {}님!", name);
}

// 반환값이 있는 함수
// 마지막 표현식이 자동으로 반환됩니다 (return 키워드 생략 가능)
fn add(a: i32, b: i32) -> i32 {
    a + b  // 세미콜론 없음: 이 값이 반환됩니다
}

// 튜플로 여러 값 반환
fn min_max(numbers: &[i32]) -> (i32, i32) {
    let mut min = numbers[0];
    let mut max = numbers[0];
    for &n in numbers {
        if n < min { min = n; }
        if n > max { max = n; }
    }
    (min, max) // 튜플로 반환
}

// =============================================================================
// 섹션 04: 제어 흐름
// Control Flow
// =============================================================================
fn section_04_control_flow() {
    println!("\n--- 섹션 04: 제어 흐름 ---");

    // 4-1. if / else if / else
    // Rust의 if는 표현식입니다 (값을 반환할 수 있음)
    let score = 85;
    let grade = if score >= 90 {
        "A"
    } else if score >= 80 {
        "B"
    } else if score >= 70 {
        "C"
    } else {
        "F"
    };
    println!("점수 {}: 등급 {}", score, grade);

    // 4-2. loop - 무한 루프
    // loop 블록에서 break로 값을 반환할 수 있습니다.
    let mut counter = 0;
    let loop_result = loop {
        counter += 1;
        if counter == 5 {
            break counter * 2; // break에서 값 반환
        }
    };
    println!("loop 결과: {}", loop_result); // 10

    // 4-3. while 루프
    let mut number = 3;
    while number != 0 {
        print!("{} ", number);
        number -= 1;
    }
    println!("발사!");

    // 4-4. for 루프 - 컬렉션 순회 (가장 많이 사용)
    let fruits = ["사과", "바나나", "체리"];
    for fruit in fruits {
        print!("{} ", fruit);
    }
    println!();

    // 4-5. Range를 이용한 for 루프
    // 1..5 : 1, 2, 3, 4 (끝 제외)
    // 1..=5 : 1, 2, 3, 4, 5 (끝 포함)
    for i in 1..=5 {
        print!("{} ", i);
    }
    println!();

    // 4-6. 역순 순회
    for i in (1..=3).rev() {
        print!("{} ", i);
    }
    println!("출발!");

    // 4-7. enumerate()로 인덱스와 값 함께 가져오기
    for (index, fruit) in fruits.iter().enumerate() {
        println!("  fruits[{}] = {}", index, fruit);
    }
}

// =============================================================================
// 섹션 05: 소유권 (Ownership)
// Ownership - Rust의 가장 핵심적인 개념
// =============================================================================
fn section_05_ownership() {
    println!("\n--- 섹션 05: 소유권 (Ownership) ---");

    // 소유권의 세 가지 규칙:
    // 1. Rust의 각 값은 '소유자(owner)'가 있습니다.
    // 2. 값의 소유자는 한 번에 하나입니다.
    // 3. 소유자가 스코프를 벗어나면 값은 삭제(drop)됩니다.

    // 5-1. 스택 vs 힙
    // 스택: 고정 크기 데이터 (i32, bool 등) - 복사(Copy)가 일어남
    // 힙: 동적 크기 데이터 (String 등) - 이동(Move)이 일어남
    let x = 5;
    let y = x; // 정수는 Copy 트레이트가 있어 복사됩니다
    println!("스택 복사: x={}, y={}", x, y); // x와 y 모두 유효

    // 5-2. String의 이동 (Move)
    let s1 = String::from("hello"); // 힙에 메모리 할당
    let s2 = s1; // s1의 소유권이 s2로 '이동'합니다
    // println!("{}", s1); // 컴파일 에러! s1은 더 이상 유효하지 않습니다.
    println!("이동 후 s2 = {}", s2);

    // 5-3. 클론 (Clone) - 깊은 복사
    let s3 = String::from("world");
    let s4 = s3.clone(); // 힙 데이터까지 전체 복사
    println!("클론: s3={}, s4={}", s3, s4); // 둘 다 유효

    // 5-4. 함수와 소유권
    let s5 = String::from("rust");
    takes_ownership(s5); // s5의 소유권이 함수로 이동
    // println!("{}", s5); // 컴파일 에러! 소유권이 없음

    let x2 = 5;
    makes_copy(x2); // i32는 Copy이므로 x2는 여전히 유효
    println!("Copy 후 x2 = {}", x2);

    // 5-5. 소유권 반환
    let s6 = gives_ownership(); // 함수에서 소유권을 가져옴
    let s7 = String::from("hello");
    let s8 = takes_and_gives_back(s7); // s7 소유권 이동 후 반환
    println!("소유권 반환: s6={}, s8={}", s6, s8);
}

fn takes_ownership(s: String) {
    println!("소유권 받음: {}", s);
} // 여기서 s가 drop됨

fn makes_copy(x: i32) {
    println!("복사본 받음: {}", x);
} // x는 스택 데이터이므로 특별한 일 없음

fn gives_ownership() -> String {
    String::from("mine")
}

fn takes_and_gives_back(s: String) -> String {
    s // 받은 소유권을 그대로 반환
}

// =============================================================================
// 섹션 06: 참조와 빌림
// References & Borrowing
// =============================================================================
fn section_06_references_borrowing() {
    println!("\n--- 섹션 06: 참조와 빌림 (References & Borrowing) ---");

    // 참조(Reference): 소유권을 가져오지 않고 값을 '빌려서' 사용
    // & 기호로 참조를 만듭니다.

    // 6-1. 불변 참조 (&T)
    // 소유권 이전 없이 값을 읽을 수 있습니다.
    let s1 = String::from("hello");
    let len = calculate_length(&s1); // &s1: s1의 참조를 전달
    println!("'{}'의 길이는 {} 입니다.", s1, len); // s1은 여전히 유효

    // 6-2. 불변 참조는 동시에 여러 개 가능
    let s = String::from("rust");
    let r1 = &s;
    let r2 = &s;
    let r3 = &s;
    println!("불변 참조 여러 개: {}, {}, {}", r1, r2, r3);

    // 6-3. 가변 참조 (&mut T)
    // 값을 변경하려면 가변 참조가 필요합니다.
    let mut s2 = String::from("hello");
    change(&mut s2); // 가변 참조 전달
    println!("변경 후: {}", s2);

    // 6-4. 가변 참조는 동시에 하나만 가능 (데이터 경쟁 방지!)
    let mut s3 = String::from("hello");
    let r4 = &mut s3;
    // let r5 = &mut s3; // 컴파일 에러! 가변 참조는 동시에 하나만
    println!("가변 참조: {}", r4);

    // 6-5. 불변 참조와 가변 참조는 동시에 존재 불가
    let mut s4 = String::from("hello");
    let r6 = &s4;     // 불변 참조
    let r7 = &s4;     // 불변 참조 (가능)
    println!("불변 참조들: {}, {}", r6, r7);
    // r6, r7은 여기서 마지막으로 사용됨 (NLL: Non-Lexical Lifetimes)
    let r8 = &mut s4; // 이제 가변 참조 가능 (r6, r7 사용 종료 후)
    println!("가변 참조: {}", r8);

    // 6-6. 댕글링 참조(Dangling Reference)는 컴파일러가 방지
    // Rust는 참조가 유효한 데이터를 가리키도록 보장합니다.
    // fn dangle() -> &String { // 컴파일 에러!
    //     let s = String::from("hello");
    //     &s // s는 함수 종료 시 drop됨 -> 댕글링 참조!
    // }
}

fn calculate_length(s: &String) -> usize {
    s.len() // s를 빌려서 사용, 소유권 없음
} // s는 참조이므로 drop되지 않음

fn change(s: &mut String) {
    s.push_str(", world"); // 가변 참조로 값 변경
}

// =============================================================================
// 섹션 07: 슬라이스
// Slices
// =============================================================================
fn section_07_slices() {
    println!("\n--- 섹션 07: 슬라이스 (Slice) ---");

    // 슬라이스: 컬렉션의 일부를 참조하는 뷰(View)
    // 소유권 없이 연속된 데이터의 일부를 참조합니다.

    // 7-1. 문자열 슬라이스 (&str)
    let s = String::from("hello world");

    let hello = &s[0..5];   // 인덱스 0~4 (5 미포함)
    let world = &s[6..11];  // 인덱스 6~10

    // 시작이 0이면 생략 가능
    let hello2 = &s[..5];   // &s[0..5]와 동일

    // 끝이 마지막이면 생략 가능
    let world2 = &s[6..];   // &s[6..11]와 동일

    // 전체 슬라이스
    let whole = &s[..];     // &s[0..11]와 동일

    println!("슬라이스: '{}', '{}'", hello, world);
    println!("슬라이스: '{}', '{}'", hello2, world2);
    println!("전체 슬라이스: '{}'", whole);

    // 7-2. 첫 번째 단어 찾기 예제
    let sentence = String::from("안녕하세요 Rust!");
    let first = first_word(&sentence);
    println!("첫 단어: '{}'", first);

    // 7-3. 문자열 리터럴은 이미 슬라이스
    // &str 타입: 바이너리의 특정 위치를 가리키는 슬라이스
    let literal: &str = "나는 문자열 슬라이스입니다";
    println!("문자열 리터럴: {}", literal);

    // 7-4. 배열 슬라이스
    let arr = [1, 2, 3, 4, 5];
    let slice: &[i32] = &arr[1..4]; // [2, 3, 4]
    println!("배열 슬라이스: {:?}", slice);
}

// &String 대신 &str을 사용하는 것이 더 관용적입니다.
// &str로 받으면 String과 &str 모두 처리 가능합니다.
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[0..i];
        }
    }
    &s[..] // 공백이 없으면 전체 문자열 반환
}

// =============================================================================
// 섹션 08: 구조체 (Struct)
// Structs
// =============================================================================
fn section_08_structs() {
    println!("\n--- 섹션 08: 구조체 (Struct) ---");

    // 8-1. 일반 구조체 (Named Struct)
    struct User {
        username: String,
        email: String,
        age: u32,
        active: bool,
    }

    let user1 = User {
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        age: 30,
        active: true,
    };
    println!("사용자: {}, 이메일: {}", user1.username, user1.email);

    // 구조체 업데이트 문법 (.. 사용)
    let user2 = User {
        email: String::from("bob@example.com"),
        username: String::from("bob"),
        ..user1 // 나머지 필드는 user1에서 복사
    };
    println!("사용자2: {}, 나이: {}", user2.username, user2.age);

    // 8-2. 튜플 구조체 (Tuple Struct)
    // 필드 이름 없이 타입만 정의합니다.
    struct Color(u8, u8, u8);     // RGB 색상
    struct Point(f64, f64, f64);  // 3D 좌표

    let red = Color(255, 0, 0);
    let origin = Point(0.0, 0.0, 0.0);
    println!("빨간색: ({}, {}, {})", red.0, red.1, red.2);
    println!("원점: ({}, {}, {})", origin.0, origin.1, origin.2);

    // 8-3. 유닛 구조체 (Unit Struct)
    // 필드가 없는 구조체. 트레이트 구현 시 유용합니다.
    struct AlwaysEqual;
    let _subject = AlwaysEqual;

    // 8-4. 메서드 구현 (impl 블록)
    struct Rectangle {
        width: f64,
        height: f64,
    }

    impl Rectangle {
        // 연관 함수 (Associated Function) - 생성자 패턴
        // self를 받지 않으므로 Rectangle::new()로 호출
        fn new(width: f64, height: f64) -> Rectangle {
            Rectangle { width, height } // 필드명과 변수명이 같으면 생략 가능
        }

        // 메서드 - &self로 불변 참조 (self는 Rectangle의 인스턴스)
        fn area(&self) -> f64 {
            self.width * self.height
        }

        fn perimeter(&self) -> f64 {
            2.0 * (self.width + self.height)
        }

        fn is_square(&self) -> bool {
            self.width == self.height
        }

        // 가변 메서드 - &mut self로 값 변경
        fn scale(&mut self, factor: f64) {
            self.width *= factor;
            self.height *= factor;
        }
    }

    // Debug 출력을 위한 trait 구현
    impl fmt::Display for Rectangle {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "Rectangle({}x{})", self.width, self.height)
        }
    }

    let mut rect = Rectangle::new(10.0, 5.0);
    println!("넓이: {}", rect.area());
    println!("둘레: {}", rect.perimeter());
    println!("정사각형 여부: {}", rect.is_square());
    println!("확대 전: {}", rect);
    rect.scale(2.0);
    println!("확대 후: {}", rect);
}

// =============================================================================
// 섹션 09: 열거형과 match
// Enums & Pattern Matching
// =============================================================================
fn section_09_enums_match() {
    println!("\n--- 섹션 09: 열거형(Enum)과 match ---");

    // 9-1. 기본 열거형
    #[derive(Debug)]
    enum Direction {
        North,
        South,
        East,
        West,
    }

    let dir = Direction::North;
    println!("방향: {:?}", dir);

    // 9-2. 데이터를 가진 열거형 (강력한 기능!)
    // 각 변형(variant)이 다른 타입과 양의 데이터를 가질 수 있습니다.
    #[derive(Debug)]
    enum Message {
        Quit,                       // 데이터 없음
        Move { x: i32, y: i32 },   // 익명 구조체
        Write(String),              // String 포함
        ChangeColor(u8, u8, u8),   // 세 개의 u8
    }

    let messages = vec![
        Message::Move { x: 10, y: 20 },
        Message::Write(String::from("안녕")),
        Message::ChangeColor(255, 128, 0),
        Message::Quit,
    ];

    // 9-3. match 표현식 - 패턴 매칭의 핵심
    // 모든 경우를 처리해야 합니다 (exhaustive).
    for msg in &messages {
        match msg {
            Message::Quit => println!("종료 메시지"),
            Message::Move { x, y } => println!("이동: ({}, {})", x, y),
            Message::Write(text) => println!("쓰기: {}", text),
            Message::ChangeColor(r, g, b) => println!("색상 변경: ({}, {}, {})", r, g, b),
        }
    }

    // 9-4. Option<T> - Null이 없는 Rust의 방식
    // None: 값이 없음
    // Some(T): 값이 있음
    let some_number: Option<i32> = Some(42);
    let no_number: Option<i32> = None;

    // match로 Option 처리
    match some_number {
        Some(n) => println!("숫자가 있어요: {}", n),
        None => println!("숫자가 없어요"),
    }

    // 9-5. if let - match의 간략 버전 (한 패턴만 처리할 때)
    if let Some(n) = no_number {
        println!("숫자: {}", n);
    } else {
        println!("숫자가 없네요 (if let else)");
    }

    // 9-6. match의 다양한 패턴
    let number = 7;
    match number {
        1 => println!("하나"),
        2 | 3 => println!("둘 또는 셋"),     // 여러 패턴 (|)
        4..=6 => println!("넷부터 여섯"),    // 범위 패턴
        n if n % 2 == 0 => println!("{} 는 짝수", n), // 가드 조건
        _ => println!("그 외: {}", number),  // 기본 패턴
    }

    // 9-7. match로 값 반환
    let description = match number {
        1..=3 => "작은 수",
        4..=6 => "중간 수",
        _ => "큰 수",
    };
    println!("{} 는 {}", number, description);
}

// =============================================================================
// 섹션 10: 트레이트 (Trait)
// Traits
// =============================================================================
fn section_10_traits() {
    println!("\n--- 섹션 10: 트레이트 (Trait) ---");

    // 트레이트: 공유 동작을 정의하는 인터페이스
    // 다른 언어의 Interface와 유사하지만 더 강력합니다.

    // 10-1. 트레이트 정의
    trait Animal {
        // 추상 메서드: 구현 필수
        fn name(&self) -> &str;
        fn sound(&self) -> String;

        // 기본 구현: 필요 시 오버라이드 가능
        fn description(&self) -> String {
            format!("{}는 '{}' 소리를 냅니다.", self.name(), self.sound())
        }
    }

    // 10-2. 트레이트 구현
    struct Dog {
        name: String,
    }

    struct Cat {
        name: String,
    }

    impl Animal for Dog {
        fn name(&self) -> &str {
            &self.name
        }
        fn sound(&self) -> String {
            String::from("멍멍")
        }
        // description()은 기본 구현 사용
    }

    impl Animal for Cat {
        fn name(&self) -> &str {
            &self.name
        }
        fn sound(&self) -> String {
            String::from("야옹")
        }
        // 기본 구현 오버라이드
        fn description(&self) -> String {
            format!("[고양이] {}는 우아하게 '{}' 합니다.", self.name(), self.sound())
        }
    }

    let dog = Dog { name: String::from("바둑이") };
    let cat = Cat { name: String::from("나비") };

    println!("{}", dog.description()); // 기본 구현 사용
    println!("{}", cat.description()); // 오버라이드된 구현 사용

    // 10-3. 트레이트 매개변수 (impl Trait)
    // 특정 트레이트를 구현한 타입을 매개변수로 받습니다.
    fn make_noise(animal: &impl Animal) {
        println!("소음: {}", animal.sound());
    }

    make_noise(&dog);
    make_noise(&cat);

    // 10-4. 트레이트 바운드 (Trait Bound) - 더 명시적인 문법
    fn describe_animal<T: Animal>(animal: &T) {
        println!("설명: {}", animal.description());
    }

    describe_animal(&dog);

    // 10-5. 다중 트레이트 바운드
    trait Trainable {
        fn train(&self) -> String;
    }

    impl Trainable for Dog {
        fn train(&self) -> String {
            format!("{}가 훈련 중입니다!", self.name)
        }
    }

    // Animal과 Trainable 둘 다 구현한 타입만 받음
    fn train_animal<T: Animal + Trainable>(animal: &T) {
        println!("{} - {}", animal.description(), animal.train());
    }

    train_animal(&dog);

    // 10-6. 트레이트 객체 (dyn Trait) - 동적 디스패치
    // 컴파일 타임에 타입을 알 수 없을 때 사용
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog { name: String::from("멍멍이") }),
        Box::new(Cat { name: String::from("고양이") }),
    ];

    for animal in &animals {
        println!("동물 목록: {}", animal.description());
    }
}

// =============================================================================
// 섹션 11: 제네릭 (Generics)
// Generics
// =============================================================================
fn section_11_generics() {
    println!("\n--- 섹션 11: 제네릭 (Generics) ---");

    // 제네릭: 타입을 매개변수화하여 코드 중복을 줄입니다.
    // 컴파일 타임에 구체적인 타입으로 단일화(monomorphization)됩니다.
    // 런타임 비용이 없습니다!

    // 11-1. 제네릭 함수
    fn largest<T: PartialOrd>(list: &[T]) -> &T {
        let mut largest = &list[0];
        for item in list {
            if item > largest {
                largest = item;
            }
        }
        largest
    }

    let numbers = vec![34, 50, 25, 100, 65];
    println!("가장 큰 수: {}", largest(&numbers));

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("가장 큰 문자: {}", largest(&chars));

    // 11-2. 제네릭 구조체
    struct Pair<T> {
        first: T,
        second: T,
    }

    impl<T: fmt::Display + PartialOrd> Pair<T> {
        fn new(first: T, second: T) -> Self {
            Pair { first, second }
        }

        fn compare(&self) {
            if self.first > self.second {
                println!("첫 번째 값이 큽니다: {}", self.first);
            } else {
                println!("두 번째 값이 큽니다: {}", self.second);
            }
        }
    }

    let pair = Pair::new(5, 10);
    pair.compare();

    let str_pair = Pair::new("사과", "바나나");
    str_pair.compare();

    // 11-3. 제네릭 열거형 (표준 라이브러리 예시)
    // Option<T>와 Result<T, E>가 제네릭 열거형의 대표적인 예
    let some_int: Option<i32> = Some(42);
    let some_str: Option<&str> = Some("hello");
    let none_float: Option<f64> = None;

    println!("Option 예시: {:?}, {:?}, {:?}", some_int, some_str, none_float);

    // 11-4. 여러 타입 매개변수
    #[derive(Debug)]
    struct KeyValue<K, V> {
        key: K,
        value: V,
    }

    let kv1 = KeyValue { key: "name", value: "Alice" };
    let kv2 = KeyValue { key: 1, value: 100.0 };
    println!("키-값: {:?}", kv1);
    println!("키-값: {:?}", kv2);
}

// =============================================================================
// 섹션 12: 라이프타임 (Lifetime)
// Lifetimes
// =============================================================================
fn section_12_lifetimes() {
    println!("\n--- 섹션 12: 라이프타임 (Lifetime) ---");

    // 라이프타임: 참조가 유효한 기간을 컴파일러에게 알려줍니다.
    // 댕글링 참조를 방지하기 위한 Rust의 핵심 메커니즘입니다.
    // 대부분의 경우 컴파일러가 자동으로 추론합니다 (라이프타임 생략 규칙).

    // 12-1. 라이프타임이 필요한 상황
    // 두 참조 중 어느 것이 반환될지 컴파일러가 모를 때 명시합니다.
    fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
        // 'a: 두 입력 참조 중 더 짧은 쪽의 라이프타임
        if x.len() > y.len() {
            x
        } else {
            y
        }
    }

    let s1 = String::from("긴 문자열");
    let result;
    {
        let s2 = String::from("짧은");
        result = longest(s1.as_str(), s2.as_str());
        println!("가장 긴 문자열: {}", result);
        // result는 s2가 유효한 동안만 사용 가능
    }

    // 12-2. 구조체에서의 라이프타임
    // 구조체가 참조를 필드로 가질 때 라이프타임 명시 필요
    struct ImportantExcerpt<'a> {
        part: &'a str, // 이 구조체는 part가 유효한 동안만 존재 가능
    }

    impl<'a> ImportantExcerpt<'a> {
        fn level(&self) -> i32 {
            3
        }

        fn announce_and_return(&self, announcement: &str) -> &str {
            println!("주목: {}", announcement);
            self.part
        }
    }

    let novel = String::from("옛날 옛적에... 이것이 첫 문장입니다. 두 번째 문장.");
    let first_sentence = novel.split('.').next().expect("점이 없습니다.");
    let excerpt = ImportantExcerpt { part: first_sentence };
    println!("발췌: {}", excerpt.part);
    println!("레벨: {}", excerpt.level());

    // 12-3. 정적 라이프타임 ('static)
    // 프로그램 전체 실행 기간 동안 유효한 라이프타임
    let static_str: &'static str = "나는 정적 라이프타임을 가집니다.";
    println!("정적: {}", static_str);

    // 문자열 리터럴은 모두 'static 라이프타임
}

// =============================================================================
// 섹션 13: 에러 처리
// Error Handling
// =============================================================================
fn section_13_error_handling() {
    println!("\n--- 섹션 13: 에러 처리 (Error Handling) ---");

    // 13-1. Option<T> 처리
    let numbers = vec![1, 2, 3];

    // unwrap(): 값이 없으면 패닉 (프로덕션에서 지양)
    let first = numbers.first().unwrap();
    println!("첫 번째: {}", first);

    // unwrap_or(): 기본값 제공
    let empty: Vec<i32> = vec![];
    let default = empty.first().unwrap_or(&0);
    println!("기본값: {}", default);

    // unwrap_or_else(): 지연 평가로 기본값 생성
    let computed = empty.first().unwrap_or_else(|| &99);
    println!("계산된 기본값: {}", computed);

    // map(): Some 값 변환
    let doubled = numbers.first().map(|n| n * 2);
    println!("두 배: {:?}", doubled); // Some(2)

    // and_then(): 연쇄 Option 처리 (flatMap과 유사)
    let result = Some("42")
        .and_then(|s| s.parse::<i32>().ok())
        .map(|n| n * 2);
    println!("파싱 후 두 배: {:?}", result); // Some(84)

    // 13-2. Result<T, E> 처리
    fn divide(a: f64, b: f64) -> Result<f64, String> {
        if b == 0.0 {
            Err(String::from("0으로 나눌 수 없습니다"))
        } else {
            Ok(a / b)
        }
    }

    match divide(10.0, 2.0) {
        Ok(result) => println!("나누기 결과: {}", result),
        Err(e) => println!("에러: {}", e),
    }

    match divide(10.0, 0.0) {
        Ok(result) => println!("결과: {}", result),
        Err(e) => println!("에러: {}", e),
    }

    // 13-3. ? 연산자 - 에러를 간편하게 전파
    // ? 는 Err이면 즉시 반환, Ok이면 값을 추출합니다.
    fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
        let n = s.parse::<i32>()?; // 실패 시 즉시 Err 반환
        Ok(n * 2)
    }

    println!("파싱: {:?}", parse_and_double("21"));   // Ok(42)
    println!("파싱: {:?}", parse_and_double("abc")); // Err(...)

    // 13-4. 에러 처리 체이닝
    let result: Result<i32, _> = "42"
        .parse::<i32>()
        .map(|n| n + 8)
        .map_err(|e| format!("파싱 에러: {}", e));
    println!("체이닝: {:?}", result);

    // 13-5. 커스텀 에러 타입 (실무 패턴)
    #[derive(Debug)]
    enum AppError {
        ParseError(String),
        DivisionByZero,
        NotFound(String),
    }

    impl fmt::Display for AppError {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            match self {
                AppError::ParseError(msg) => write!(f, "파싱 에러: {}", msg),
                AppError::DivisionByZero => write!(f, "0으로 나눌 수 없습니다"),
                AppError::NotFound(key) => write!(f, "찾을 수 없음: {}", key),
            }
        }
    }

    fn safe_parse(s: &str) -> Result<i32, AppError> {
        s.parse::<i32>().map_err(|e| AppError::ParseError(e.to_string()))
    }

    match safe_parse("hello") {
        Ok(n) => println!("성공: {}", n),
        Err(e) => println!("앱 에러: {}", e),
    }
}

// =============================================================================
// 섹션 14: 클로저 (Closure)
// Closures
// =============================================================================
fn section_14_closures() {
    println!("\n--- 섹션 14: 클로저 (Closure) ---");

    // 클로저: 자신이 정의된 환경(스코프)의 변수를 캡처할 수 있는 익명 함수
    // |매개변수| -> 반환타입 { 본문 }

    // 14-1. 기본 클로저 문법
    let add_one = |x: i32| -> i32 { x + 1 };
    let add_two = |x| x + 2;        // 타입 추론
    let say_hello = || println!("클로저 안녕!"); // 매개변수 없음

    println!("add_one(5) = {}", add_one(5));
    println!("add_two(5) = {}", add_two(5));
    say_hello();

    // 14-2. 환경 캡처
    // 클로저는 주변 환경의 변수를 캡처합니다.
    let base = 10;
    let add_base = |x| x + base; // base를 불변 참조로 캡처
    println!("add_base(5) = {}", add_base(5)); // 15

    // 14-3. 가변 환경 캡처
    let mut count = 0;
    let mut increment = || {
        count += 1;
        count
    };
    println!("카운트: {}", increment()); // 1
    println!("카운트: {}", increment()); // 2
    println!("카운트: {}", increment()); // 3
    drop(increment); // 클로저를 명시적으로 해제하여 count 접근 가능하게 함
    println!("최종 카운트: {}", count); // 3

    // 14-4. move 클로저 - 소유권 이전
    // 쓰레드에서 값을 사용할 때 주로 사용합니다.
    let name = String::from("Rust");
    let greet = move || println!("안녕, {}!", name); // name의 소유권 이전
    greet();
    // println!("{}", name); // 컴파일 에러! name은 클로저로 이동됨

    // 14-5. 클로저를 매개변수로 받기
    // Fn, FnMut, FnOnce 트레이트
    fn apply<F: Fn(i32) -> i32>(f: F, value: i32) -> i32 {
        f(value)
    }

    fn apply_twice<F: Fn(i32) -> i32>(f: F, value: i32) -> i32 {
        f(f(value))
    }

    let double = |x| x * 2;
    println!("apply: {}", apply(double, 5));        // 10
    println!("apply_twice: {}", apply_twice(double, 3)); // 12

    // 14-6. 클로저를 반환하기
    fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
        move |x| x + n // n의 소유권을 이전하여 반환
    }

    let add10 = make_adder(10);
    let add20 = make_adder(20);
    println!("add10(5) = {}", add10(5)); // 15
    println!("add20(5) = {}", add20(5)); // 25

    // 14-7. 함수 포인터와 클로저 저장
    let operations: Vec<Box<dyn Fn(i32) -> i32>> = vec![
        Box::new(|x| x + 1),
        Box::new(|x| x * 2),
        Box::new(|x| x - 3),
    ];

    let mut value = 10;
    for op in &operations {
        value = op(value);
    }
    println!("연산 후 최종값: {}", value); // ((10+1)*2)-3 = 19
}

// =============================================================================
// 섹션 15: 이터레이터 (Iterator)
// Iterators
// =============================================================================
fn section_15_iterators() {
    println!("\n--- 섹션 15: 이터레이터 (Iterator) ---");

    // 이터레이터: 값의 시퀀스를 순회하는 추상화
    // Rust의 이터레이터는 지연 평가(lazy evaluation)입니다.
    // 실제로 소비(consume)될 때까지 계산되지 않습니다.

    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // 15-1. map() - 각 원소를 변환
    let doubled: Vec<i32> = numbers.iter()
        .map(|&x| x * 2)
        .collect();
    println!("두 배: {:?}", doubled);

    // 15-2. filter() - 조건에 맞는 원소만 선택
    let evens: Vec<&i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .collect();
    println!("짝수: {:?}", evens);

    // 15-3. map + filter 체이닝
    let result: Vec<i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)  // 짝수만 선택
        .map(|&x| x * x)             // 제곱
        .collect();
    println!("짝수의 제곱: {:?}", result);

    // 15-4. fold() - 누적 연산 (reduce와 유사)
    let sum = numbers.iter().fold(0, |acc, &x| acc + x);
    println!("합계: {}", sum);

    let product: i64 = numbers.iter()
        .map(|&x| x as i64)
        .fold(1, |acc, x| acc * x);
    println!("곱: {}", product);

    // 15-5. sum(), product(), count()
    let total: i32 = numbers.iter().sum();
    let count = numbers.iter().filter(|&&x| x > 5).count();
    println!("합계: {}, 5 초과 개수: {}", total, count);

    // 15-6. find(), position()
    let first_even = numbers.iter().find(|&&x| x % 2 == 0);
    let pos = numbers.iter().position(|&x| x == 5);
    println!("첫 짝수: {:?}, 5의 위치: {:?}", first_even, pos);

    // 15-7. any(), all()
    let has_negative = numbers.iter().any(|&x| x < 0);
    let all_positive = numbers.iter().all(|&x| x > 0);
    println!("음수 있음: {}, 모두 양수: {}", has_negative, all_positive);

    // 15-8. enumerate() - 인덱스와 값
    for (i, &n) in numbers.iter().enumerate().take(3) {
        println!("  [{}] = {}", i, n);
    }

    // 15-9. zip() - 두 이터레이터 병합
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![95, 87, 92];
    let paired: Vec<_> = names.iter().zip(scores.iter()).collect();
    for (name, score) in &paired {
        println!("  {} -> {}", name, score);
    }

    // 15-10. flat_map() - 중첩 컬렉션 평탄화
    let words = vec!["hello world", "foo bar"];
    let all_words: Vec<&str> = words.iter()
        .flat_map(|s| s.split_whitespace())
        .collect();
    println!("단어들: {:?}", all_words);

    // 15-11. chain() - 이터레이터 연결
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];
    let chained: Vec<&i32> = a.iter().chain(b.iter()).collect();
    println!("연결: {:?}", chained);

    // 15-12. 이터레이터 어댑터 - take(), skip()
    let first_three: Vec<&i32> = numbers.iter().take(3).collect();
    let skip_two: Vec<&i32> = numbers.iter().skip(7).collect();
    println!("처음 3개: {:?}, 7개 건너뜀: {:?}", first_three, skip_two);

    // 15-13. HashMap 수집
    let word_lengths: HashMap<&str, usize> = names.iter()
        .map(|&name| (name, name.len()))
        .collect();
    println!("이름 길이: {:?}", word_lengths);

    // 15-14. 커스텀 이터레이터 구현
    struct Counter {
        count: u32,
        max: u32,
    }

    impl Counter {
        fn new(max: u32) -> Counter {
            Counter { count: 0, max }
        }
    }

    impl Iterator for Counter {
        type Item = u32; // 이터레이터가 생산하는 타입

        fn next(&mut self) -> Option<Self::Item> {
            if self.count < self.max {
                self.count += 1;
                Some(self.count)
            } else {
                None // 이터레이터 종료
            }
        }
    }

    let counter = Counter::new(5);
    let sum: u32 = counter.sum();
    println!("커스텀 이터레이터 합계 (1~5): {}", sum); // 15
}

// =============================================================================
// 섹션 16: 스마트 포인터 (Smart Pointers)
// Smart Pointers
// =============================================================================
fn section_16_smart_pointers() {
    println!("\n--- 섹션 16: 스마트 포인터 (Smart Pointers) ---");

    // 스마트 포인터: 추가 메타데이터와 기능을 가진 포인터
    // Deref와 Drop 트레이트를 구현합니다.

    // 16-1. Box<T> - 힙에 데이터 저장
    // 사용 사례:
    // - 컴파일 타임에 크기를 알 수 없는 타입
    // - 큰 데이터의 소유권 이전 (복사 없이)
    // - 트레이트 객체

    let b = Box::new(5); // 힙에 5 저장, b는 스택의 포인터
    println!("Box 값: {}", b); // 자동 역참조(Deref)

    // 재귀 데이터 구조 (Box 없이는 크기를 알 수 없어 컴파일 에러)
    #[derive(Debug)]
    enum List {
        Cons(i32, Box<List>), // Box로 크기 확정
        Nil,
    }

    let list = List::Cons(1,
        Box::new(List::Cons(2,
            Box::new(List::Cons(3,
                Box::new(List::Nil))))));
    println!("연결 리스트: {:?}", list);

    // 16-2. Rc<T> - 참조 카운팅 (Reference Counting)
    // 단일 스레드에서 하나의 값을 여러 소유자가 공유할 때 사용
    // 가비지 컬렉션 없이 자동 메모리 관리

    let shared_data = Rc::new(String::from("공유 데이터"));
    let clone1 = Rc::clone(&shared_data); // 참조 카운트 증가
    let clone2 = Rc::clone(&shared_data); // 참조 카운트 증가

    println!("참조 카운트: {}", Rc::strong_count(&shared_data)); // 3
    println!("공유: {}, {}, {}", shared_data, clone1, clone2);

    drop(clone1); // 참조 카운트 감소
    println!("clone1 해제 후 카운트: {}", Rc::strong_count(&shared_data)); // 2

    // 16-3. RefCell<T> - 런타임 빌림 검사 (Interior Mutability)
    // 컴파일 타임 빌림 검사를 런타임으로 미룹니다.
    // 불변 참조를 통해서도 내부 값을 변경할 수 있게 합니다.

    let data = RefCell::new(vec![1, 2, 3]);

    // borrow(): 불변 참조 (Ref<T>)
    {
        let borrowed = data.borrow();
        println!("불변 참조: {:?}", *borrowed);
    } // Ref<T>가 여기서 해제됨

    // borrow_mut(): 가변 참조 (RefMut<T>)
    {
        let mut borrowed_mut = data.borrow_mut();
        borrowed_mut.push(4);
        println!("변경 후: {:?}", *borrowed_mut);
    } // RefMut<T>가 여기서 해제됨

    println!("최종 데이터: {:?}", data.borrow());

    // 16-4. Rc<RefCell<T>> - 공유 가변 상태
    // 여러 소유자가 가변으로 접근할 수 있는 패턴
    let shared_vec = Rc::new(RefCell::new(vec![1, 2, 3]));
    let owner1 = Rc::clone(&shared_vec);
    let owner2 = Rc::clone(&shared_vec);

    owner1.borrow_mut().push(4);
    owner2.borrow_mut().push(5);
    println!("공유 가변 데이터: {:?}", shared_vec.borrow()); // [1, 2, 3, 4, 5]
}

// =============================================================================
// 섹션 17: 동시성 (Concurrency)
// Concurrency
// =============================================================================
fn section_17_concurrency() {
    println!("\n--- 섹션 17: 동시성 (Concurrency) ---");

    // Rust의 동시성 모델:
    // "두려움 없는 동시성(Fearless Concurrency)"
    // 컴파일 타임에 데이터 경쟁(data race)을 방지합니다!

    // 17-1. 스레드 생성 (thread::spawn)
    let handle = thread::spawn(|| {
        for i in 1..=3 {
            println!("  스레드: 카운트 {}", i);
        }
    });

    for i in 1..=3 {
        println!("메인: 카운트 {}", i);
    }

    handle.join().unwrap(); // 스레드가 완료될 때까지 대기

    // 17-2. move 클로저로 데이터 전달
    let data = vec![1, 2, 3];
    let handle2 = thread::spawn(move || {
        // data의 소유권이 스레드로 이전됩니다
        println!("스레드에서 data: {:?}", data);
    });
    handle2.join().unwrap();

    // 17-3. Arc<T> - 스레드 간 안전한 공유 (Atomic Reference Counting)
    // Rc<T>의 스레드 안전 버전입니다.
    let shared_counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for thread_id in 0..5 {
        let counter = Arc::clone(&shared_counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap(); // Mutex 잠금
            *num += 1;
            println!("  스레드 {} 증가 후: {}", thread_id, *num);
            // num이 스코프를 벗어나면 자동으로 잠금 해제
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("최종 카운터: {}", *shared_counter.lock().unwrap());

    // 17-4. 메시지 전달 (Message Passing) - mpsc 채널
    // mpsc: Multiple Producer, Single Consumer
    use std::sync::mpsc;

    let (sender, receiver) = mpsc::channel();

    // 여러 생산자(producer)
    for i in 0..3 {
        let tx = sender.clone();
        thread::spawn(move || {
            let msg = format!("메시지 {}", i);
            tx.send(msg).unwrap();
        });
    }
    drop(sender); // 마지막 sender를 drop해야 receiver가 종료를 인식

    // 소비자(consumer)
    for received in receiver {
        println!("  수신: {}", received);
    }

    println!("채널 통신 완료!");

    // 17-5. 동시성 안전성 요약
    // - Send 트레이트: 스레드 간 소유권 이전 안전
    // - Sync 트레이트: 스레드 간 참조 공유 안전
    // - Arc<Mutex<T>>: 스레드 간 가변 상태 공유의 표준 패턴
    // 컴파일러가 이 모든 것을 검사합니다!
    println!("Rust 동시성 = 컴파일 타임 안전성 보장!");
}

// =============================================================================
// 추가: HashMap 기본 사용법
// =============================================================================
#[allow(dead_code)]
fn bonus_hashmap_example() {
    println!("\n--- 보너스: HashMap 사용법 ---");

    let mut scores: HashMap<String, i32> = HashMap::new();

    // 삽입
    scores.insert(String::from("Alice"), 95);
    scores.insert(String::from("Bob"), 87);
    scores.insert(String::from("Charlie"), 92);

    // 키가 없을 때만 삽입 (entry API)
    scores.entry(String::from("Dave")).or_insert(78);
    scores.entry(String::from("Alice")).or_insert(0); // Alice는 이미 있으므로 무시

    // 조회
    if let Some(score) = scores.get("Alice") {
        println!("Alice의 점수: {}", score);
    }

    // 순회
    for (name, score) in &scores {
        println!("  {}: {}", name, score);
    }

    // 값 업데이트
    let alice_score = scores.entry(String::from("Alice")).or_insert(0);
    *alice_score += 5; // 역참조 후 값 변경
    println!("업데이트된 Alice 점수: {}", scores["Alice"]);
}
