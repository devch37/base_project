package be.com.springsecuritytutor.common

import java.time.Instant

data class ApiError(
    val timestamp: Instant = Instant.now(),
    val status: Int,
    val error: String,
    val message: String,
    val path: String?,
    val errors: List<FieldError> = emptyList()
) {
    data class FieldError(
        val field: String,
        val rejectedValue: Any?,
        val message: String
    )
}
