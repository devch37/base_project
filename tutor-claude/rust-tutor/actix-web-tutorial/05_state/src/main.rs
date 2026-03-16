// =============================================================================
// 챕터 05: 앱 상태 공유 - Data<T>, Mutex, Arc
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. App State란 무엇인가
// 2. web::Data<T>로 상태 공유하기
// 3. Mutex를 이용한 안전한 가변 상태 관리
// 4. 여러 핸들러 간 데이터 공유
// 5. 실용적인 인메모리 저장소 패턴
//
// 왜 Mutex가 필요한가?
// Actix Web은 멀티스레드 환경입니다. 여러 스레드가 동시에 데이터를 수정하면
// 데이터 경쟁(Data Race)이 발생할 수 있습니다.
// Mutex: Mutual Exclusion (상호 배제) - 한 번에 하나의 스레드만 접근 허용
//
// =============================================================================

use actix_web::{delete, get, post, put, web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex; // Mutex: 스레드 안전한 가변성 보장

// =============================================================================
// 데이터 모델
// =============================================================================

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Todo {
    id: u64,
    title: String,
    completed: bool,
}

// =============================================================================
// 앱 상태 구조체
// =============================================================================

// 여러 핸들러 간에 공유될 상태를 정의합니다
struct AppState {
    // Mutex<HashMap<...>>: 여러 스레드가 안전하게 읽고 쓸 수 있습니다
    todos: Mutex<HashMap<u64, Todo>>,
    // Mutex<u64>: 자동 증가 ID (스레드 안전)
    next_id: Mutex<u64>,
    // 변경이 필요 없는 설정값은 Mutex 없이 사용할 수 있습니다
    app_name: String,
    version: String,
}

// AppState에 초기 데이터를 설정하는 생성자 함수
impl AppState {
    fn new() -> Self {
        let mut initial_todos = HashMap::new();

        // 초기 데이터 삽입
        let sample_todo = Todo {
            id: 1,
            title: "Actix Web 공부하기".to_string(),
            completed: false,
        };
        initial_todos.insert(1, sample_todo);

        AppState {
            todos: Mutex::new(initial_todos),
            next_id: Mutex::new(2),  // 다음 ID는 2부터 시작
            app_name: "Todo API".to_string(),
            version: "1.0.0".to_string(),
        }
    }
}

// =============================================================================
// 핸들러 함수들
// =============================================================================

// 앱 정보 조회
#[get("/info")]
async fn get_info(
    // web::Data<AppState>: App::app_data()로 등록한 상태에 접근합니다
    // Arc<AppState>와 같습니다 - 스레드 안전하게 클론됩니다
    state: web::Data<AppState>
) -> impl Responder {
    // 불변 데이터는 Mutex 없이 직접 접근합니다
    HttpResponse::Ok().json(serde_json::json!({
        "app_name": state.app_name,
        "version": state.version,
    }))
}

// 모든 Todo 조회
#[get("/todos")]
async fn list_todos(state: web::Data<AppState>) -> impl Responder {
    // Mutex::lock(): 잠금을 얻고 MutexGuard를 반환합니다
    // MutexGuard가 drop되면 자동으로 잠금이 해제됩니다
    // .unwrap(): 잠금 실패(다른 스레드가 패닉) 시 패닉 - 실무에서는 처리 필요
    let todos = state.todos.lock().unwrap();

    // HashMap에서 모든 값을 Vec으로 변환합니다
    let todo_list: Vec<&Todo> = todos.values().collect();

    HttpResponse::Ok().json(serde_json::json!({
        "count": todo_list.len(),
        "todos": todo_list
    }))
}

// 특정 Todo 조회
#[get("/todos/{id}")]
async fn get_todo(
    state: web::Data<AppState>,
    path: web::Path<u64>,
) -> impl Responder {
    let id = path.into_inner();
    let todos = state.todos.lock().unwrap();

    match todos.get(&id) {
        Some(todo) => HttpResponse::Ok().json(todo),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Todo {} 를 찾을 수 없습니다", id)
        })),
    }
}

// 새 Todo 생성
#[derive(Deserialize)]
struct CreateTodoRequest {
    title: String,
}

