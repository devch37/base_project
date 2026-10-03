// =============================================================================
// 챕터 10: 컬렉션과 문자열 (Vec, HashMap, String)
// =============================================================================
// 실행: cargo run --bin ch10_collections_strings
//
// 이 챕터에서 배울 것
//   1. Vec<T>       — Java ArrayList
//   2. HashMap<K,V> — Java HashMap  (actix 05_state 의 인메모리 저장소)
//   3. entry API    — "있으면 수정, 없으면 삽입"을 한 번에
//   4. String 다루기 — 생성/연결/변환 총정리
//   5. 그 밖의 컬렉션 (HashSet, BTreeMap, VecDeque)
// =============================================================================

#![allow(dead_code, unused_variables)]

use std::collections::{BTreeMap, HashMap, HashSet, VecDeque};

fn main() {
    println!("===== 챕터 10: 컬렉션과 문자열 =====\n");

    vec_basics();
    hashmap_basics();
    entry_api();
    string_ops();
    other_collections();
}

// -----------------------------------------------------------------------------
// 1. Vec<T>
// -----------------------------------------------------------------------------
fn vec_basics() {
    println!("--- 1. Vec<T> ---");

    let mut v: Vec<i32> = Vec::new(); // new ArrayList<>()
    v.push(10); //                       add
    v.push(20);
    v.push(30);
    let v2 = vec![1, 2, 3]; // vec! 매크로: 초기값과 함께 생성 (List.of)

    // 접근 방법 두 가지
    let a = v[0]; //            범위 밖이면 panic
    let b = v.get(10); //       범위 밖이면 None → Option<&i32> (안전)
    println!("  v[0]={}, v.get(10)={:?}", a, b);

    println!("  len={}, is_empty={}, contains(20)={}", v.len(), v.is_empty(), v.contains(&20));

    let last = v.pop(); // 마지막 제거 → Option<i32>
    v.insert(0, 5); //     인덱스 0 에 삽입
    v.remove(1); //        인덱스 1 제거 (뒤의 원소들이 당겨짐)
    v.extend([100, 200]); // addAll
    v.retain(|&x| x != 100); // removeIf 의 반대: 조건에 맞는 것만 남김
    println!("  pop={:?}, v={:?}", last, v);

    // 정렬/중복 제거
    let mut nums = vec![3, 1, 2, 3, 1];
    nums.sort(); //  Collections.sort
    nums.dedup(); // 연속된 중복 제거 (정렬 후 쓰면 distinct)
    println!("  sort+dedup = {:?}\n", nums);
}

// -----------------------------------------------------------------------------
// 2. HashMap<K, V>
// -----------------------------------------------------------------------------
#[derive(Debug, Clone)]
struct Todo {
    id: u64,
    title: String,
    completed: bool,
}

fn hashmap_basics() {
    println!("--- 2. HashMap<K, V> ---");

    // 📌 actix 05_state 의 AppState.todos 가 HashMap<u64, Todo> 입니다.
    let mut todos: HashMap<u64, Todo> = HashMap::new();

    // insert: 넣기. 이미 키가 있으면 덮어쓰고 이전 값을 Some(old) 로 돌려줌 (Java put 과 동일)
    todos.insert(1, Todo { id: 1, title: "공부".into(), completed: false });
    todos.insert(2, Todo { id: 2, title: "운동".into(), completed: false });

    // get: 키로 조회 → Option<&V>. 키는 &K 로 넘김
    match todos.get(&1) {
        Some(t) => println!("  get(1) = {}", t.title),
        None => println!("  없음"),
    }

    // get_mut: 수정용 조회 → Option<&mut V>
    // 📌 05_state 의 update_todo
    if let Some(t) = todos.get_mut(&2) {
        t.completed = true;
    }

    // contains_key / remove / len
    // 📌 05_state 의 delete_todo:  match todos.remove(&id) { Some(_) => 204, None => 404 }
    let removed: Option<Todo> = todos.remove(&1);
    println!("  removed = {:?}", removed.map(|t| t.title));
    println!("  contains_key(1) = {}, len = {}", todos.contains_key(&1), todos.len());

    // 순회 (순서는 보장되지 않음! 순서가 필요하면 BTreeMap)
    for (id, t) in &todos {
        println!("  {} → {:?}", id, t);
    }
    // keys() / values() / values_mut()
    // 📌 05_state:  let todo_list: Vec<&Todo> = todos.values().collect();
    let titles: Vec<&String> = todos.values().map(|t| &t.title).collect();
    println!("  titles = {:?}\n", titles);
}

// -----------------------------------------------------------------------------
// 3. entry API
// -----------------------------------------------------------------------------
fn entry_api() {
    println!("--- 3. entry API ---");

    // 단어 수 세기 — Java: map.merge(word, 1, Integer::sum)
    let text = "rust is fast rust is safe";
    let mut counts: HashMap<&str, u32> = HashMap::new();
    for word in text.split_whitespace() {
        // entry(key): 그 키의 "자리"를 가져옴
        // or_insert(0): 비어 있으면 0 을 넣고, 그 자리의 &mut V 를 돌려줌
        *counts.entry(word).or_insert(0) += 1;
    }
    println!("  counts = {:?}", counts);

    // 그룹핑 — Java: Collectors.groupingBy
    let mut by_len: HashMap<usize, Vec<&str>> = HashMap::new();
    for w in ["a", "bb", "cc", "d"] {
        by_len.entry(w.len()).or_default().push(w); // or_default: 기본값(빈 Vec)
    }
    println!("  by_len = {:?}\n", by_len);
}

