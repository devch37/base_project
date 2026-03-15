# Spring Security Tutor (Advanced)

This project is a practical, production-style Spring Security learning lab.
It focuses on real-world patterns: JWT access tokens, refresh token rotation,
role/permission based authorization, method security, and structured security errors.

## Tech Stack

- Kotlin 2.3
- Spring Boot 3.4
- Spring Security 6
- JPA + H2 (in-memory)
- JWT (jjwt)

## What You Will Learn

- Stateless authentication with JWT access tokens
- Refresh token rotation and revocation
- Role and permission authorities
- Method-level authorization with `@PreAuthorize`
- Security filter chain configuration
- Custom JSON errors for 401/403
- Account status checks (locked/disabled/expired)

## How To Run

```bash
./gradlew bootRun
```

H2 Console: `http://localhost:8080/h2-console`

JDBC URL: `jdbc:h2:mem:securitydb`

## Default Accounts

- Admin: `admin@local.dev` / `Admin123!`
- User: `user@local.dev` / `User123!`

## API Quick Start

### 1) Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"Admin123!"}'
```

### 2) Access a protected endpoint

```bash
curl http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer <accessToken>"
```

### 3) Refresh tokens

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### 4) Logout (revokes refresh token and blacklists access token)

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Security Highlights (Code Map)

- `security/SecurityConfig.kt`
  - Stateless filter chain
  - Method security enabled
  - Custom auth errors
- `security/JwtTokenProvider.kt`
  - Access/refresh token creation + validation
- `security/JwtAuthenticationFilter.kt`
  - Extracts Bearer token and sets the SecurityContext
- `token/RefreshTokenService.kt`
  - Rotation and revocation
- `user/Role.kt` and `user/Permission.kt`
  - Role/permission model

## Notes

- This project intentionally uses explicit comments in the code to explain
  real-world decisions and tradeoffs.
- The access token blacklist is in-memory for learning; in production you would
  typically use Redis for distributed storage.
