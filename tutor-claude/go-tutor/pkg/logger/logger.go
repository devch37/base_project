package logger

import (
	"log"
	"os"
)

// Logger wraps the standard logger with custom functionality
// 커스텀 로거 래퍼
//
// 로깅의 중요성:
// - 디버깅 및 문제 해결
// - 모니터링 및 알림
// - 감사 로그 (Audit Log)
//
// 현재는 간단한 구현, 프로덕션에서는:
// - Structured logging (zerolog, zap)
// - Log levels (DEBUG, INFO, WARN, ERROR)
// - Log rotation
// - 중앙 집중식 로깅 (ELK, Datadog)
type Logger struct {
	logger *log.Logger
}

// New creates a new logger instance
// 로거 인스턴스 생성
func New() *Logger {
	return &Logger{
		logger: log.New(os.Stdout, "", log.LstdFlags),
	}
}

// Info logs an informational message
// 정보 로그
func (l *Logger) Info(msg string, args ...interface{}) {
	l.logger.Printf("[INFO] "+msg, args...)
}

// Error logs an error message
// 에러 로그
func (l *Logger) Error(msg string, args ...interface{}) {
	l.logger.Printf("[ERROR] "+msg, args...)
}

// Debug logs a debug message
// 디버그 로그
func (l *Logger) Debug(msg string, args ...interface{}) {
	l.logger.Printf("[DEBUG] "+msg, args...)
}

// Warn logs a warning message
// 경고 로그
func (l *Logger) Warn(msg string, args ...interface{}) {
	l.logger.Printf("[WARN] "+msg, args...)
}

/*
주요 학습 포인트:

1. Logger Pattern
   - 표준 로거를 래핑
   - 일관된 로그 형식
   - 확장 가능한 구조

2. Log Levels
   - INFO: 일반 정보
   - ERROR: 에러 발생
   - DEBUG: 디버깅 정보
   - WARN: 경고

3. Variadic Parameters (...interface{})
   - 가변 인자 함수
   - Printf 스타일 포맷팅
   - 유연한 로깅

프로덕션 개선안:

1. Structured Logging
   logger.Info("User created",
       "user_id", 123,
       "email", "user@example.com")

2. Context 전파
   logger.WithContext(ctx).Info("Request processed")

3. External Libraries
   - github.com/rs/zerolog
   - go.uber.org/zap
   - github.com/sirupsen/logrus
*/
