package be.com.springsecuritytutor.bootstrap

import be.com.springsecuritytutor.user.AccountStatus
import be.com.springsecuritytutor.user.Role
import be.com.springsecuritytutor.user.User
import be.com.springsecuritytutor.user.UserRepository
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration
class DataInitializer {

    @Bean
    fun seedUsers(
        userRepository: UserRepository,
        passwordEncoder: PasswordEncoder
    ): CommandLineRunner {
        return CommandLineRunner {
            if (!userRepository.existsByEmail("admin@local.dev")) {
                userRepository.save(
                    User(
                        email = "admin@local.dev",
                        passwordHash = passwordEncoder.encode("Admin123!"),
                        roles = mutableSetOf(Role.ADMIN),
                        status = AccountStatus.ACTIVE
                    )
                )
            }

            if (!userRepository.existsByEmail("user@local.dev")) {
                userRepository.save(
                    User(
                        email = "user@local.dev",
                        passwordHash = passwordEncoder.encode("User123!"),
                        roles = mutableSetOf(Role.USER),
                        status = AccountStatus.ACTIVE
                    )
                )
            }
        }
    }
}
