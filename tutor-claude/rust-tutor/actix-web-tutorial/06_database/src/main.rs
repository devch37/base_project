// =============================================================================
// 챕터 06: 데이터베이스 연동 - SQLx + SQLite CRUD
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. SQLx로 비동기 DB 연결하기
// 2. 커넥션 풀(Connection Pool) 설정
// 3. SQL 쿼리 실행 (CREATE, INSERT, SELECT, UPDATE, DELETE)
// 4. DB 커넥션 풀을 App State로 공유하기
// 5. 실제 CRUD API 구현
//
// SQLite를 사용하는 이유:
// - 별도의 서버 설치 불필요 (파일 하나로 동작)
// - 개발/학습에 적합
// - 실무에서는 PostgreSQL, MySQL 등을 사용합니다
//   (SQLx는 같은 코드로 다른 DB도 지원합니다!)
//
// =============================================================================

use actix_web::{delete, get, post, put, web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};

// =============================================================================
// 데이터 모델
// =============================================================================

// FromRow: sqlx 쿼리 결과를 자동으로 구조체로 변환합니다
#[derive(Debug, Serialize, FromRow, Clone)]
struct Todo {
    id: i64,               // SQLite의 INTEGER는 i64로 매핑됩니다
    title: String,
    completed: bool,       // SQLite의 BOOLEAN은 bool로 매핑됩니다
    created_at: String,    // SQLite의 DATETIME은 String으로 받습니다
}

#[derive(Deserialize)]
struct CreateTodoRequest {
    title: String,
}

#[derive(Deserialize)]
struct UpdateTodoRequest {
    title: Option<String>,
    completed: Option<bool>,
}

// =============================================================================
// 데이터베이스 초기화
// =============================================================================

// 테이블 생성 및 초기 데이터 삽입
async fn init_database(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // CREATE TABLE IF NOT EXISTS: 테이블이 없을 때만 생성합니다
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS todos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            completed   BOOLEAN NOT NULL DEFAULT FALSE,
            created_at  DATETIME DEFAULT (datetime('now', 'localtime'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // 초기 데이터 삽입 (이미 있으면 무시)
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO todos (id, title, completed)
        VALUES (1, 'SQLx 학습하기', FALSE),
               (2, 'Actix Web 마스터하기', FALSE)
        "#,
    )
    .execute(pool)
    .await?;

    tracing::info!("데이터베이스 초기화 완료");
    Ok(())
}

// =============================================================================
// 핸들러 함수들
// =============================================================================

// 모든 Todo 조회
#[get("/todos")]
async fn list_todos(
    // SqlitePool: web::Data로 공유되는 커넥션 풀
    pool: web::Data<SqlitePool>
) -> impl Responder {
    // sqlx::query_as::<_, Todo>(): 쿼리 결과를 Todo 구조체로 자동 변환
    // fetch_all(): 모든 행을 Vec으로 반환합니다
    match sqlx::query_as::<_, Todo>("SELECT * FROM todos ORDER BY id")
        .fetch_all(pool.get_ref())  // pool.get_ref(): Data<T>에서 &T를 꺼냅니다
        .await
    {
        Ok(todos) => HttpResponse::Ok().json(serde_json::json!({
            "count": todos.len(),
            "todos": todos
        })),
        Err(e) => {
            tracing::error!("DB 조회 오류: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "데이터베이스 오류가 발생했습니다"
            }))
        }
    }
}

// 특정 Todo 조회
#[get("/todos/{id}")]
async fn get_todo(
    pool: web::Data<SqlitePool>,
    path: web::Path<i64>,
) -> impl Responder {
    let id = path.into_inner();

    // fetch_optional(): 0개 또는 1개의 결과를 Option으로 반환합니다
    match sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = ?")
        .bind(id)  // ? 플레이스홀더에 값을 바인딩합니다 (SQL 인젝션 방지!)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(todo)) => HttpResponse::Ok().json(todo),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Todo {} 를 찾을 수 없습니다", id)
        })),
        Err(e) => {
            tracing::error!("DB 오류: {}", e);
            HttpResponse::InternalServerError().body("서버 오류")
        }
    }
}

// 새 Todo 생성
#[post("/todos")]
async fn create_todo(
    pool: web::Data<SqlitePool>,
    body: web::Json<CreateTodoRequest>,
) -> impl Responder {
    let title = body.into_inner().title;

    // INSERT 쿼리 실행
    // query!() 매크로는 컴파일타임에 SQL을 검증합니다 (DATABASE_URL 환경변수 필요)
    // 여기서는 query()를 사용합니다 (런타임 검증)
    match sqlx::query(
        "INSERT INTO todos (title) VALUES (?) RETURNING id, title, completed, created_at"
    )
    .bind(&title)
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(row) => {
            // sqlx::Row 트레이트로 컬럼값 직접 추출
            use sqlx::Row;
            let todo = Todo {
                id: row.get("id"),
                title: row.get("title"),
                completed: row.get("completed"),
                created_at: row.get("created_at"),
            };
            HttpResponse::Created().json(todo)
        }
        Err(e) => {
            tracing::error!("Todo 생성 오류: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Todo 생성에 실패했습니다"
            }))
        }
    }
}

