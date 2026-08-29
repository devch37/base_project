# PostgreSQL + Spring Boot 튜토리얼

로컬 Docker PostgreSQL에 연결해 JDBC URL, 계정, HikariCP 커넥션 풀 설정과 SQL 초기화를 실험할 수 있는 작은 프로젝트입니다.

## 사용 스택

- Java 21
- Spring Boot 4.1.1
- Spring JDBC (`JdbcTemplate`)
- PostgreSQL 17.5 (Docker)
- Gradle 9 Wrapper

## 1. PostgreSQL 실행

```bash
docker run -d --name postgres-tutorial-db -e POSTGRES_DB=tutorial -e POSTGRES_USER=test -e POSTGRES_PASSWORD=1234 -p 5432:5432 postgres:17.5
```

동일한 명령을 담은 스크립트도 사용할 수 있습니다.

```bash
./run-postgres.sh
```

기본 접속 정보는 다음과 같습니다.

| 항목 | 값 |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `tutorial` |
| Username | `tutorial` |
| Password | `tutorial` |

컨테이너 상태와 로그는 다음 명령으로 확인합니다.

```bash
docker ps --filter name=postgres-tutorial-db
docker logs postgres-tutorial-db
```

## 2. 애플리케이션 실행

```bash
./gradlew bootRun
```

다른 접속 설정으로 실행하는 예시:

```bash
DB_URL='jdbc:postgresql://localhost:5433/my_database?sslmode=disable' \
DB_USERNAME='my_user' \
DB_PASSWORD='my_password' \
DB_POOL_MAX_SIZE=5 \
./gradlew bootRun
```

조정 가능한 값은 `src/main/resources/application.yml`에 모아 두었습니다.

## 3. 연결 확인

```bash
# PostgreSQL 서버/DB/사용자/스키마 정보
curl http://localhost:8080/api/database/info

# 초기 더미 데이터 조회
curl http://localhost:8080/api/messages

# 데이터 추가
curl -i -X POST http://localhost:8080/api/messages \
  -H 'Content-Type: application/json' \
  -d '{"code":"CUSTOM","content":"직접 추가한 메시지"}'

# DataSource를 포함한 Spring Boot health 확인
curl http://localhost:8080/actuator/health

# HikariCP 관련 metric 이름 확인
curl http://localhost:8080/actuator/metrics
```

애플리케이션 시작 시 `db/schema.sql`과 `db/data.sql`이 순서대로 실행됩니다. DML에는 `ON CONFLICT DO NOTHING`을 사용했으므로 재시작해도 초기 데이터가 중복되지 않습니다.

## 주요 실험 포인트

- JDBC URL에 `connectTimeout`, `socketTimeout`, `sslmode`, `ApplicationName` 등의 파라미터 추가
- HikariCP의 `maximum-pool-size`, `connection-timeout`, `idle-timeout`, `max-lifetime` 변경
- 잘못된 포트나 비밀번호를 넣고 시작/health 응답 관찰
- `logging.level.com.zaxxer.hikari: DEBUG`로 바꾸고 풀 생성/반납 로그 관찰
- `spring.sql.init.mode: never`로 바꾸고 SQL 자동 초기화 끄기

DB를 초기화하려면 컨테이너를 제거한 뒤 위의 `docker run` 명령을 다시 실행합니다.

```bash
docker rm -f postgres-tutorial-db
```
