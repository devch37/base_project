package be.com.springbootclaude.validator

import be.com.springbootclaude.domain.ArticleStatus
import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass
import kotlin.reflect.full.memberProperties

/**
 * @ValidPublishedArticle: 게시 상태 기사의 조건부 검증
 *
 * 학습 포인트:
 * 1. 조건부 검증: 특정 조건에서만 검증을 수행합니다.
 * 2. Class 레벨 어노테이션: 필드가 아닌 클래스 전체를 검증합니다.
 * 3. 여러 필드를 조합한 복합 검증이 가능합니다.
 *
 * 실무 팁:
 * - "게시 상태일 때만 제목이 필수"와 같은 복잡한 비즈니스 규칙을 표현할 수 있습니다.
 * - 단일 필드 검증(@NotBlank 등)으로는 불가능한 로직을 구현합니다.
 * - 비즈니스 규칙을 어노테이션으로 선언하면 가독성이 높아집니다.
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [ValidPublishedArticleValidator::class])
annotation class ValidPublishedArticle(
    val message: String = "게시 상태의 기사는 제목과 내용이 필수입니다",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

/**
 * ValidPublishedArticleValidator: 게시 상태 기사 검증 로직
 *
 * 학습 포인트:
 * 1. Class 레벨 Validator는 객체 전체를 검증합니다.
 * 2. Reflection을 사용하여 필드값을 읽을 수 있습니다.
 * 3. 여러 필드의 조합을 검증할 수 있습니다.
 *
 * 실무 팁:
 * - 상태에 따라 다른 검증 규칙을 적용할 때 유용합니다.
 * - 예: 임시저장은 제목만 필수, 게시는 제목+내용 필수
 */
class ValidPublishedArticleValidator : ConstraintValidator<ValidPublishedArticle, Any> {

    override fun isValid(value: Any?, context: ConstraintValidatorContext): Boolean {
        if (value == null) return true

        try {
            // Reflection으로 필드값 읽기
            val statusField = value::class.memberProperties.find { it.name == "status" }
            val titleField = value::class.memberProperties.find { it.name == "title" }
            val contentField = value::class.memberProperties.find { it.name == "content" }

            val status = statusField?.call(value) as? ArticleStatus
            val title = titleField?.call(value) as? String
            val content = contentField?.call(value) as? String

            // PUBLISHED 상태일 때만 제목과 내용 검증
            if (status == ArticleStatus.PUBLISHED) {
                if (title.isNullOrBlank() || content.isNullOrBlank()) {
                    context.disableDefaultConstraintViolation()
                    context.buildConstraintViolationWithTemplate(
                        "게시 상태의 기사는 제목과 내용이 모두 필요합니다"
                    ).addConstraintViolation()
                    return false
                }
            }

            return true
        } catch (e: Exception) {
            // Reflection 실패 시 검증 통과 (안전하게 처리)
            return true
        }
    }
}

/**
 * 사용 예시:
 *
 * @ValidPublishedArticle
 * data class ArticleRequest(
 *     val title: String?,
 *     val content: String?,
 *     val status: ArticleStatus
 * )
 */