// -----------------------------------------------------------------------------
// 4. String 총정리
// -----------------------------------------------------------------------------
fn string_ops() {
    println!("--- 4. String 다루기 ---");

    // ▶ 만들기 — 모두 결과는 String
    let a = String::from("hello");
    let b = "hello".to_string();
    let c = "hello".to_owned();
    let d: String = "hello".into();
    let e = format!("{}-{}", "hello", 1);
    let empty = String::new();
    // 어떤 걸 써도 됩니다. 실무 코드에선 to_string(), String::from, into() 가 많이 보입니다.

    // ▶ 이어 붙이기
    let mut s = String::from("Hello");
    s.push(','); //         문자 하나
    s.push_str(" Rust"); // 문자열
    s += "!"; //            += 도 가능 (&str 만)
    println!("  {}", s);

    // + 연산자: 왼쪽 String 의 소유권을 가져가서 재사용함 (그래서 왼쪽은 이후 못 씀)
    let s1 = String::from("A");
    let s2 = String::from("B");
    let s3 = s1 + &s2; // s1 은 이동됨, s2 는 빌림
    // 헷갈리면 format!("{}{}", s1, s2) 를 쓰세요 (아무것도 이동시키지 않음)
    println!("  s3 = {}", s3);

    // ▶ String ↔ &str
    let owned = String::from("abc");
    let view: &str = &owned; //       String → &str (자동, 비용 0)
    let view2: &str = owned.as_str(); // 명시적
    let back: String = view.to_string(); // &str → String (힙 복사, 비용 있음)

    // ▶ 숫자 ↔ 문자열
    let n: u64 = "42".parse().unwrap(); // 문자열 → 숫자 (Integer.parseInt)
    let t = 42.to_string(); //            숫자 → 문자열 (String.valueOf)
    println!("  parse={}, to_string={}", n, t);

    // ▶ 자주 쓰는 메서드
    let line = "  Hello, World  ";
    println!("  trim='{}'", line.trim());
    println!("  upper={}, lower={}", line.trim().to_uppercase(), line.trim().to_lowercase());
    println!("  starts_with={}, ends_with={}", line.trim().starts_with("Hello"), line.trim().ends_with('d'));
    println!("  replace={}", line.trim().replace("World", "Rust"));
    println!("  find={:?}", line.find("World")); // 바이트 위치 Option<usize>
    let csv = "id,title,completed";
    let cols: Vec<&str> = csv.split(',').collect();
    println!("  split={:?}", cols);
    if let Some((k, v)) = "key=value".split_once('=') {
        println!("  split_once: k={}, v={}", k, v);
    }

    // ▶ 글자 단위 순회 (UTF-8 이라 인덱스로 글자를 못 꺼냄)
    let ko = "러스트";
    for (i, ch) in ko.chars().enumerate() {
        print!("  [{}:{}]", i, ch);
    }
    println!();
    println!("  bytes={}, chars={}", ko.len(), ko.chars().count());

    // ▶ 비교: == 로 내용 비교 (Java 처럼 equals 를 쓸 필요 없음! 참조 비교가 아님)
    let x = String::from("hi");
    println!("  x == \"hi\" ? {}\n", x == "hi");
    // 📌 07_error_handling:  if auth != "Bearer admin-secret" { ... }
}

// -----------------------------------------------------------------------------
// 5. 그 밖의 컬렉션
// -----------------------------------------------------------------------------
fn other_collections() {
    println!("--- 5. 그 밖의 컬렉션 ---");

    // HashSet — 중복 없는 집합 (Java HashSet)
    let mut tags: HashSet<&str> = HashSet::new();
    tags.insert("rust");
    tags.insert("web");
    let dup = tags.insert("rust"); // 이미 있으면 false
    println!("  HashSet len={}, 다시 넣기 성공? {}", tags.len(), dup);

    // BTreeMap — 키 기준 정렬된 맵 (Java TreeMap)
    let mut scores = BTreeMap::new();
    scores.insert("charlie", 70);
    scores.insert("alice", 90);
    scores.insert("bob", 80);
    println!("  BTreeMap (정렬됨) = {:?}", scores);

    // VecDeque — 양쪽 끝 추가/삭제가 빠른 큐 (Java ArrayDeque)
    let mut q = VecDeque::new();
    q.push_back(1);
    q.push_back(2);
    q.push_front(0);
    println!("  VecDeque = {:?}", q);
    // ⚠️ println!("{:?} {:?}", q, q.pop_front()); 처럼 한 줄에 쓰면 컴파일 에러(E0502)!
    //    q 를 읽기로 빌린(&q) 상태에서 pop_front 가 q 를 수정(&mut q)하려 하기 때문 → ch04 빌림 규칙
    let front = q.pop_front();
    println!("  pop_front = {:?}, 남은 것 = {:?}", front, q);
}

// =============================================================================
// 📝 정리
// =============================================================================
//   Vec:      vec![..], push, pop, get(i)→Option, len, contains(&x), retain, sort
//   HashMap:  insert, get(&k)→Option<&V>, get_mut, remove(&k)→Option<V>,
//             values(), keys(), entry(k).or_insert(v)
//   String:   String::from / to_string / into / format!
//             push_str, +=, trim, split, split_once, replace, parse, chars()
//             == 로 내용 비교
//
// ✏️ 직접 해보기
//   1. hashmap_basics 에서 todos.get(1) 처럼 & 없이 호출하면 어떤 에러가 나나요?
//   2. entry API 로 "완료/미완료 개수"를 HashMap<bool, u32> 로 세어보세요.
// =============================================================================
