package be.com.springsecuritytutor.user

enum class Permission(val authority: String) {
    USER_READ("PERM_USER_READ"),
    USER_WRITE("PERM_USER_WRITE"),
    ADMIN_READ("PERM_ADMIN_READ"),
    ADMIN_WRITE("PERM_ADMIN_WRITE")
}
