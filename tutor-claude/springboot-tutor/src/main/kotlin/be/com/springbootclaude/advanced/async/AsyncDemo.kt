package be.com.springbootclaude.advanced.async

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.util.concurrent.CompletableFuture
import java.util.concurrent.Future

/**
 * Async & Scheduling Demo
 *
 * ★ 비동기 처리와 스케줄링 ★
 *
 * @Async 사용 이유:
 * 1. 응답 속도 향상 - 느린 작업을 백그라운드에서
 * 2. 리소스 효율 - 스레드 재사용
 * 3. 사용자 경험 - 즉시 응답
 *
 * 주의사항:
 * - @EnableAsync 설정 필요
 * - public 메서드에만 적용
 * - 같은 클래스 내 호출은 비동기 안 됨 (프록시 우회)
 */
@Service
class AsyncDemo {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 기본 비동기 메서드
     * - 반환값 void
     * - Fire and Forget
     *
     * 사용 시나리오:
     * - 로그 저장
     * - 알림 발송
     * - 통계 업데이트
     */
    @Async
    fun sendEmail(to: String, subject: String) {
        val thread = Thread.currentThread().name
        logger.info("📧 이메일 발송 시작 (Thread: $thread)")
        logger.info("   To: $to")
        logger.info("   Subject: $subject")

        // 시뮬레이션: 느린 외부 API 호출
        Thread.sleep(3000)

        logger.info("✅ 이메일 발송 완료")
    }

    /**
     * 비동기 메서드 with Future
     * - 결과를 나중에 받을 수 있음
     * - Future.get()으로 대기 가능
     *
     * 사용 시나리오:
     * - 결과가 필요한 비동기 작업
     * - 여러 비동기 작업 병렬 실행 후 결과 수집
     */
    @Async
    fun fetchUserData(userId: Long): Future<UserData> {
        val thread = Thread.currentThread().name
        logger.info("🔍 사용자 데이터 조회 시작 (Thread: $thread)")
        logger.info("   userId: $userId")

        // 시뮬레이션: DB 조회
        Thread.sleep(2000)

        val userData = UserData(userId, "User $userId", "user$userId@example.com")

        logger.info("✅ 사용자 데이터 조회 완료")

        return CompletableFuture.completedFuture(userData)
    }

    /**
     * 비동기 메서드 with CompletableFuture
     * - 더 강력한 비동기 API
     * - 체이닝, 조합 가능
     *
     * 사용 시나리오:
     * - 복잡한 비동기 워크플로우
     * - 여러 비동기 작업 조합
     */
    @Async
    fun processOrder(orderId: Long): CompletableFuture<OrderResult> {
        val thread = Thread.currentThread().name
        logger.info("📦 주문 처리 시작 (Thread: $thread)")

        return CompletableFuture.supplyAsync {
            // 단계 1: 재고 확인
            logger.info("  1. 재고 확인 중...")
            Thread.sleep(500)

            // 단계 2: 결제 처리
            logger.info("  2. 결제 처리 중...")
            Thread.sleep(1000)

            // 단계 3: 배송 준비
            logger.info("  3. 배송 준비 중...")
            Thread.sleep(500)

            OrderResult(orderId, "SUCCESS")
        }.thenApply { result ->
            logger.info("✅ 주문 처리 완료: $result")
            result
        }.exceptionally { ex ->
            logger.error("❌ 주문 처리 실패", ex)
            OrderResult(orderId, "FAILED")
        }
    }

    /**
     * 병렬 처리 예시
     * - 여러 비동기 작업을 동시에 실행
     * - 모두 완료될 때까지 대기
     */
    fun processOrderWithParallelTasks(orderId: Long): OrderSummary {
        logger.info("🚀 병렬 처리 시작")

        // 3개의 작업을 동시에 실행
        val inventoryCheck = CompletableFuture.supplyAsync {
            logger.info("  📦 재고 확인...")
            Thread.sleep(1000)
            "재고 충분"
        }

        val paymentProcess = CompletableFuture.supplyAsync {
            logger.info("  💳 결제 처리...")
            Thread.sleep(1500)
            "결제 완료"
        }

        val notificationSend = CompletableFuture.supplyAsync {
            logger.info("  🔔 알림 발송...")
            Thread.sleep(500)
            "알림 발송 완료"
        }

        // 모든 작업 완료 대기
        CompletableFuture.allOf(inventoryCheck, paymentProcess, notificationSend).join()

        logger.info("✅ 모든 작업 완료")

        return OrderSummary(
            orderId,
            inventoryCheck.get(),
            paymentProcess.get(),
            notificationSend.get()
        )
    }
}

