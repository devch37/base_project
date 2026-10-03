// =============================================================================
// 연습문제 03: 웹 서버 준비 (ch09 ~ ch13 범위)
// =============================================================================
// 채점: cargo test --bin ex03_web_ready
//
// actix 05_state 의 Todo API 를 프레임워크 없이 "핵심 로직만" 직접 만들어 봅니다.
// 이걸 풀 수 있으면 actix-web-tutorial 코드가 훨씬 잘 읽힐 거예요.
// =============================================================================

#![allow(dead_code, unused_variables, unused_imports)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

fn main() {
    println!("이 파일은 테스트로 채점합니다: cargo test --bin ex03_web_ready");
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct Todo {
    id: u64,
    title: String,
    completed: bool,
}

// -----------------------------------------------------------------------------
// 문제 1 (ch09): 완료된 Todo 의 제목만 id 오름차순으로 모아서 반환
// 힌트: iter → filter → 정렬이 필요하면 먼저 Vec 으로 모아 sort_by_key → map → collect
// -----------------------------------------------------------------------------
fn completed_titles(todos: &[Todo]) -> Vec<String> {
    todo!()
}

// -----------------------------------------------------------------------------
// 문제 2 (ch10): 단어별 등장 횟수 세기 (소문자로 통일)
// 힌트: entry API — *map.entry(key).or_insert(0) += 1
// -----------------------------------------------------------------------------
fn word_count(text: &str) -> HashMap<String, usize> {
    todo!()
}

// -----------------------------------------------------------------------------
// 문제 3 (ch12): JSON 요청 파싱 + 검증
//   - JSON 형식이 잘못되면 Err("JSON 파싱 실패: {serde 에러 메시지}")
//   - title 이 공백뿐이면 Err("제목이 비어 있습니다")
//   - 성공하면 title 의 앞뒤 공백을 제거(trim)한 요청을 Ok 로
// 힌트: serde_json::from_str::<CreateTodoRequest>(json).map_err(|e| format!(...))?
// -----------------------------------------------------------------------------
#[derive(Debug, Deserialize)]
struct CreateTodoRequest {
    title: String,
}

fn parse_create_request(json: &str) -> Result<CreateTodoRequest, String> {
    todo!()
}

// -----------------------------------------------------------------------------
// 문제 4 (ch11): 스레드 안전한 Todo 저장소 (actix 05_state 의 AppState)
// -----------------------------------------------------------------------------
struct TodoStore {
    todos: Mutex<HashMap<u64, Todo>>,
    next_id: Mutex<u64>,
}

impl TodoStore {
    // 비어 있는 저장소. next_id 는 1 부터
    fn new() -> Self {
        todo!()
    }

    // 새 Todo 생성 후 저장하고, 생성된 Todo 를 반환 (completed = false)
    // 힌트: ch11 의 create_todo — id 발급은 { } 블록으로 잠금 범위 최소화
    fn create(&self, title: &str) -> Todo {
        todo!()
    }

    // id 로 조회. 없으면 None. (잠금 안의 데이터를 밖으로 꺼내려면 clone 필요!)
    // 힌트: self.todos.lock().unwrap().get(&id).cloned()
    fn get(&self, id: u64) -> Option<Todo> {
        todo!()
    }

    // 완료 처리. 있으면 completed = true 로 바꾸고 true 반환, 없으면 false
    fn complete(&self, id: u64) -> bool {
        todo!()
    }

    // 개수
    fn len(&self) -> usize {
        todo!()
    }
}

// -----------------------------------------------------------------------------
// 문제 5 (ch07, ch12): "핸들러" — (HTTP 상태 코드, JSON 문자열) 을 반환
//   - 있으면 (200, Todo 를 JSON 으로 직렬화한 문자열)
//   - 없으면 (404, json!({"error": "Todo {id} 를 찾을 수 없습니다"}) 의 문자열)
// 힌트: serde_json::to_string(&todo).unwrap(),  serde_json::json!({...}).to_string()
// -----------------------------------------------------------------------------
fn handle_get_todo(store: &TodoStore, id: u64) -> (u16, String) {
    todo!()
}

// -----------------------------------------------------------------------------
// 문제 6 (ch13): 비동기로 여러 사용자 이름을 "동시에" 가져오기
//   fetch_name 은 50ms 걸립니다. ids 가 4개여도 전체가 약 50ms 에 끝나야 합니다.
//   결과는 ids 순서대로.
// 힌트: 각 id 마다 tokio::spawn(fetch_name(id)) 해서 JoinHandle 을 Vec 에 모은 뒤,
//       for h in handles { results.push(h.await.unwrap()) }
// -----------------------------------------------------------------------------
async fn fetch_name(id: u64) -> String {
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    format!("user{}", id)
}

async fn fetch_all(ids: Vec<u64>) -> Vec<String> {
    todo!()
}

// =============================================================================
// 테스트 (수정하지 마세요)
// =============================================================================
#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Instant;

    fn sample() -> Vec<Todo> {
        vec![
            Todo { id: 3, title: "C".into(), completed: true },
            Todo { id: 1, title: "A".into(), completed: true },
            Todo { id: 2, title: "B".into(), completed: false },
        ]
    }

    #[test]
    fn test_completed_titles() {
        assert_eq!(completed_titles(&sample()), vec!["A", "C"]);
    }

    #[test]
    fn test_word_count() {
        let m = word_count("Rust is fast rust IS safe");
        assert_eq!(m["rust"], 2);
        assert_eq!(m["is"], 2);
        assert_eq!(m["safe"], 1);
        assert_eq!(m.len(), 4);
    }

    #[test]
    fn test_parse_create_request() {
        assert_eq!(parse_create_request(r#"{"title":"  공부  "}"#).unwrap().title, "공부");
        assert_eq!(parse_create_request(r#"{"title":"   "}"#).unwrap_err(), "제목이 비어 있습니다");
        assert!(parse_create_request("{oops").unwrap_err().starts_with("JSON 파싱 실패"));
    }

    #[test]
    fn test_store_basic() {
        let store = TodoStore::new();
        let t = store.create("공부");
        assert_eq!(t, Todo { id: 1, title: "공부".into(), completed: false });
        assert_eq!(store.create("운동").id, 2);
        assert!(store.complete(1));
        assert!(!store.complete(99));
        assert!(store.get(1).unwrap().completed);
        assert_eq!(store.get(99), None);
        assert_eq!(store.len(), 2);
    }

    #[test]
    fn test_store_concurrent() {
        // actix 처럼 여러 워커 스레드가 같은 저장소를 공유
        let store = Arc::new(TodoStore::new());
        let handles: Vec<_> = (0..8)
            .map(|i| {
                let store = Arc::clone(&store);
                thread::spawn(move || {
                    for j in 0..25 {
                        store.create(&format!("{}-{}", i, j));
                    }
                })
            })
            .collect();
        for h in handles {
            h.join().unwrap();
        }
        assert_eq!(store.len(), 200); // id 가 겹치면 HashMap 에서 덮어써져 200 이 안 됨
    }

    #[test]
    fn test_handle_get_todo() {
        let store = TodoStore::new();
        store.create("공부");
        let (code, body) = handle_get_todo(&store, 1);
        assert_eq!(code, 200);
        let parsed: Todo = serde_json::from_str(&body).unwrap();
        assert_eq!(parsed.title, "공부");

        let (code, body) = handle_get_todo(&store, 7);
        assert_eq!(code, 404);
        let v: serde_json::Value = serde_json::from_str(&body).unwrap();
        assert_eq!(v["error"], "Todo 7 를 찾을 수 없습니다");
    }

    // #[tokio::test] : 비동기 테스트 (테스트용 런타임을 띄워줌)
    #[tokio::test]
    async fn test_fetch_all_concurrently() {
        let start = Instant::now();
        let names = fetch_all(vec![1, 2, 3, 4]).await;
        let elapsed = start.elapsed().as_millis();
        assert_eq!(names, vec!["user1", "user2", "user3", "user4"]);
        assert!(elapsed < 150, "동시에 실행되지 않았습니다: {}ms", elapsed);
    }
}
