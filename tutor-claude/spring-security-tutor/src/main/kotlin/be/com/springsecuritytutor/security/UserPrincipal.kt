package be.com.springsecuritytutor.security

import be.com.springsecuritytutor.user.AccountStatus
import be.com.springsecuritytutor.user.User
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails

class UserPrincipal(
    val user: User
) : UserDetails {

    override fun getAuthorities(): Collection<GrantedAuthority> {
        // Spring Security expects ROLE_ prefix for role-based checks.
        val roleAuthorities = user.roles.map { SimpleGrantedAuthority("ROLE_${it.name}") }
        val permissionAuthorities = user.roles
            .flatMap { it.permissions }
            .distinct()
            .map { SimpleGrantedAuthority(it.authority) }
        return roleAuthorities + permissionAuthorities
    }

    override fun getPassword(): String = user.passwordHash

    override fun getUsername(): String = user.email

    override fun isAccountNonExpired(): Boolean = user.status != AccountStatus.EXPIRED

    override fun isAccountNonLocked(): Boolean = user.status != AccountStatus.LOCKED

    override fun isCredentialsNonExpired(): Boolean = user.status != AccountStatus.EXPIRED

    override fun isEnabled(): Boolean = user.status == AccountStatus.ACTIVE
}
