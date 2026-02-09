package be.com.springbootclaude.validator

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

/**
 * @ValidEmail: 커스텀 이메일 검증 어노테이션
 *
 * 학습 포인트:
 * 1. @Constraint: 이 어노테이션이 검증 제약조건임을 선언합니다.
 * 2. validatedBy: 실제 검증 로직을 구현한 Validator를 지정합니다.
 * 3. message: 검증 실패 시 기본 메시지
 * 4. groups, payload: Jakarta Validation 표준 속성
 *
 * 실무 팁:
 * - @Email보다 더 엄격한 검증이 필요할 때 커스텀 Validator를 만듭니다.
 * - 예: 회사 도메인만 허용, 일회용 이메일 차단 등
 * - 비즈니스 규칙을 선언적으로 표현하면 코드가 깔끔해집니다.
 */
@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [ValidEmailValidator::class])
annotation class ValidEmail(
    val message: String = "유효하지 않은 이메일 형식입니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
    /**
     * 허용할 도메인 리스트 (빈 배열이면 모든 도메인 허용)
     * 예: ["gmail.com", "company.com"]
     */
    val allowedDomains: Array<String> = []
)

/**
 * ValidEmailValidator: @ValidEmail의 실제 검증 로직
 *
 * 학습 포인트:
 * 1. ConstraintValidator<어노테이션, 검증할 타입>을 구현합니다.
 * 2. initialize(): 어노테이션의 속성값을 읽어 초기화합니다.
 * 3. isValid(): 실제 검증 로직을 구현합니다.
 *
 * 실무 팁:
 * - null은 유효한 것으로 간주합니다 (@NotNull과 함께 사용).
 * - 복잡한 비즈니스 규칙도 Validator로 캡슐화할 수 있습니다.
 * - Validator는 상태가 없어야 합니다(stateless). Spring Bean으로 등록되어 재사용됩니다.
 */
class ValidEmailValidator : ConstraintValidator<ValidEmail, String> {

    private lateinit var allowedDomains: Set<String>

    /**
     * 어노테이션의 속성값을 읽어 초기화
     */
    override fun initialize(constraintAnnotation: ValidEmail) {
        allowedDomains = constraintAnnotation.allowedDomains.toSet()
    }

    /**
     * 실제 검증 로직
     */
    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        // null은 유효한 것으로 간주 (@NotNull과 조합하여 사용)
        if (value == null) return true

        // 기본 이메일 형식 검증
        val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$".toRegex()
        if (!emailRegex.matches(value)) {
            return false
        }

        // 도메인 제한이 있는 경우
        if (allowedDomains.isNotEmpty()) {
            val domain = value.substringAfter("@")
            if (domain !in allowedDomains) {
                // 커스텀 에러 메시지 설정
                context.disableDefaultConstraintViolation()
                context.buildConstraintViolationWithTemplate(
                    "허용되지 않은 이메일 도메인입니다. 허용 도메인: ${allowedDomains.joinToString(", ")}"
                ).addConstraintViolation()
                return false
            }
        }

        return true
    }
}

/**
 * 사용 예시:
 *
 * data class SignUpRequest(
 *     @field:ValidEmail(allowedDomains = ["company.com", "partner.com"])
 *     val email: String
 * )
 */
