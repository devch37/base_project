package be.com.springbootclaude.basic.validator

/**
 * ValidatorExamples: 커스텀 Validator 활용 예시 모음
 *
 * 이 파일은 실제 코드가 아니라 학습 자료입니다.
 * 커스텀 Validator를 어떻게 활용할 수 있는지 예시를 보여줍니다.
 *
 * 학습 포인트:
 * 1. 비즈니스 규칙을 어노테이션으로 선언하면 코드가 자기 문서화됩니다.
 * 2. 복잡한 검증 로직을 재사용 가능한 어노테이션으로 만들 수 있습니다.
 * 3. DTO, 엔티티, 파라미터 등 다양한 곳에 적용할 수 있습니다.
 *
 * 실무 팁:
 * - 프로젝트 초기에 공통 Validator를 잘 만들어두면 생산성이 크게 향상됩니다.
 * - 비즈니스 도메인에 특화된 Validator를 만드세요 (예: 주민등록번호, 계좌번호 등).
 * - Validator는 단위 테스트하기 쉬우므로 꼭 테스트 코드를 작성하세요.
 */

/*
// ===== 예시 1: 비밀번호 강도 검증 =====

@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [StrongPasswordValidator::class])
annotation class StrongPassword(
    val message: String = "비밀번호는 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 합니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class StrongPasswordValidator : ConstraintValidator<StrongPassword, String> {
    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        if (value == null) return true

        val hasUpperCase = value.any { it.isUpperCase() }
        val hasLowerCase = value.any { it.isLowerCase() }
        val hasDigit = value.any { it.isDigit() }
        val hasSpecialChar = value.any { !it.isLetterOrDigit() }
        val isLongEnough = value.length >= 8

        return hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar && isLongEnough
    }
}

// 사용 예시:
data class SignUpRequest(
    @field:NotBlank
    @field:Email
    val email: String,

    @field:StrongPassword
    val password: String
)

// ===== 예시 2: 날짜 범위 검증 =====

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [ValidDateRangeValidator::class])
annotation class ValidDateRange(
    val message: String = "종료일은 시작일보다 이후여야 합니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
    val startDateField: String,
    val endDateField: String
)

class ValidDateRangeValidator : ConstraintValidator<ValidDateRange, Any> {
    private lateinit var startDateField: String
    private lateinit var endDateField: String

    override fun initialize(constraintAnnotation: ValidDateRange) {
        startDateField = constraintAnnotation.startDateField
        endDateField = constraintAnnotation.endDateField
    }

    override fun isValid(value: Any?, context: ConstraintValidatorContext): Boolean {
        if (value == null) return true

        try {
            val startDate = value::class.memberProperties
                .find { it.name == startDateField }
                ?.call(value) as? LocalDate

            val endDate = value::class.memberProperties
                .find { it.name == endDateField }
                ?.call(value) as? LocalDate

            if (startDate != null && endDate != null) {
                return !endDate.isBefore(startDate)
            }

            return true
        } catch (e: Exception) {
            return true
        }
    }
}

// 사용 예시:
@ValidDateRange(startDateField = "startDate", endDateField = "endDate")
data class EventRequest(
    @field:NotNull
    val startDate: LocalDate,

    @field:NotNull
    val endDate: LocalDate,

    @field:NotBlank
    val title: String
)

// ===== 예시 3: Enum 값 검증 =====

@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [ValueOfEnumValidator::class])
annotation class ValueOfEnum(
    val enumClass: KClass<out Enum<*>>,
    val message: String = "유효하지 않은 값입니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class ValueOfEnumValidator : ConstraintValidator<ValueOfEnum, String> {
    private lateinit var enumValues: Set<String>

    override fun initialize(constraintAnnotation: ValueOfEnum) {
        enumValues = constraintAnnotation.enumClass.java.enumConstants
            .map { it.name }
            .toSet()
    }

    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        if (value == null) return true
        return value in enumValues
    }
}

// 사용 예시:
data class UpdateArticleStatusRequest(
    @field:ValueOfEnum(enumClass = ArticleStatus::class, message = "유효하지 않은 상태값입니다")
    val status: String
)

// ===== 실무 팁 =====

/**
 * 1. Validator 성능 최적화
 *    - DB 조회가 필요한 Validator는 신중하게 사용
 *    - 가능하면 캐싱 활용
 *    - Batch 검증 고려
 *
 * 2. 에러 메시지 국제화
 *    - message를 MessageSource에서 읽도록 설정
 *    - 다국어 지원 가능
 *
 * 3. 검증 그룹(Validation Groups) 활용
 *    - 생성 시와 수정 시 다른 검증 규칙 적용 가능
 *    - @Validated(OnCreate::class), @Validated(OnUpdate::class)
 *
 * 4. 조합 가능한 작은 Validator 만들기
 *    - 단일 책임 원칙 적용
 *    - 재사용성 높이기
 *
 * 5. 테스트 코드 필수
 *    - Validator는 비즈니스 규칙의 핵심
 *    - 모든 경우의 수 테스트
 */
*/
