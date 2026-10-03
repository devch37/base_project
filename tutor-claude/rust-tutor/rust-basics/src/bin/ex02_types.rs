// =============================================================================
// 연습문제 02: 타입 설계 (ch05 ~ ch08 범위)
// =============================================================================
// 채점: cargo test --bin ex02_types
//
// 은행 계좌 도메인을 Rust 스타일로 설계해 봅니다.
// struct + impl, enum 에러, Result 와 ?, Display, trait 을 모두 사용합니다.
// =============================================================================

#![allow(dead_code, unused_variables)]

use std::fmt;
use std::num::ParseIntError;

fn main() {
    println!("이 파일은 테스트로 채점합니다: cargo test --bin ex02_types");
}

// -----------------------------------------------------------------------------
// 문제 1 (ch06, ch07): 은행 에러 타입
// -----------------------------------------------------------------------------
#[derive(Debug, PartialEq)]
enum BankError {
    ZeroAmount,                                       // 0원 입출금 시도
    InsufficientFunds { needed: u64, available: u64 }, // 잔액 부족
}

// Display 를 구현하세요. 출력 형식:
//   ZeroAmount                         → "금액은 0보다 커야 합니다"
//   InsufficientFunds { needed: 500, available: 100 } → "잔액 부족: 필요 500, 잔액 100"
// 힌트: ch07 의 impl fmt::Display for AppError,  write!(f, "...", ...)
impl fmt::Display for BankError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        todo!()
    }
}

// -----------------------------------------------------------------------------
// 문제 2 (ch05, ch07): 계좌
// -----------------------------------------------------------------------------
#[derive(Debug)]
struct Account {
    owner: String,
    balance: u64,
}

impl Account {
    // 잔액 0 으로 새 계좌 생성. owner 는 &str 로 받아서 String 으로 저장
    fn new(owner: &str) -> Self {
        todo!()
    }

    // 잔액 조회 (읽기만 하므로 &self)
    fn balance(&self) -> u64 {
        todo!()
    }

    // 입금: amount 가 0 이면 Err(BankError::ZeroAmount),
    //       아니면 잔액에 더하고 Ok(입금 후 잔액)
    fn deposit(&mut self, amount: u64) -> Result<u64, BankError> {
        todo!()
    }

    // 출금: 0 이면 ZeroAmount, 잔액보다 크면 InsufficientFunds,
    //       아니면 잔액에서 빼고 Ok(출금 후 잔액)
    fn withdraw(&mut self, amount: u64) -> Result<u64, BankError> {
        todo!()
    }
}

// 문제 3 (ch07): from 에서 to 로 amount 를 이체하세요.
//   from 에서 출금이 실패하면 그 에러를 그대로 반환해야 합니다. (? 연산자 사용!)
//   성공하면 Ok(())
fn transfer(from: &mut Account, to: &mut Account, amount: u64) -> Result<(), BankError> {
    todo!()
}

// -----------------------------------------------------------------------------
// 문제 4 (ch07): 문자열 두 개를 숫자로 파싱해서 더하기. ? 로 에러 전파
// -----------------------------------------------------------------------------
fn parse_and_add(a: &str, b: &str) -> Result<i64, ParseIntError> {
    todo!()
}

// -----------------------------------------------------------------------------
// 문제 5 (ch08): 트레이트와 다형성
// -----------------------------------------------------------------------------
trait Shape {
    fn area(&self) -> f64;
    fn name(&self) -> String;

    // 기본 구현: "{name} (넓이 {area:.1})" 형식. 예) "원 (넓이 3.1)"
    fn describe(&self) -> String {
        todo!()
    }
}

struct Circle {
    radius: f64,
}
struct Rect {
    w: f64,
    h: f64,
}

// Circle: 넓이 = π r²  (std::f64::consts::PI),  name = "원"
impl Shape for Circle {
    fn area(&self) -> f64 {
        todo!()
    }
    fn name(&self) -> String {
        todo!()
    }
}

// Rect: 넓이 = w × h,  name = "사각형"
impl Shape for Rect {
    fn area(&self) -> f64 {
        todo!()
    }
    fn name(&self) -> String {
        todo!()
    }
}

// 여러 종류의 도형 넓이의 합
// 힌트: shapes.iter().map(|s| s.area()).sum()
fn total_area(shapes: &[Box<dyn Shape>]) -> f64 {
    todo!()
}

// 문제 6 (ch08): 제네릭 함수. 슬라이스에서 가장 큰 값의 "참조"를 반환. 비면 None
//   T 는 비교 가능해야 하므로 PartialOrd 바운드가 필요합니다.
fn largest<T: PartialOrd>(items: &[T]) -> Option<&T> {
    todo!()
}

// =============================================================================
// 테스트 (수정하지 마세요)
// =============================================================================
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_display() {
        assert_eq!(BankError::ZeroAmount.to_string(), "금액은 0보다 커야 합니다");
        let e = BankError::InsufficientFunds { needed: 500, available: 100 };
        assert_eq!(e.to_string(), "잔액 부족: 필요 500, 잔액 100");
    }

    #[test]
    fn test_account() {
        let mut acc = Account::new("철수");
        assert_eq!(acc.owner, "철수");
        assert_eq!(acc.balance(), 0);
        assert_eq!(acc.deposit(1000), Ok(1000));
        assert_eq!(acc.deposit(0), Err(BankError::ZeroAmount));
        assert_eq!(acc.withdraw(300), Ok(700));
        assert_eq!(
            acc.withdraw(1000),
            Err(BankError::InsufficientFunds { needed: 1000, available: 700 })
        );
        assert_eq!(acc.balance(), 700);
    }

    #[test]
    fn test_transfer() {
        let mut a = Account::new("A");
        let mut b = Account::new("B");
        a.deposit(100).unwrap();
        assert_eq!(transfer(&mut a, &mut b, 60), Ok(()));
        assert_eq!((a.balance(), b.balance()), (40, 60));
        assert!(transfer(&mut a, &mut b, 100).is_err());
        assert_eq!((a.balance(), b.balance()), (40, 60)); // 실패 시 변화 없음
    }

    #[test]
    fn test_parse_and_add() {
        assert_eq!(parse_and_add("10", "-3"), Ok(7));
        assert!(parse_and_add("10", "abc").is_err());
    }

    #[test]
    fn test_shapes() {
        let shapes: Vec<Box<dyn Shape>> = vec![
            Box::new(Circle { radius: 1.0 }),
            Box::new(Rect { w: 2.0, h: 3.0 }),
        ];
        assert_eq!(shapes[0].describe(), "원 (넓이 3.1)");
        assert_eq!(shapes[1].describe(), "사각형 (넓이 6.0)");
        let total = total_area(&shapes);
        assert!((total - (std::f64::consts::PI + 6.0)).abs() < 1e-9);
    }

    #[test]
    fn test_largest() {
        assert_eq!(largest(&[3, 9, 2]), Some(&9));
        assert_eq!(largest(&["b", "c", "a"]), Some(&"c"));
        assert_eq!(largest::<i32>(&[]), None);
    }
}
