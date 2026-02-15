package be.com.springbootclaude.basic.service

import be.com.springbootclaude.basic.domain.User
import be.com.springbootclaude.basic.dto.CreateUserRequest
import be.com.springbootclaude.basic.dto.UserResponse
import be.com.springbootclaude.basic.exception.DuplicateEntityException
import be.com.springbootclaude.basic.exception.EntityNotFoundException
import be.com.springbootclaude.basic.repository.UserRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * UserService: 사용자 비즈니스 로직
 *
 * 학습 포인트:
 * 1. @Service: Spring이 이 클래스를 서비스 빈으로 관리합니다.
 * 2. @Transactional: 메서드 실행을 트랜잭션으로 감쌉니다.
 * 3. readOnly = true: 읽기 전용 트랜잭션 (성능 최적화)
 *
 * 실무 팁:
 * - Service 계층에서 비즈니스 로직과 트랜잭션을 관리합니다.
 * - 읽기 전용 메서드에는 readOnly = true를 사용하세요 (성능 향상).
 * - 예외는 RuntimeException을 사용하면 자동으로 롤백됩니다.
 */
@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository
) {

    /**
     * 사용자 생성
     *
     * 학습 포인트:
     * - @Transactional(readOnly = false)가 기본값이므로 쓰기 작업은 클래스 레벨 어노테이션을 오버라이드합니다.
     * - 이메일 중복 체크를 먼저 수행하여 DB 제약조건 위반을 방지합니다.
     */
    @Transactional
    fun createUser(request: CreateUserRequest): UserResponse {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.email)) {
            throw DuplicateEntityException("이미 존재하는 이메일입니다: ${request.email}")
        }

        val user = request.toEntity()
        val savedUser = userRepository.save(user)
        return UserResponse.from(savedUser)
    }

    /**
     * ID로 사용자 조회
     */
    fun getUserById(id: Long): UserResponse {
        val user = findUserById(id)
        return UserResponse.from(user)
    }

    /**
     * 이메일로 사용자 조회
     */
    fun getUserByEmail(email: String): UserResponse {
        val user = userRepository.findByEmail(email)
            .orElseThrow { EntityNotFoundException("User", email) }
        return UserResponse.from(user)
    }

    /**
     * 모든 사용자 조회
     */
    fun getAllUsers(): List<UserResponse> {
        return userRepository.findAll()
            .map { UserResponse.from(it) }
    }

    /**
     * 내부 헬퍼 메서드: ID로 User 엔티티 조회
     * 실무 팁: 공통 로직은 private 메서드로 추출하면 중복을 줄일 수 있습니다.
     */
    internal fun findUserById(id: Long): User {
        return userRepository.findByIdOrNull(id)
            ?: throw EntityNotFoundException("User", id)
    }
}
