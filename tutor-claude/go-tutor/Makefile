# Makefile for Go-Gin Tutorial Project
# Go 프로젝트 관리를 위한 Makefile

.PHONY: help run build test clean fmt lint install dev

# Default target - show help
# 기본 타겟 - 도움말 표시
help:
	@echo "Go-Gin Tutorial Project - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make run       - Run the application"
	@echo "  make dev       - Run with auto-reload (requires air)"
	@echo "  make test      - Run all tests"
	@echo "  make test-v    - Run tests with verbose output"
	@echo "  make coverage  - Run tests with coverage"
	@echo ""
	@echo "Build:"
	@echo "  make build     - Build the application"
	@echo "  make install   - Install dependencies"
	@echo ""
	@echo "Code Quality:"
	@echo "  make fmt       - Format code"
	@echo "  make lint      - Run linter (requires golangci-lint)"
	@echo "  make clean     - Clean build artifacts"
	@echo ""
	@echo "Quick Start:"
	@echo "  make install && make run"

# Run the application
# 애플리케이션 실행
run:
	@echo "Starting server..."
	go run cmd/api/main.go

# Run with air for auto-reload (development)
# Air를 사용한 자동 리로드 개발 모드
dev:
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Air not installed. Install with: go install github.com/cosmtrek/air@latest"; \
		echo "Running without auto-reload..."; \
		go run cmd/api/main.go; \
	fi

# Build the application
# 애플리케이션 빌드
build:
	@echo "Building application..."
	@mkdir -p bin
	go build -o bin/api cmd/api/main.go
	@echo "Build complete: bin/api"

# Install dependencies
# 의존성 설치
install:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy
	@echo "Dependencies installed"

# Run tests
# 테스트 실행
test:
	@echo "Running tests..."
	go test ./... -v

# Run tests with verbose output
# 상세 출력과 함께 테스트 실행
test-v:
	@echo "Running tests (verbose)..."
	go test ./... -v -count=1

# Run tests with coverage
# 커버리지와 함께 테스트 실행
coverage:
	@echo "Running tests with coverage..."
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Format code
# 코드 포맷팅
fmt:
	@echo "Formatting code..."
	go fmt ./...
	@if command -v goimports > /dev/null; then \
		goimports -w .; \
	fi
	@echo "Code formatted"

# Run linter
# 린터 실행
lint:
	@if command -v golangci-lint > /dev/null; then \
		echo "Running linter..."; \
		golangci-lint run ./...; \
	else \
		echo "golangci-lint not installed"; \
		echo "Install with: brew install golangci-lint"; \
		echo "Or: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

# Clean build artifacts
# 빌드 아티팩트 정리
clean:
	@echo "Cleaning..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	go clean
	@echo "Clean complete"

# Docker commands
# Docker 명령어
docker-build:
	@echo "Building Docker image..."
	docker build -t go-tutor-api .

docker-run:
	@echo "Running Docker container..."
	docker run -p 8080:8080 go-tutor-api

# Database commands (for future use)
# 데이터베이스 명령어 (향후 사용)
db-up:
	@echo "Starting database..."
	docker-compose up -d postgres

db-down:
	@echo "Stopping database..."
	docker-compose down

# API testing with curl
# curl을 사용한 API 테스트
test-api:
	@echo "Testing API endpoints..."
	@echo "\n1. Health check:"
	curl -s http://localhost:8080/health | jq
	@echo "\n2. Create task:"
	curl -s -X POST http://localhost:8080/api/v1/tasks \
		-H "Content-Type: application/json" \
		-d '{"title":"Test Task","description":"Test Description"}' | jq
	@echo "\n3. Get all tasks:"
	curl -s http://localhost:8080/api/v1/tasks | jq

# Generate project documentation
# 프로젝트 문서 생성
docs:
	@echo "Generating documentation..."
	@if command -v godoc > /dev/null; then \
		echo "Starting godoc server on http://localhost:6060"; \
		godoc -http=:6060; \
	else \
		echo "godoc not installed"; \
		echo "Install with: go install golang.org/x/tools/cmd/godoc@latest"; \
	fi
