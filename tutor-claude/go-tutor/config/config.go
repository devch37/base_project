package config

import (
	"log"
	"os"
	"strconv"
)

// Config holds all application configuration
// 애플리케이션 설정 구조체
//
// 설정 관리 원칙:
// - 환경 변수를 통한 설정 (12-Factor App)
// - 기본값 제공
// - 타입 안전성
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	App      AppConfig
}

// ServerConfig holds server-specific configuration
// 서버 설정
type ServerConfig struct {
	Port string // 서버 포트 (예: "8080")
	Mode string // Gin 모드: "debug", "release", "test"
}

// DatabaseConfig holds database configuration
// 데이터베이스 설정 (향후 사용)
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// AppConfig holds application-level configuration
// 애플리케이션 설정
type AppConfig struct {
	Name        string
	Version     string
	Environment string // "development", "staging", "production"
}

// LoadConfig loads configuration from environment variables
// 환경 변수에서 설정 로드
//
// 12-Factor App 원칙:
// - 설정을 환경에 저장
// - 코드와 설정 분리
// - 다양한 환경(dev, staging, prod)에서 동일한 코드 실행
//
// Go Pattern: 생성자 함수로 설정 초기화
func LoadConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Mode: getEnv("GIN_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "taskdb"),
		},
		App: AppConfig{
			Name:        getEnv("APP_NAME", "Go Tutor API"),
			Version:     getEnv("APP_VERSION", "1.0.0"),
			Environment: getEnv("APP_ENV", "development"),
		},
	}
}

// getEnv reads an environment variable or returns a default value
// 환경 변수 읽기 헬퍼 함수
//
// Go Pattern: 기본값을 가진 환경 변수 읽기
// - 환경 변수가 설정되지 않으면 기본값 사용
// - 개발 환경에서 편의성 제공
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt reads an environment variable as integer or returns a default
// 정수형 환경 변수 읽기 헬퍼 함수
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Printf("Warning: Invalid integer for %s, using default %d", key, defaultValue)
		return defaultValue
	}

	return value
}

// getEnvAsBool reads an environment variable as boolean or returns a default
// 불리언 환경 변수 읽기 헬퍼 함수
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		log.Printf("Warning: Invalid boolean for %s, using default %t", key, defaultValue)
		return defaultValue
	}

	return value
}

// IsDevelopment checks if the app is running in development mode
// 개발 환경 확인
func (c *Config) IsDevelopment() bool {
	return c.App.Environment == "development"
}

// IsProduction checks if the app is running in production mode
// 프로덕션 환경 확인
func (c *Config) IsProduction() bool {
	return c.App.Environment == "production"
}

// GetServerAddress returns the full server address
// 서버 주소 반환 (예: ":8080")
func (c *Config) GetServerAddress() string {
	return ":" + c.Server.Port
}

/*
주요 학습 포인트:

1. Configuration Management (설정 관리)
   - 환경 변수 사용
   - 기본값 제공
   - 타입 안전성

2. 12-Factor App 원칙
   - III. Config: 설정을 환경에 저장
   - 코드와 설정 분리
   - 환경별 다른 설정 사용

3. Go 환경 변수
   - os.Getenv(key): 환경 변수 읽기
   - 타입 변환 (string, int, bool)
   - 에러 처리

4. 구조체 조직화
   - 관련 설정을 그룹화
   - 계층적 구조
   - 명확한 네이밍

5. 헬퍼 메서드
   - IsDevelopment(), IsProduction()
   - 설정 값 기반 로직
   - 코드 가독성 향상

사용 예시:

// 환경 변수 설정
export SERVER_PORT=8080
export GIN_MODE=release
export APP_ENV=production

// 코드에서 사용
cfg := config.LoadConfig()
fmt.Println(cfg.Server.Port)  // "8080"
if cfg.IsProduction() {
    // 프로덕션 전용 로직
}

환경 변수 파일 (.env):
SERVER_PORT=8080
GIN_MODE=debug
APP_ENV=development
DB_HOST=localhost
DB_PORT=5432

프로덕션에서:
- 환경 변수는 CI/CD에서 주입
- Kubernetes Secrets
- AWS Parameter Store
- Docker environment variables
*/
