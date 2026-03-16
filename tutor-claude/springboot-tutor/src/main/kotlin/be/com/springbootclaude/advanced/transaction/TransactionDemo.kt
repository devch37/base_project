package be.com.springbootclaude.advanced.transaction

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Transaction Management Demo
 *
 * ★ Spring의 트랜잭션 관리 완벽 이해 ★
 *
 * @Transactional 옵션:
 * 1. propagation: 트랜잭션 전파 속성
 * 2. isolation: 격리 수준
 * 3. timeout: 타임아웃
 * 4. readOnly: 읽기 전용
 * 5. rollbackFor: 롤백 예외
 * 6. noRollbackFor: 롤백 안 할 예외
 */

fun main() {
    val maps = HashMap<String, Int>()
    maps.put("1", 1)
    maps.put("2", 2)
    println(maps.size)
    println(maps)
    maps.clear()
    println(maps)
    println(maps.size)
    val listTest = ArrayList<String>()
    listTest.stream()
}

@Service
class TransactionDemo {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * REQUIRED (기본값)
     * - 진행 중인 트랜잭션이 있으면 참여
     * - 없으면 새로 시작
     *
     * 가장 많이 사용하는 전파 속성
     */
    @Transactional(propagation = Propagation.REQUIRED)
    fun requiredTransaction() {
        logger.info("💎 REQUIRED 트랜잭션")
        // 비즈니스 로직
    }

    /**
     * REQUIRES_NEW
     * - 항상 새로운 트랜잭션 시작
     * - 기존 트랜잭션은 일시 중단
     *
     * 사용 시나리오:
     * - 감사 로그: 메인 트랜잭션 실패해도 로그는 저장
     * - 외부 API 호출 결과: 독립적으로 저장
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun requiresNewTransaction() {
        logger.info("🆕 REQUIRES_NEW 트랜잭션 (독립적)")
        // 독립적인 트랜잭션이 필요한 로직
    }

    /**
     * MANDATORY
     * - 진행 중인 트랜잭션 필수
     * - 없으면 예외 발생
     *
     * 사용 시나리오:
     * - 반드시 트랜잭션 내에서 호출되어야 하는 메서드
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun mandatoryTransaction() {
        logger.info("⚠️ MANDATORY 트랜잭션 (필수)")
        // 트랜잭션 내에서만 동작해야 하는 로직
    }

    /**
     * NESTED
     * - 중첩 트랜잭션 (Savepoint 사용)
     * - 부모 트랜잭션에 영향받음
     * - 자식 실패해도 부모는 계속 진행 가능
     *
     * 사용 시나리오:
     * - 부분적인 롤백이 필요한 경우
     * - 배치 처리에서 일부만 실패해도 계속
     */
    @Transactional(propagation = Propagation.NESTED)
    fun nestedTransaction() {
        logger.info("🪆 NESTED 트랜잭션 (중첩)")
        // 중첩 트랜잭션 로직
    }

    /**
     * 격리 수준 (Isolation Level)
     *
     * READ_UNCOMMITTED (레벨 0)
     * - Dirty Read 발생 가능
     * - 커밋되지 않은 데이터 읽기
     * - 거의 사용 안 함
     *
     * READ_COMMITTED (레벨 1) ✅ 일반적
     * - Dirty Read 방지
     * - Non-Repeatable Read 발생 가능
     * - PostgreSQL, Oracle 기본값
     *
     * REPEATABLE_READ (레벨 2) ✅ MySQL 기본
     * - Non-Repeatable Read 방지
     * - Phantom Read 발생 가능
     * - MySQL InnoDB 기본값
     *
     * SERIALIZABLE (레벨 3)
     * - 모든 문제 방지
     * - 성능 저하
     * - 거의 사용 안 함
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    fun readCommittedTransaction() {
        logger.info("📖 READ_COMMITTED 격리 수준")
        // 일반적인 비즈니스 로직
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    fun repeatableReadTransaction() {
        logger.info("🔒 REPEATABLE_READ 격리 수준")
        // 동일 데이터를 여러 번 읽는 로직
    }

    /**
     * 읽기 전용 트랜잭션
     * - 성능 최적화
     * - Dirty Checking 비활성화
     * - 쓰기 작업 시 예외 발생
     *
     * 사용 시나리오:
     * - 조회 API
     * - 리포트 생성
     * - 통계 계산
     */
    @Transactional(readOnly = true)
    fun readOnlyTransaction() {
        logger.info("👁️ 읽기 전용 트랜잭션")
        // 조회만 하는 로직
    }

