package be.com.springsecuritytutor.user

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {

    @Transactional
    fun register(email: String, rawPassword: String): User {
        if (userRepository.existsByEmail(email)) {
            throw IllegalArgumentException("Email already exists")
        }

        val user = User(
            email = email,
            passwordHash = passwordEncoder.encode(rawPassword),
            roles = mutableSetOf(Role.USER),
            status = AccountStatus.ACTIVE
        )
        return userRepository.save(user)
    }

    @Transactional(readOnly = true)
    fun findByEmail(email: String): User {
        return userRepository.findByEmail(email)
            ?: throw IllegalArgumentException("User not found")
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): User {
        return userRepository.findById(id)
            .orElseThrow { IllegalArgumentException("User not found") }
    }

    @Transactional(readOnly = true)
    fun findAll(): List<User> = userRepository.findAll()
}