#[post("/todos")]
async fn create_todo(
    state: web::Data<AppState>,
    body: web::Json<CreateTodoRequest>,
) -> impl Responder {
    // next_id 잠금 획득 및 ID 생성
    let id = {
        // 블록({}): 잠금의 스코프를 제한합니다
        // 블록을 벗어나면 next_id_guard가 drop되어 잠금이 해제됩니다
        let mut next_id = state.next_id.lock().unwrap();
        let id = *next_id;     // 현재 ID 복사
        *next_id += 1;          // ID 증가
        id                      // 현재 ID 반환
    }; // 여기서 next_id 잠금 해제

    // 새 Todo 생성
    let todo = Todo {
        id,
        title: body.into_inner().title,
        completed: false,
    };

    // todos 잠금 획득 및 삽입
    let mut todos = state.todos.lock().unwrap();
    todos.insert(id, todo.clone());

    HttpResponse::Created().json(todo)
}

// Todo 수정
#[derive(Deserialize)]
struct UpdateTodoRequest {
    title: Option<String>,
    completed: Option<bool>,
}

#[put("/todos/{id}")]
async fn update_todo(
    state: web::Data<AppState>,
    path: web::Path<u64>,
    body: web::Json<UpdateTodoRequest>,
) -> impl Responder {
    let id = path.into_inner();
    let update = body.into_inner();

    let mut todos = state.todos.lock().unwrap();

    match todos.get_mut(&id) {
        Some(todo) => {
            // Option::if let 패턴으로 선택적 업데이트
            if let Some(title) = update.title {
                todo.title = title;
            }
            if let Some(completed) = update.completed {
                todo.completed = completed;
            }
            HttpResponse::Ok().json(todo.clone())
        }
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Todo {} 를 찾을 수 없습니다", id)
        })),
    }
}

// Todo 삭제
#[delete("/todos/{id}")]
async fn delete_todo(
    state: web::Data<AppState>,
    path: web::Path<u64>,
) -> impl Responder {
    let id = path.into_inner();
    let mut todos = state.todos.lock().unwrap();

    match todos.remove(&id) {
        Some(_) => HttpResponse::NoContent().finish(),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Todo {} 를 찾을 수 없습니다", id)
        })),
    }
}

// =============================================================================
// 메인 함수
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Todo API 서버 시작: http://127.0.0.1:8084");
    println!();
    println!("=== Todo API 테스트 ===");
    println!("# 앱 정보:");
    println!("curl http://127.0.0.1:8084/info");
    println!();
    println!("# 모든 Todo 조회:");
    println!("curl http://127.0.0.1:8084/todos");
    println!();
    println!("# Todo 생성:");
    println!("curl -X POST http://127.0.0.1:8084/todos \\");
    println!("  -H 'Content-Type: application/json' \\");
    println!("  -d '{{\"title\": \"새로운 할 일\"}}'");
    println!();
    println!("# Todo 완료 처리:");
    println!("curl -X PUT http://127.0.0.1:8084/todos/1 \\");
    println!("  -H 'Content-Type: application/json' \\");
    println!("  -d '{{\"completed\": true}}'");
    println!();
    println!("# Todo 삭제:");
    println!("curl -X DELETE http://127.0.0.1:8084/todos/1");

    // web::Data::new(): Arc로 감싸서 스레드 안전하게 만듭니다
    // 내부적으로 Arc<AppState>가 됩니다
    let state = web::Data::new(AppState::new());

    HttpServer::new(move || {
        // move: 클로저가 state를 소유합니다
        // state.clone(): Arc의 clone이라 깊은 복사 없이 참조 카운트만 증가합니다
        App::new()
            // .app_data(): 앱 상태를 등록합니다
            .app_data(state.clone())
            .service(get_info)
            .service(list_todos)
            .service(get_todo)
            .service(create_todo)
            .service(update_todo)
            .service(delete_todo)
    })
    .bind(("127.0.0.1", 8084))?
    .run()
    .await
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// App State 패턴:
//   1. struct AppState { data: Mutex<T> } 정의
//   2. web::Data::new(AppState::new()) 생성
//   3. App::new().app_data(state.clone()) 등록
//   4. 핸들러에서 state: web::Data<AppState> 로 받기
//
// Mutex 사용법:
//   let mut guard = mutex.lock().unwrap();  // 잠금 획득
//   *guard = new_value;                     // 값 수정
//   // guard가 drop되면 자동으로 잠금 해제
//
// Arc vs Mutex:
//   Arc<T>  = 여러 스레드에서 읽기 공유 (불변)
//   Mutex<T> = 여러 스레드에서 쓰기 가능 (가변)
//   Arc<Mutex<T>> = 여러 스레드에서 읽고 쓰기 가능
//   web::Data<T> = 내부적으로 Arc<T> 사용
//
// 실무 팁:
//   메모리 DB는 개발/테스트용. 실제 서비스는 06_database 챕터의 SQLite/PostgreSQL 사용
//
// 다음 단계: 06_database에서 실제 DB와 연동해봅니다!
// =============================================================================
