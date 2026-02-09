package be.com.springbootclaude.validator

import be.com.springbootclaude.repository.UserRepository
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import org.springframework.stereotype.Component
import kotlin.reflect.KClass

/**
 * @UniqueEmail: 이메일 중복 검증 어노테이션
 *
 * 학습 포인트:
 * 1. DB 조회가 필요한 검증을 어노테이션으로 선언할 수 있습니다.
 * 2. Validator에서 Spring Bean(Repository)을 주입받을 수 있습니다.
 * 3. 비즈니스 규칙을 DTO에 선언적으로 표현합니다.
 *
 * 실무 팁:
 * - DB 조회가 필요한 검증은 성능에 영향을 줄 수 있으니 주의하세요.
 * - 가능하면 Service 계층에서 중복 체크를 하는 것이 더 명확할 수 있습니다.
 * - 하지만 DTO 레벨에서 검증하면 Controller가 깔끔해집니다.
 *
 * 장단점:
 * - 장점: 선언적, 재사용 가능, Controller가 깔끔함
 * - 단점: DB 쿼리 발생, 검증 시점이 애매할 수 있음
 */
@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [UniqueEmailValidator::class])
annotation class UniqueEmail(
    val message: String = "이미 사용 중인 이메일입니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

/**
 * UniqueEmailValidator: 이메일 중복 검증 로직
 *
 * 학습 포인트:
 * 1. @Component: Validator를 Spring Bean으로 등록합니다.
 * 2. Constructor Injection: Repository를 주입받습니다.
 * 3. DB를 조회하여 실시간 검증합니다.
 *
 * 실무 팁:
 * - Validator는 요청마다 실행되므로 성능에 주의하세요.
 * - 캐싱을 고려할 수 있지만, 실시간성이 중요하면 매번 조회해야 합니다.
 * - 트랜잭션 내에서 검증과 저장 사이에 중복 데이터가 들어올 수 있으니,
 *   DB 레벨 UNIQUE 제약조건도 함께 사용하세요!
 */
@Component
class UniqueEmailValidator(
    private val userRepository: UserRepository
) : ConstraintValidator<UniqueEmail, String> {

    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        // null은 유효한 것으로 간주
        if (value == null) return true

        // DB 조회하여 중복 체크
        val exists = userRepository.existsByEmail(value)

        return !exists
    }
}

/**
 * 사용 예시:
 *
 * data class CreateUserRequest(
 *     @field:NotBlank
 *     @field:Email
 *     @field:UniqueEmail  // 이메일 중복 검증
 *     val email: String,
 *
 *     @field:NotBlank
 *     val name: String
 * )
 *
 * 실무 고려사항:
 * 1. 검증 시점과 저장 시점 사이에 Race Condition이 발생할 수 있습니다.
 * 2. 따라서 DB UNIQUE 제약조건을 반드시 함께 사용하세요.
 * 3. 검증 통과 후 저장 시 중복 예외가 발생할 수 있으므로 예외 처리가 필요합니다.
 */