    /**
     * 타임아웃 설정
     * - 트랜잭션 실행 시간 제한
     * - 초 단위
     *
     * 사용 시나리오:
     * - 장시간 실행되는 배치 방지
     * - Deadlock 방지
     */
    @Transactional(timeout = 30)
    fun timeoutTransaction() {
        logger.info("⏱️ 타임아웃 30초")
        // 30초 이내에 완료되어야 하는 로직
    }

    /**
     * 예외별 롤백 설정
     *
     * 기본 동작:
     * - RuntimeException: 롤백
     * - Checked Exception: 롤백 안 함
     *
     * rollbackFor: 추가로 롤백할 예외
     * noRollbackFor: 롤백하지 않을 예외
     */
    @Transactional(rollbackFor = [Exception::class])
    fun rollbackForAllExceptions() {
        logger.info("🔄 모든 예외에 롤백")
        // Checked Exception도 롤백
    }

    @Transactional(noRollbackFor = [BusinessException::class])
    fun noRollbackForBusinessException() {
        logger.info("✅ BusinessException은 롤백 안 함")
        // BusinessException 발생해도 커밋
    }

    /**
     * 실무 패턴: 트랜잭션 분리
     *
     * ❌ 나쁜 예: 하나의 큰 트랜잭션
     * @Transactional
     * fun processOrder() {
     *     validateOrder()     // 검증
     *     saveOrder()         // 저장
     *     sendEmail()         // 이메일 (느림)
     *     updateStatistics()  // 통계
     * }
     * → 이메일 실패 시 전체 롤백
     * → 이메일 때문에 트랜잭션 길어짐
     *
     * ✅ 좋은 예: 트랜잭션 분리
     * @Transactional
     * fun processOrder() {
     *     validateOrder()
     *     saveOrder()
     * }
     *
     * @Async
     * fun sendEmail() { ... }  // 비동기, 별도 트랜잭션
     *
     * @Transactional(propagation = REQUIRES_NEW)
     * fun updateStatistics() { ... }  // 독립 트랜잭션
     */
}

/**
 * 트랜잭션 전파 시나리오
 */
@Service
class TransactionPropagationDemo(
    private val auditService: AuditService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 시나리오 1: REQUIRED + REQUIRED
     * - 두 메서드가 같은 트랜잭션 공유
     * - audit 실패 시 전체 롤백
     */
    @Transactional
    fun scenarioRequired() {
        logger.info("🔵 메인 트랜잭션 시작")
        // 비즈니스 로직
        auditService.logRequired()  // 같은 트랜잭션
        logger.info("🔵 메인 트랜잭션 끝")
    }

    /**
     * 시나리오 2: REQUIRED + REQUIRES_NEW
     * - audit은 독립 트랜잭션
     * - 메인 실패해도 audit은 저장됨
     */
    @Transactional
    fun scenarioRequiresNew() {
        logger.info("🔵 메인 트랜잭션 시작")
        // 비즈니스 로직
        auditService.logRequiresNew()  // 독립 트랜잭션
        logger.info("🔵 메인 트랜잭션 끝")
        // 여기서 실패해도 audit은 저장됨!
    }
}

@Service
class AuditService {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional(propagation = Propagation.REQUIRED)
    fun logRequired() {
        logger.info("  📝 감사 로그 (REQUIRED)")
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun logRequiresNew() {
        logger.info("  📝 감사 로그 (REQUIRES_NEW - 독립)")
    }
}

class BusinessException(message: String) : Exception(message)

/**
 * 실무 체크리스트:
 *
 * 1. 트랜잭션 범위 최소화
 *    - 필요한 부분만 트랜잭션
 *    - 외부 API 호출은 트랜잭션 밖에서
 *
 * 2. 읽기 전용 최적화
 *    - 조회 API는 @Transactional(readOnly = true)
 *    - 성능 향상, Dirty Checking 비활성화
 *
 * 3. 예외 처리
 *    - RuntimeException은 자동 롤백
 *    - Checked Exception은 명시적 설정
 *
 * 4. 감사 로그
 *    - REQUIRES_NEW 사용
 *    - 메인 트랜잭션 실패해도 로그 저장
 *
 * 5. 격리 수준
 *    - 기본값 (READ_COMMITTED) 사용
 *    - 필요 시에만 상향 조정
 *
 * 6. 타임아웃
 *    - 장시간 트랜잭션 방지
 *    - Deadlock 타임아웃 설정
 */
