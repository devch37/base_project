package be.com.springsecuritytutor.user

enum class Role(val permissions: Set<Permission>) {
    USER(
        permissions = setOf(
            Permission.USER_READ
        )
    ),
    ADMIN(
        permissions = setOf(
            Permission.USER_READ,
            Permission.USER_WRITE,
            Permission.ADMIN_READ,
            Permission.ADMIN_WRITE
        )
    )
}
