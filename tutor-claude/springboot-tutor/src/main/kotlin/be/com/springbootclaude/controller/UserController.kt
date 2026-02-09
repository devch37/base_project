package be.com.springbootclaude.controller

import be.com.springbootclaude.dto.CreateUserRequest
import be.com.springbootclaude.dto.UserResponse
import be.com.springbootclaude.service.UserService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

/**
 * UserController: 사용자 API 엔드포인트
 *
 * 학습 포인트:
 * 1. @RestController: @Controller + @ResponseBody (자동 JSON 변환)
 * 2. @RequestMapping: 기본 경로 설정
 * 3. @Valid: DTO의 validation 어노테이션을 실행합니다.
 * 4. @ResponseStatus: HTTP 상태 코드 설정
 *
 * 실무 팁:
 * - Controller는 얇게 유지하세요. 비즈니스 로직은 Service에!
 * - @Valid를 사용하면 DTO 검증이 자동으로 실행됩니다.
 * - POST 요청 성공 시 201 Created를 반환하는 것이 RESTful합니다.
 */
@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {

    /**
     * 사용자 생성
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createUser(@Valid @RequestBody request: CreateUserRequest): UserResponse {
        return userService.createUser(request)
    }

    /**
     * 사용자 조회 (ID)
     */
    @GetMapping("/{id}")
    fun getUser(@PathVariable id: Long): UserResponse {
        return userService.getUserById(id)
    }

    /**
     * 모든 사용자 조회
     */
    @GetMapping
    fun getAllUsers(): List<UserResponse> {
        return userService.getAllUsers()
    }
}
