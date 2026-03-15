package be.com.springsecuritytutor.user

data class UserResponse(
    val id: Long,
    val email: String,
    val roles: Set<Role>,
    val status: AccountStatus
) {
    companion object {
        fun from(user: User): UserResponse {
            return UserResponse(
                id = user.id,
                email = user.email,
                roles = user.roles.toSet(),
                status = user.status
            )
        }
    }
}
