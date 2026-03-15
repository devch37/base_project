package be.com.springsecuritytutor.security

import be.com.springsecuritytutor.common.ApiError
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.stereotype.Component

@Component
class SecurityExceptionHandler(
    private val objectMapper: ObjectMapper
) : AuthenticationEntryPoint, AccessDeniedHandler {

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        writeError(response, request, HttpStatus.UNAUTHORIZED, "Authentication required")
    }

    override fun handle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        accessDeniedException: AccessDeniedException
    ) {
        writeError(response, request, HttpStatus.FORBIDDEN, "Access denied")
    }

    private fun writeError(
        response: HttpServletResponse,
        request: HttpServletRequest,
        status: HttpStatus,
        message: String
    ) {
        response.status = status.value()
        response.contentType = "application/json"

        val body = ApiError(
            status = status.value(),
            error = status.reasonPhrase,
            message = message,
            path = request.requestURI
        )

        response.writer.write(objectMapper.writeValueAsString(body))
    }
}