/**
 * Scheduling Demo
 *
 * @Scheduled 옵션:
 * - fixedRate: 시작 시간 기준 고정 주기
 * - fixedDelay: 완료 시간 기준 고정 주기
 * - cron: Cron 표현식
 * - initialDelay: 최초 실행 지연
 */
@Service
class SchedulingDemo {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Fixed Rate
     * - 시작 시간 기준으로 5초마다 실행
     * - 이전 작업이 안 끝나도 실행
     *
     * 사용 시나리오:
     * - 정기적인 Health Check
     * - 메트릭 수집
     */
    @Scheduled(fixedRate = 5000, initialDelay = 1000)
    fun scheduledTaskFixedRate() {
        logger.info("⏰ Fixed Rate 작업 실행 (5초마다)")
    }

    /**
     * Fixed Delay
     * - 완료 시간 기준으로 5초 후 실행
     * - 이전 작업 완료 후 대기
     *
     * 사용 시나리오:
     * - 배치 작업
     * - 데이터 동기화
     */
    @Scheduled(fixedDelay = 5000)
    fun scheduledTaskFixedDelay() {
        logger.info("⏰ Fixed Delay 작업 실행 (완료 후 5초)")
        Thread.sleep(2000) // 작업 시뮬레이션
    }

    /**
     * Cron Expression
     * - 복잡한 스케줄 표현
     *
     * Cron 포맷: 초 분 시 일 월 요일
     * - 0 0 0 * * *: 매일 자정
     * - 0 0 9 * * MON-FRI: 평일 오전 9시
     * - 0 * / 30 * * * *: 매 30분마다
     *
     * 사용 시나리오:
     * - 정기 리포트
     * - 백업
     * - 데이터 정리
     */
    @Scheduled(cron = "0 0 3 * * *")  // 매일 새벽 3시
    fun cleanupOldData() {
        logger.info("🧹 데이터 정리 작업 (매일 새벽 3시)")
        // 오래된 로그 삭제
        // 임시 파일 정리
    }

    @Scheduled(cron = "0 0 9 * * MON-FRI")  // 평일 오전 9시
    fun sendDailyReport() {
        logger.info("📊 일일 리포트 발송 (평일 오전 9시)")
        // 리포트 생성 및 발송
    }

    /**
     * Scheduled + Async 조합
     * - 스케줄은 단일 스레드
     * - 실제 작업은 비동기로
     *
     * 사용 시나리오:
     * - 시간이 오래 걸리는 배치
     * - 스케줄 지연 방지
     */
    @Scheduled(fixedRate = 60000)  // 1분마다 실행
    fun scheduledBatchJob() {
        logger.info("📅 배치 작업 스케줄 실행")
        executeBatchAsync()  // 비동기로 실행
        logger.info("📅 배치 작업 스케줄 완료 (백그라운드 실행 중)")
    }

    @Async
    fun executeBatchAsync() {
        val thread = Thread.currentThread().name
        logger.info("🔄 배치 작업 시작 (Thread: $thread)")
        Thread.sleep(30000)  // 30초 걸리는 작업
        logger.info("✅ 배치 작업 완료")
    }
}

data class UserData(val id: Long, val name: String, val email: String)
data class OrderResult(val orderId: Long, val status: String)
data class OrderSummary(
    val orderId: Long,
    val inventoryStatus: String,
    val paymentStatus: String,
    val notificationStatus: String
)

/**
 * 실무 체크리스트:
 *
 * 1. @Async 설정
 *    - @EnableAsync 필수
 *    - ThreadPoolTaskExecutor 설정
 *    - 예외 처리 (AsyncUncaughtExceptionHandler)
 *
 * 2. 스레드 풀 설정
 *    @Bean
 *    fun taskExecutor(): TaskExecutor {
 *        return ThreadPoolTaskExecutor().apply {
 *            corePoolSize = 5
 *            maxPoolSize = 10
 *            queueCapacity = 25
 *            setThreadNamePrefix("async-")
 *            initialize()
 *        }
 *    }
 *
 * 3. @Scheduled 설정
 *    - @EnableScheduling 필수
 *    - 기본 단일 스레드
 *    - 긴 작업은 @Async 조합
 *
 * 4. 예외 처리
 *    - 비동기 메서드의 예외는 호출자에게 전파 안 됨
 *    - try-catch 또는 CompletableFuture.exceptionally()
 *
 * 5. 트랜잭션
 *    - @Async 메서드는 별도 트랜잭션
 *    - 호출자 트랜잭션과 독립적
 *
 * 6. 모니터링
 *    - 스레드 풀 상태 모니터링
 *    - 작업 실패율 추적
 *    - 실행 시간 메트릭
 */
