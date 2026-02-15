package be.com.springbootclaude.basic.aop

import io.github.oshai.kotlinlogging.KotlinLogging
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.annotation.Around
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Pointcut
import org.springframework.stereotype.Component
import kotlin.system.measureTimeMillis

private val logger = KotlinLogging.logger {}

/**
 * LoggingAspect: 실행 시간 로깅 AOP
 *
 * 학습 포인트:
 * 1. @Aspect: 이 클래스가 Aspect(관점)임을 선언합니다.
 * 2. @Pointcut: 어디에 적용할지 정의합니다 (표현식).
 * 3. @Around: 메서드 실행 전후를 가로채서 로직을 추가합니다.
 * 4. ProceedingJoinPoint: 실제 메서드 실행을 제어합니다.
 *
 * 실무 팁:
 * - AOP는 횡단 관심사(Cross-Cutting Concerns)를 분리하는 강력한 도구입니다.
 * - 로깅, 트랜잭션, 보안, 캐싱 등에 활용됩니다.
 * - 성능 모니터링, 디버깅에 매우 유용합니다.
 *
 * AOP 용어:
 * - Aspect: 횡단 관심사를 모듈화한 것
 * - Join Point: 프로그램 실행 중 특정 지점 (메서드 호출, 예외 발생 등)
 * - Pointcut: Join Point를 선택하는 표현식
 * - Advice: Join Point에서 실행할 코드 (@Before, @After, @Around 등)
 */
@Aspect
@Component
class LoggingAspect {

    /**
     * Pointcut: Service 계층의 모든 public 메서드
     *
     * 학습 포인트:
     * - execution(): 메서드 실행 시점을 가로챕니다.
     * - * : 모든 반환 타입
     * - be.com.springbootclaude.service..*: service 패키지와 하위 패키지
     * - *(..) : 모든 메서드명, 모든 파라미터
     *
     * 실무 팁:
     * - Pointcut을 재사용하면 코드 중복을 줄일 수 있습니다.
     * - 너무 넓은 범위를 지정하면 성능에 영향을 줄 수 있으니 주의하세요.
     */
    @Pointcut("execution(* be.com.springbootclaude.service..*.*(..))")
    fun serviceLayer() {
    }

    /**
     * Around Advice: 메서드 실행 시간 측정 및 로깅
     *
     * 학습 포인트:
     * - @Around: 메서드 실행 전후를 모두 제어할 수 있습니다.
     * - proceed(): 실제 타겟 메서드를 실행합니다. 이걸 호출하지 않으면 원본 메서드가 실행되지 않습니다!
     * - 실행 시간, 파라미터, 반환값, 예외를 모두 로깅할 수 있습니다.
     *
     * 실무 팁:
     * - 성능 병목을 찾는 데 매우 유용합니다.
     * - 운영 환경에서는 로그 레벨을 조정하여 성능 영향을 최소화하세요.
     * - 민감한 정보(비밀번호 등)는 로깅하지 않도록 주의하세요.
     */
    @Around("serviceLayer()")
    fun logExecutionTime(joinPoint: ProceedingJoinPoint): Any? {
        val className = joinPoint.signature.declaringTypeName.substringAfterLast('.')
        val methodName = joinPoint.signature.name
        val args = joinPoint.args.joinToString(", ") { it?.toString() ?: "null" }

        logger.debug { "[$className.$methodName] 실행 시작 - args: [$args]" }

        var result: Any? = null
        val executionTime = measureTimeMillis {
            try {
                result = joinPoint.proceed()
            } catch (e: Exception) {
                logger.error(e) { "[$className.$methodName] 실행 중 예외 발생" }
                throw e
            }
        }

        logger.debug { "[$className.$methodName] 실행 완료 - ${executionTime}ms" }

        return result
    }

    /**
     * Pointcut: Controller 계층의 모든 public 메서드
     */
    @Pointcut("execution(* be.com.springbootclaude.controller..*.*(..))")
    fun controllerLayer() {
    }

    /**
     * Around Advice: API 요청/응답 로깅
     *
     * 학습 포인트:
     * - Controller의 요청/응답을 로깅하면 API 호출 추적이 쉬워집니다.
     * - 실무에서는 요청 ID를 MDC(Mapped Diagnostic Context)에 저장하여 전체 흐름을 추적합니다.
     */
    @Around("controllerLayer()")
    fun logApiCall(joinPoint: ProceedingJoinPoint): Any? {
        val className = joinPoint.signature.declaringTypeName.substringAfterLast('.')
        val methodName = joinPoint.signature.name

        logger.info { "API 요청: $className.$methodName" }

        val result = try {
            joinPoint.proceed()
        } catch (e: Exception) {
            logger.error { "API 요청 실패: $className.$methodName - ${e.message}" }
            throw e
        }

        logger.info { "API 응답: $className.$methodName - 성공" }

        return result
    }
}
