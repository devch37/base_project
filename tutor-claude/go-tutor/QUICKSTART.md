# Quick Start Guide

10분 안에 프로젝트를 실행하고 첫 API 호출을 해봅시다!

## Prerequisites

Go 1.21 이상이 설치되어 있어야 합니다.

```bash
# Go 버전 확인
go version
```

## Step 1: 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd /Users/chulhanlee/Desktop/workspace/study/base_project/tutor-claude/go-tutor

# Go 모듈 초기화 및 의존성 다운로드
go mod download
```

## Step 2: 애플리케이션 실행

```bash
# 애플리케이션 시작
go run cmd/api/main.go
```

다음과 같은 로그가 보이면 성공:
```
2024/02/10 00:00:00 Starting Go Tutor API v1.0.0 in development mode
[INFO] Logger initialized
[INFO] Task repository initialized (in-memory)
[INFO] Task use case initialized
[INFO] Task handler initialized
[INFO] Routes configured
[INFO] Starting server on :8080
```

## Step 3: API 테스트

새 터미널을 열고 다음 명령어를 실행하세요.

### 1. Health Check
```bash
curl http://localhost:8080/health
```

예상 응답:
```json
{
  "status": "ok",
  "service": "go-tutor-api"
}
```

### 2. Task 생성
```bash
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Go",
    "description": "Study Go fundamentals and best practices"
  }'
```

예상 응답:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "title": "Learn Go",
    "description": "Study Go fundamentals and best practices",
    "status": "pending",
    "created_at": "2024-02-10T00:00:00Z",
    "updated_at": "2024-02-10T00:00:00Z"
  }
}
```

### 3. 모든 Task 조회
```bash
curl http://localhost:8080/api/v1/tasks
```

### 4. 특정 Task 조회
```bash
curl http://localhost:8080/api/v1/tasks/1
```

### 5. Task 수정
```bash
curl -X PUT http://localhost:8080/api/v1/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Go",
    "description": "Study Go fundamentals, Gin framework, and clean architecture",
    "status": "in_progress"
  }'
```

### 6. Task 완료 표시
```bash
curl -X POST http://localhost:8080/api/v1/tasks/1/complete
```

### 7. Task 삭제
```bash
curl -X DELETE http://localhost:8080/api/v1/tasks/1
```

## Step 4: 테스트 실행

```bash
# 모든 테스트 실행
go test ./... -v

# 특정 패키지 테스트
go test ./internal/usecase/... -v

# 커버리지 확인
go test ./... -cover

# 커버리지 상세 보기
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## Step 5: 코드 탐색 순서

프로젝트를 이해하기 위한 권장 순서:

1. **README.md** - 프로젝트 전체 구조 이해
2. **internal/domain/task.go** - 도메인 엔티티 이해
3. **internal/repository/task_repository.go** - Repository 패턴 이해
4. **internal/repository/memory/task_memory.go** - 구현 예시
5. **internal/usecase/task_usecase.go** - 비즈니스 로직
6. **internal/delivery/http/task_handler.go** - HTTP 핸들러
7. **cmd/api/main.go** - 의존성 주입과 초기화
8. **LEARNING_GUIDE.md** - 상세 학습 가이드

## 일반적인 문제 해결

### 포트가 이미 사용 중
```bash
# 다른 포트로 실행
SERVER_PORT=8081 go run cmd/api/main.go
```

### 의존성 에러
```bash
# 의존성 정리
go mod tidy

# 캐시 정리
go clean -modcache

# 다시 다운로드
go mod download
```

### Import 에러
프로젝트에서 `github.com/yourusername/go-tutor`를 사용합니다.
실제 사용 시 go.mod 파일의 module 경로를 수정하세요.

## 다음 단계

1. **코드 읽기**: 각 파일의 주석을 주의 깊게 읽으세요
2. **실습 과제**: LEARNING_GUIDE.md의 과제를 수행하세요
3. **기능 추가**: 새로운 기능을 직접 추가해보세요
4. **테스트 작성**: 새로운 기능에 대한 테스트를 작성하세요

## 유용한 명령어

```bash
# 빌드
go build -o bin/api cmd/api/main.go

# 실행 (빌드된 바이너리)
./bin/api

# 포맷팅
go fmt ./...

# Lint (golangci-lint 설치 필요)
golangci-lint run

# 벤치마크
go test -bench=. ./...

# 프로파일링
go test -cpuprofile=cpu.prof -memprofile=mem.prof
```

## VS Code 설정 (선택사항)

`.vscode/settings.json` 생성:
```json
{
  "go.useLanguageServer": true,
  "go.formatTool": "goimports",
  "go.lintTool": "golangci-lint",
  "editor.formatOnSave": true,
  "[go]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  }
}
```

## 추가 학습 자료

- [Go Documentation](https://go.dev/doc/)
- [Gin Documentation](https://gin-gonic.com/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

즐거운 학습 되세요! 🚀
