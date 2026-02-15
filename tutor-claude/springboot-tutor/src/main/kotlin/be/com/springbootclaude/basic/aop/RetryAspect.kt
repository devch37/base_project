package be.com.springbootclaude.basic.aop

import io.github.oshai.kotlinlogging.KotlinLogging
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.springframework.stereotype.Component

private val logger = KotlinLogging.logger {}

/**
 * @Retryable: 재시도 가능한 메서드를 표시하는 커스텀 어노테이션
 *
 * 학습 포인트:
 * 1. @Target: 어디에 적용할 수 있는지 (함수에만 적용)
 * 2. @Retention: 언제까지 유지할지 (런타임까지 유지)
 * 3. 커스텀 어노테이션으로 메타데이터를 전달할 수 있습니다.
 *
 * 실무 팁:
 * - 외부 API 호출, DB 연결 등 일시적 실패가 예상되는 작업에 사용합니다.
 * - 재시도 횟수와 대기 시간을 조정하여 백오프(backoff) 전략을 구현할 수 있습니다.
 * - Spring Retry 라이브러리를 사용하면 더 풍부한 기능을 사용할 수 있습니다.
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Retryable(
    val maxAttempts: Int = 3,
    val delayMillis: Long = 1000,
    val retryOn: Array<kotlin.reflect.KClass<out Exception>> = [Exception::class]
)

/**
 * RetryAspect: 재시도 메커니즘 AOP
 *
 * 학습 포인트:
 * 1. @annotation(): 특정 어노테이션이 붙은 메서드를 타겟팅합니다.
 * 2. Reflection으로 어노테이션의 속성값을 읽을 수 있습니다.
 * 3. 재시도 로직을 AOP로 분리하면 비즈니스 로직이 깔끔해집니다.
 *
 * 실무 팁:
 * - 재시도는 멱등성(idempotent)이 보장되는 작업에만 사용하세요!
 * - 예: 조회는 OK, 결제는 위험 (중복 결제 가능)
 * - Exponential Backoff(지수 백오프)를 구현하면 더 효과적입니다.
 * - Circuit Breaker 패턴과 함께 사용하면 시스템 안정성이 높아집니다.
 */
@Aspect
@Component
class RetryAspect {

    /**
     * Around Advice: 재시도 로직
     *
     * 학습 포인트:
     * - @annotation()으로 @Retryable이 붙은 메서드만 타겟팅합니다.
     * - joinPoint.signature로 메서드의 어노테이션을 읽을 수 있습니다.
     * - 재시도 간 Thread.sleep()으로 대기합니다.
     *
     * 실무 팁:
     * - 재시도 시 로그를 남겨서 문제를 추적할 수 있도록 합니다.
     * - 마지막 시도에서도 실패하면 예외를 그대로 던집니다.
     * - 재시도 사이에 점진적으로 대기 시간을 늘리는 것이 좋습니다(Exponential Backoff).
     */
    @Around("@annotation(retryable)")
    fun retry(joinPoint: ProceedingJoinPoint, retryable: Retryable): Any? {
        val methodName = "${joinPoint.signature.declaringTypeName}.${joinPoint.signature.name}"
        val maxAttempts = retryable.maxAttempts
        val delayMillis = retryable.delayMillis
        val retryableExceptions = retryable.retryOn.map { it.java }.toSet()

        var lastException: Exception? = null
        var attempt = 1

        while (attempt <= maxAttempts) {
            try {
                logger.debug { "[$methodName] 실행 시도 ($attempt/$maxAttempts)" }
                return joinPoint.proceed()
            } catch (e: Exception) {
                // 재시도 대상 예외인지 확인
                val shouldRetry = retryableExceptions.any { it.isAssignableFrom(e.javaClass) }

                if (!shouldRetry || attempt >= maxAttempts) {
                    logger.error(e) {
                        "[$methodName] 재시도 실패 - 예외 발생 (${attempt}/${maxAttempts})"
                    }
                    throw e
                }

                lastException = e
                logger.warn {
                    "[$methodName] 실패 - ${delayMillis}ms 후 재시도 (${attempt}/${maxAttempts}): ${e.message}"
                }

                // 대기 후 재시도 (Exponential Backoff 적용 가능)
                Thread.sleep(delayMillis * attempt) // 지수 백오프: 1초, 2초, 3초...
                attempt++
            }
        }

        // 모든 시도 실패 (여기 도달할 일은 거의 없음)
        throw lastException ?: RuntimeException("재시도 실패")
    }
}

/**
 * 사용 예시:
 *
 * @Retryable(maxAttempts = 5, delayMillis = 2000, retryOn = [IOException::class])
 * fun callExternalApi(): String {
 *     // 외부 API 호출
 * }
 *
 * 실무 팁:
 * - Spring Retry(@EnableRetry, @Retryable)를 사용하면 더 많은 기능을 제공합니다.
 * - 하지만 직접 구현하면 AOP의 동작 원리를 깊이 이해할 수 있습니다.
 */
