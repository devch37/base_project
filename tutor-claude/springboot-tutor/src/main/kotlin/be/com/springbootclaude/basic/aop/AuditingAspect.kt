package be.com.springbootclaude.basic.aop

import io.github.oshai.kotlinlogging.KotlinLogging
import org.aspectj.lang.JoinPoint
import org.aspectj.lang.annotation.AfterReturning
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Pointcut
import org.springframework.stereotype.Component
import java.time.LocalDateTime

private val logger = KotlinLogging.logger {}

/**
 * AuditingAspect: 감사(Audit) 로깅 AOP
 *
 * 학습 포인트:
 * 1. @AfterReturning: 메서드가 정상적으로 반환된 후에 실행됩니다.
 * 2. returning: 반환값을 파라미터로 받을 수 있습니다.
 * 3. 데이터 변경 작업(생성, 수정, 삭제)을 감사 로그로 남깁니다.
 *
 * 실무 팁:
 * - 감사 로그는 보안, 컴플라이언스, 디버깅에 필수입니다.
 * - "누가, 언제, 무엇을, 어떻게" 했는지 기록합니다.
 * - 실무에서는 DB 테이블에 저장하거나 별도의 로그 시스템으로 전송합니다.
 * - 금융, 의료 등 규제가 엄격한 산업에서 특히 중요합니다.
 *
 * AfterReturning vs After vs AfterThrowing:
 * - @AfterReturning: 정상 반환 시에만 실행
 * - @After: 정상/예외 상관없이 항상 실행 (finally와 유사)
 * - @AfterThrowing: 예외 발생 시에만 실행
 */
@Aspect
@Component
class AuditingAspect {

    /**
     * Pointcut: 데이터 변경 메서드 (create, update, delete로 시작)
     *
     * 학습 포인트:
     * - 메서드 이름 패턴으로 Pointcut을 정의할 수 있습니다.
     * - || 연산자로 여러 패턴을 조합할 수 있습니다.
     */
    @Pointcut(
        """
        execution(* be.com.springbootclaude.service..create*(..)) ||
        execution(* be.com.springbootclaude.service..update*(..)) ||
        execution(* be.com.springbootclaude.service..delete*(..)) ||
        execution(* be.com.springbootclaude.service..publish*(..))
        """
    )
    fun dataModificationMethods() {
    }

    /**
     * AfterReturning Advice: 데이터 변경 감사 로깅
     *
     * 학습 포인트:
     * - JoinPoint: 메서드 정보 (이름, 파라미터 등)를 얻을 수 있습니다.
     * - returning: 메서드의 반환값을 받을 수 있습니다.
     *
     * 실무 팁:
     * - 실제 프로젝트에서는 AuditLog 엔티티를 만들어 DB에 저장합니다.
     * - 사용자 정보(SecurityContext에서 추출)도 함께 기록합니다.
     * - 변경 전/후 데이터를 JSON으로 저장하면 더 유용합니다.
     */
    @AfterReturning(
        pointcut = "dataModificationMethods()",
        returning = "result"
    )
    fun auditDataModification(joinPoint: JoinPoint, result: Any?) {
        val className = joinPoint.signature.declaringTypeName.substringAfterLast('.')
        val methodName = joinPoint.signature.name
        val timestamp = LocalDateTime.now()

        // 실무에서는 이 정보를 DB에 저장하거나 외부 시스템으로 전송합니다
        val auditLog = AuditLog(
            timestamp = timestamp,
            className = className,
            methodName = methodName,
            // TODO Phase 4에서 Security 구현 시 실제 사용자 정보 추가
            userId = "SYSTEM", // SecurityContext에서 추출
            action = determineAction(methodName),
            entityType = determineEntityType(className),
            resultSummary = result?.toString()?.take(100) // 결과 요약 (100자 제한)
        )

        logger.info {
            "[AUDIT] ${auditLog.action} - " +
                    "User: ${auditLog.userId}, " +
                    "Entity: ${auditLog.entityType}, " +
                    "Method: ${auditLog.className}.${auditLog.methodName}, " +
                    "Time: ${auditLog.timestamp}"
        }

        // 실무 예시: auditLogRepository.save(auditLog)
    }

    /**
     * 메서드 이름으로 액션 판별
     */
    private fun determineAction(methodName: String): AuditAction {
        return when {
            methodName.startsWith("create") -> AuditAction.CREATE
            methodName.startsWith("update") -> AuditAction.UPDATE
            methodName.startsWith("delete") -> AuditAction.DELETE
            methodName.startsWith("publish") -> AuditAction.PUBLISH
            else -> AuditAction.UNKNOWN
        }
    }

    /**
     * 클래스 이름으로 엔티티 타입 판별
     */
    private fun determineEntityType(className: String): String {
        return when {
            className.contains("Article") -> "Article"
            className.contains("User") -> "User"
            else -> "Unknown"
        }
    }
}

/**
 * AuditLog: 감사 로그 데이터 클래스
 *
 * 실무 팁:
 * - 실제로는 @Entity로 만들어서 DB에 저장합니다.
 * - createdAt, updatedAt, IP 주소, User Agent 등의 추가 정보도 저장합니다.
 */
data class AuditLog(
    val timestamp: LocalDateTime,
    val className: String,
    val methodName: String,
    val userId: String,
    val action: AuditAction,
    val entityType: String,
    val resultSummary: String?
)

/**
 * AuditAction: 감사 액션 타입
 */
enum class AuditAction {
    CREATE, UPDATE, DELETE, PUBLISH, UNKNOWN
}
