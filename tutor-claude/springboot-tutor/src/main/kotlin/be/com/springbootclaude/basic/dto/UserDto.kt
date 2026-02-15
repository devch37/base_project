package be.com.springbootclaude.basic.dto

import be.com.springbootclaude.basic.domain.User
import be.com.springbootclaude.basic.domain.UserRole
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

/**
 * UserDto: 사용자 관련 DTO
 */

/**
 * 사용자 생성 요청 DTO
 */
data class CreateUserRequest(
    @field:NotBlank(message = "이메일은 필수입니다")
    @field:Email(message = "올바른 이메일 형식이 아닙니다")
    val email: String,

    @field:NotBlank(message = "이름은 필수입니다")
    @field:Size(min = 2, max = 50, message = "이름은 2~50자 사이여야 합니다")
    val name: String
) {
    fun toEntity(): User {
        return User(
            email = this.email,
            name = this.name
        )
    }
}

/**
 * 사용자 응답 DTO
 */
data class UserResponse(
    val id: Long,
    val email: String,
    val name: String,
    val role: UserRole,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(user: User): UserResponse {
            return UserResponse(
                id = user.id!!,
                email = user.email,
                name = user.name,
                role = user.role,
                createdAt = user.createdAt
            )
        }
    }
}
