package be.com.springsecuritytutor.user

import be.com.springsecuritytutor.security.UserPrincipal
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class UserController(
    private val userService: UserService
) {

    @GetMapping("/users/me")
    fun me(@AuthenticationPrincipal principal: UserPrincipal): UserResponse {
        return UserResponse.from(principal.user)
    }

    // Allow reading your own profile or require admin read permission.
    @PreAuthorize("#id == principal.user.id or hasAuthority('PERM_ADMIN_READ')")
    @GetMapping("/users/{id}")
    fun getById(@PathVariable id: Long): UserResponse {
        val user = userService.findById(id)
        return UserResponse.from(user)
    }

    @PreAuthorize("hasAuthority('PERM_ADMIN_READ')")
    @GetMapping("/admin/users")
    fun list(): List<UserResponse> {
        return userService.findAll().map(UserResponse::from)
    }
}
