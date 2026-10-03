// =============================================================================
// ✅ 정답 예시 — ex01_basics
// 정답은 하나가 아닙니다. 테스트를 통과하면 여러분의 코드도 정답이에요!
// 이 파일은 컴파일 대상이 아닙니다(참고용). 직접 돌려보려면 src/bin/ 의 같은 이름 파일에 덮어쓰세요.
// 연습문제 01: 기초 (ch01 ~ ch04 범위)
// =============================================================================
// 채점: cargo test --bin ex01_basics
//
// 사용법
//   1. 각 함수의 todo!() 를 지우고 코드를 작성하세요.
//      (todo!() 는 "아직 구현 안 함" 매크로. 실행되면 panic 합니다)
//   2. cargo test --bin ex01_basics 로 채점. 모든 테스트가 ok 가 되면 통과!
//   3. 막히면 해당 챕터를 다시 보거나, solutions/ex01_basics.rs 를 참고하세요.
//
// 팁: 하나씩 풀고 싶으면 테스트 이름으로 골라 실행할 수 있습니다.
//   cargo test --bin ex01_basics grade
// =============================================================================

#![allow(dead_code)]

fn main() {
    println!("이 파일은 테스트로 채점합니다: cargo test --bin ex01_basics");
}

// 문제 1 (ch01, ch02): 섭씨 → 화씨 변환.  공식: F = C × 9/5 + 32
// 힌트: f64 연산. 마지막 줄에 세미콜론을 붙이지 마세요!
fn celsius_to_fahrenheit(c: f64) -> f64 {
    c * 9.0 / 5.0 + 32.0
}

// 문제 2 (ch02): 점수에 따라 학점을 반환하세요.
//   90 이상 'A', 80 이상 'B', 70 이상 'C', 나머지 'F'
// 힌트: match 와 범위 패턴 90..=100, 또는 if / else if 표현식
fn grade(score: u32) -> char {
    match score {
        90.. => 'A', // 90 이상 (끝이 없는 범위)
        80..=89 => 'B',
        70..=79 => 'C',
        _ => 'F',
    }
}

// 문제 3 (ch02, ch04): 문자열에서 영어 모음(a, e, i, o, u — 대소문자 모두)의 개수를 세세요.
// 힌트: for ch in s.chars() { ... },  ch.to_ascii_lowercase(),  matches!(c, 'a' | 'e' ...)
fn count_vowels(s: &str) -> usize {
    let mut count = 0;
    for ch in s.chars() {
        if matches!(ch.to_ascii_lowercase(), 'a' | 'e' | 'i' | 'o' | 'u') {
            count += 1;
        }
    }
    count
    // 이터레이터 버전 (ch09):
    // s.chars().filter(|c| matches!(c.to_ascii_lowercase(), 'a' | 'e' | 'i' | 'o' | 'u')).count()
}

// 문제 4 (ch04): 공백으로 구분된 단어 중 가장 긴 단어를 "복사 없이" 반환하세요.
//   길이가 같으면 먼저 나온 단어. 빈 문자열이면 "" 반환.
// 힌트: s.split_whitespace() 는 &str 들을 돌려줍니다. 반환 타입이 &str 인 이유를 생각해보세요.
fn longest_word(s: &str) -> &str {
    let mut longest = "";
    for word in s.split_whitespace() {
        if word.len() > longest.len() {
            // > 이므로 길이가 같으면 먼저 나온 단어 유지
            longest = word;
        }
    }
    longest // s 의 일부를 빌려서 반환 (복사 없음)
}

// 문제 5 (ch04): 받은 String 끝에 suffix 를 붙이세요. (반환값 없이 원본을 수정)
// 힌트: &mut String 이니 push_str
fn append_suffix(s: &mut String, suffix: &str) {
    s.push_str(suffix);
}

// 문제 6 (ch03, ch04): 슬라이스에서 짝수만 더한 값을 반환하세요.
// 힌트: for &n in nums { ... }  또는  for n in nums { if *n % 2 == 0 ... }
fn sum_even(nums: &[i32]) -> i32 {
    let mut sum = 0;
    for &n in nums {
        // &n 패턴: &i32 를 풀어서 n: i32 로 받음
        if n % 2 == 0 {
            sum += n;
        }
    }
    sum
}

// 문제 7 (ch03): 아래 함수는 컴파일되지 않는 코드를 "고친" 버전이어야 합니다.
//   names 를 출력한 다음, names 의 첫 번째 원소를 반환하되 names 는 그대로 써야 합니다.
//   반환 타입이 String 이므로 원소를 "복제"해서 돌려주세요. names 가 비어 있으면 "없음".
// 힌트: names.first() → Option<&String>,  .cloned() 또는 .map(|s| s.clone()),  .unwrap_or(...)
fn first_name_copy(names: &Vec<String>) -> String {
    println!("{:?}", names);
    names.first().cloned().unwrap_or("없음".to_string())
}

// =============================================================================
// 테스트 (수정하지 마세요)
// =============================================================================
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_celsius_to_fahrenheit() {
        assert_eq!(celsius_to_fahrenheit(0.0), 32.0);
        assert_eq!(celsius_to_fahrenheit(100.0), 212.0);
        assert_eq!(celsius_to_fahrenheit(-40.0), -40.0);
    }

    #[test]
    fn test_grade() {
        assert_eq!(grade(95), 'A');
        assert_eq!(grade(90), 'A');
        assert_eq!(grade(85), 'B');
        assert_eq!(grade(70), 'C');
        assert_eq!(grade(10), 'F');
    }

    #[test]
    fn test_count_vowels() {
        assert_eq!(count_vowels("hello"), 2);
        assert_eq!(count_vowels("RUST is AWESOME"), 6);
        assert_eq!(count_vowels("rhythm"), 0);
        assert_eq!(count_vowels("한글 abc"), 1);
    }

    #[test]
    fn test_longest_word() {
        assert_eq!(longest_word("rust is really fast"), "really");
        assert_eq!(longest_word("aa bb"), "aa");
        assert_eq!(longest_word(""), "");
    }

    #[test]
    fn test_append_suffix() {
        let mut s = String::from("Hello");
        append_suffix(&mut s, ", Rust!");
        assert_eq!(s, "Hello, Rust!");
    }

    #[test]
    fn test_sum_even() {
        assert_eq!(sum_even(&[1, 2, 3, 4, 5, 6]), 12);
        assert_eq!(sum_even(&[]), 0);
        assert_eq!(sum_even(&[-2, 3]), -2);
    }

    #[test]
    fn test_first_name_copy() {
        let names = vec!["철수".to_string(), "영희".to_string()];
        assert_eq!(first_name_copy(&names), "철수");
        assert_eq!(names.len(), 2); // names 는 그대로 사용 가능해야 함
        assert_eq!(first_name_copy(&vec![]), "없음");
    }
}