// Todo 수정
#[put("/todos/{id}")]
async fn update_todo(
    pool: web::Data<SqlitePool>,
    path: web::Path<i64>,
    body: web::Json<UpdateTodoRequest>,
) -> impl Responder {
    let id = path.into_inner();
    let update = body.into_inner();

    // 먼저 존재 여부 확인
    let existing = sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = ?")
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await;

    match existing {
        Ok(Some(mut todo)) => {
            // 제공된 필드만 업데이트합니다
            if let Some(title) = update.title {
                todo.title = title;
            }
            if let Some(completed) = update.completed {
                todo.completed = completed;
            }

            // UPDATE 쿼리
            match sqlx::query(
                "UPDATE todos SET title = ?, completed = ? WHERE id = ?"
            )
            .bind(&todo.title)
            .bind(todo.completed)
            .bind(id)
            .execute(pool.get_ref())
            .await
            {
                Ok(_) => HttpResponse::Ok().json(todo),
                Err(e) => {
                    tracing::error!("Todo 업데이트 오류: {}", e);
                    HttpResponse::InternalServerError().body("서버 오류")
                }
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Todo {} 를 찾을 수 없습니다", id)
        })),
        Err(e) => {
            tracing::error!("DB 오류: {}", e);
            HttpResponse::InternalServerError().body("서버 오류")
        }
    }
}

// Todo 삭제
#[delete("/todos/{id}")]
async fn delete_todo(
    pool: web::Data<SqlitePool>,
    path: web::Path<i64>,
) -> impl Responder {
    let id = path.into_inner();

    // DELETE 쿼리
    // rows_affected(): 영향받은 행 수를 반환합니다
    match sqlx::query("DELETE FROM todos WHERE id = ?")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            HttpResponse::NoContent().finish()  // 204 No Content
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({
            "error": format!("Todo {} 를 찾을 수 없습니다", id)
        })),
        Err(e) => {
            tracing::error!("Todo 삭제 오류: {}", e);
            HttpResponse::InternalServerError().body("서버 오류")
        }
    }
}

// =============================================================================
// 메인 함수
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    // SQLite 데이터베이스 파일 경로
    // ":memory:" 를 사용하면 인메모리 DB를 사용합니다 (앱 종료 시 삭제)
    let database_url = "sqlite:todos.db";

    // SqlitePool::connect(): 커넥션 풀을 생성합니다
    // 커넥션 풀: 미리 DB 연결을 여러 개 만들어 두고 재사용합니다 (성능 향상)
    let pool = SqlitePool::connect(database_url)
        .await
        .expect("데이터베이스 연결 실패");

    // 데이터베이스 초기화 (테이블 생성 등)
    init_database(&pool)
        .await
        .expect("데이터베이스 초기화 실패");

    tracing::info!("Todo DB API 서버 시작: http://127.0.0.1:8085");
    println!();
    println!("=== DB CRUD 테스트 ===");
    println!("# 모든 Todo 조회:");
    println!("curl http://127.0.0.1:8085/todos");
    println!();
    println!("# Todo 생성:");
    println!("curl -X POST http://127.0.0.1:8085/todos \\");
    println!("  -H 'Content-Type: application/json' \\");
    println!("  -d '{{\"title\": \"새로운 할 일\"}}'");
    println!();
    println!("# Todo 완료 처리:");
    println!("curl -X PUT http://127.0.0.1:8085/todos/1 \\");
    println!("  -H 'Content-Type: application/json' \\");
    println!("  -d '{{\"completed\": true}}'");
    println!();
    println!("# Todo 삭제:");
    println!("curl -X DELETE http://127.0.0.1:8085/todos/1");

    // web::Data::new()로 풀을 감싸서 핸들러 간 공유합니다
    let pool_data = web::Data::new(pool);

    HttpServer::new(move || {
        App::new()
            .app_data(pool_data.clone())  // 커넥션 풀 공유
            .service(list_todos)
            .service(get_todo)
            .service(create_todo)
            .service(update_todo)
            .service(delete_todo)
    })
    .bind(("127.0.0.1", 8085))?
    .run()
    .await
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// SQLx 핵심 API:
//   SqlitePool::connect(url)       = 커넥션 풀 생성
//   sqlx::query("SQL")             = 런타임 검증 쿼리
//   sqlx::query_as::<_, T>("SQL")  = 결과를 T로 자동 변환
//   .bind(value)                   = 파라미터 바인딩 (SQL 인젝션 방지)
//   .fetch_all(pool)               = 모든 행 반환 (Vec<T>)
//   .fetch_one(pool)               = 한 행 반환 (없으면 에러)
//   .fetch_optional(pool)          = 0~1개 반환 (Option<T>)
//   .execute(pool)                 = INSERT/UPDATE/DELETE 실행
//
// FromRow 파생 매크로:
//   #[derive(FromRow)]: SELECT 결과를 구조체로 자동 변환
//   필드명이 컬럼명과 일치해야 합니다
//   #[sqlx(rename = "column_name")]: 다른 이름 매핑
//
// 커넥션 풀 공유:
//   web::Data::new(pool) + .app_data(pool_data.clone())
//   핸들러에서 pool: web::Data<SqlitePool>로 받기
//
// 다음 단계: 07_error_handling에서 체계적인 에러 처리를 배웁니다!
// =============================================================================
