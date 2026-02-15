package http

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware logs HTTP request details
// HTTP 요청 로깅 미들웨어
//
// Middleware란?
// - HTTP 요청-응답 사이클에서 실행되는 함수
// - 요청 전/후 처리 수행
// - 체인 형태로 여러 미들웨어 연결 가능
//
// 사용 예시: 로깅, 인증, CORS, 압축 등
//
// Gin Middleware 시그니처:
// func() gin.HandlerFunc
func LoggerMiddleware() gin.HandlerFunc {
	// HandlerFunc를 반환하는 함수 (클로저)
	// 이 패턴으로 미들웨어에 설정값을 주입할 수 있음
	return func(c *gin.Context) {
		// 시작 시간 기록
		startTime := time.Now()

		// 요청 정보 로깅
		log.Printf("[%s] %s - Started", c.Request.Method, c.Request.URL.Path)

		// 다음 핸들러 실행
		// c.Next()는 체인의 다음 미들웨어/핸들러를 호출
		c.Next()

		// 다음 핸들러들이 모두 실행된 후
		// 응답 시간 계산
		duration := time.Since(startTime)

		// 응답 정보 로깅
		log.Printf("[%s] %s - Completed in %v with status %d",
			c.Request.Method,
			c.Request.URL.Path,
			duration,
			c.Writer.Status(),
		)
	}
}

// CORSMiddleware handles Cross-Origin Resource Sharing
// CORS 처리 미들웨어
//
// CORS (Cross-Origin Resource Sharing):
// - 다른 도메인에서 API 호출 허용
// - 브라우저 보안 정책
// - 프론트엔드-백엔드 분리 시 필요
//
// 프로덕션에서는 gin-contrib/cors 패키지 사용 권장
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// CORS 헤더 설정
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		// OPTIONS 메서드는 preflight 요청
		// 실제 요청 전 권한 확인용
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RecoveryMiddleware recovers from panics
// Panic 복구 미들웨어
//
// Go의 panic/recover:
// - panic: 프로그램 중단을 일으키는 에러
// - recover: panic을 포착하여 복구
// - 일반적으로 defer 내에서 recover 사용
//
// 이 미들웨어가 없으면:
// - panic 발생 시 서버 전체가 중단
// - 미들웨어로 panic을 잡아 500 응답 반환
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// defer: 함수 종료 시 (panic 발생 시 포함) 실행
		defer func() {
			// recover()는 panic을 포착
			if err := recover(); err != nil {
				// Panic 로깅
				log.Printf("Panic recovered: %v", err)

				// 500 응답 반환
				c.JSON(500, Response{
					Success: false,
					Error:   "Internal server error",
				})

				// 요청 처리 중단
				c.Abort()
			}
		}()

		// 다음 핸들러 실행
		c.Next()
	}
}

// AuthMiddleware is a placeholder for authentication
// 인증 미들웨어 (예시)
//
// 실제 구현 시:
// - JWT 토큰 검증
// - 세션 확인
// - API 키 검증 등
//
// 현재는 학습 목적으로 간단한 구조만 제공
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: 실제 인증 로직 구현
		// 예시:
		// token := c.GetHeader("Authorization")
		// if !isValidToken(token) {
		//     c.JSON(401, Response{Success: false, Error: "Unauthorized"})
		//     c.Abort()
		//     return
		// }

		// 인증 성공 시 사용자 정보를 컨텍스트에 저장
		// c.Set("userID", extractedUserID)

		c.Next()
	}
}

// RateLimitMiddleware limits request rate (placeholder)
// Rate Limiting 미들웨어 (예시)
//
// Rate Limiting:
// - API 호출 빈도 제한
// - DDoS 공격 방지
// - 리소스 보호
//
// 실제 구현:
// - Redis + sliding window
// - Token bucket 알고리즘
// - golang.org/x/time/rate 패키지
func RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Rate limiting 로직 구현
		// 예시:
		// clientIP := c.ClientIP()
		// if isRateLimited(clientIP) {
		//     c.JSON(429, Response{Success: false, Error: "Too many requests"})
		//     c.Abort()
		//     return
		// }

		c.Next()
	}
}

/*
주요 학습 포인트:

1. Middleware Pattern (미들웨어 패턴)
   - 횡단 관심사(Cross-cutting concerns) 처리
   - 요청/응답 사이클 중간에 실행
   - 재사용 가능한 로직 분리

2. Gin Middleware 구조
   func() gin.HandlerFunc {
       return func(c *gin.Context) {
           // 전처리
           c.Next()
           // 후처리
       }
   }

3. Middleware 실행 순서
   router.Use(Middleware1())  // 첫 번째 실행
   router.Use(Middleware2())  // 두 번째 실행
   router.GET("/", handler)   // 마지막 실행

   실행 흐름:
   Middleware1 전처리 →
   Middleware2 전처리 →
   Handler →
   Middleware2 후처리 →
   Middleware1 후처리

4. c.Next() vs c.Abort()
   - c.Next(): 다음 핸들러 실행
   - c.Abort(): 이후 핸들러 실행 중단

5. Context 사용
   - c.Set(key, value): 컨텍스트에 값 저장
   - c.Get(key): 저장된 값 조회
   - 미들웨어에서 핸들러로 데이터 전달

6. defer와 recover
   - defer: 함수 종료 시 실행
   - recover: panic 포착
   - 서버 안정성 보장

미들웨어 적용 방법:

1. 전역 적용:
   router.Use(LoggerMiddleware())

2. 그룹 적용:
   api := router.Group("/api")
   api.Use(AuthMiddleware())

3. 개별 라우트 적용:
   router.GET("/admin", AuthMiddleware(), adminHandler)

미들웨어 순서 권장사항:
1. Recovery (panic 복구)
2. Logger (요청 로깅)
3. CORS (CORS 처리)
4. Auth (인증)
5. RateLimit (요청 제한)
6. Business Logic (실제 핸들러)
*/
