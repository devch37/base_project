# 🔐 Spring Security + OAuth + JWT - Advanced Edition

**Production-Ready 인증/인가 시스템**

이 패키지는 실무에서 바로 사용 가능한 수준의 Spring Security 구현을 제공합니다.

## 🎯 구현된 기능

### 1. ✅ JWT 인증 (Access Token + Refresh Token)
- **Access Token**: 15분 유효기간, API 요청 시 사용
- **Refresh Token**: 7일 유효기간, Access Token 재발급용
- **Refresh Token Rotation**: 보안 Best Practice 적용

### 2. ✅ OAuth 2.0 소셜 로그인
- **Google 로그인**
- **GitHub 로그인**
- 사용자 정보 자동 동기화

### 3. ✅ 토큰 탈취 대응 메커니즘
- **Token Blacklist**: 로그아웃/탈취 시 토큰 즉시 무효화
- **Refresh Token Rotation**: 사용할 때마다 새 토큰 발급
- **IP/User-Agent 검증**: 의심스러운 활동 감지
- **강제 로그아웃**: 모든 세션 일괄 종료 가능

### 4. ✅ 보안 Best Practices
- CSRF 방어
- CORS 설정
- BCrypt 비밀번호 암호화
- Stateless 세션 관리
- 메서드 레벨 보안 (@PreAuthorize)

## 📁 프로젝트 구조

```
security/
├── config/
│   └── SecurityConfig.kt          # Spring Security 설정
├── jwt/
│   ├── JwtTokenProvider.kt        # JWT 생성/검증
│   └── JwtAuthenticationFilter.kt # JWT 인증 필터
├── oauth/
│   ├── CustomOAuth2UserService.kt # OAuth2 사용자 정보 처리
│   └── OAuth2AuthenticationSuccessHandler.kt  # 로그인 성공 핸들러
├── service/
│   ├── RefreshTokenService.kt     # Refresh Token 관리
│   └── TokenBlacklistService.kt   # 토큰 Blacklist (탈취 대응)
├── domain/
│   └── RefreshToken.kt            # Refresh Token 엔티티
├── repository/
│   └── RefreshTokenRepository.kt
└── controller/
    └── AuthController.kt          # 인증 API 엔드포인트
```

## 🚀 시작하기

### 1. OAuth 클라이언트 설정

#### Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 → API 및 서비스 → 사용자 인증 정보
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI: `http://localhost:8080/login/oauth2/code/google`
5. Client ID와 Client Secret을 환경변수로 설정

#### GitHub OAuth 설정
1. [GitHub Settings](https://github.com/settings/developers) → OAuth Apps
2. New OAuth App
3. Authorization callback URL: `http://localhost:8080/login/oauth2/code/github`
4. Client ID와 Client Secret을 환경변수로 설정

### 2. 환경변수 설정

```bash
# JWT Secret (Base64 인코딩된 값)
export JWT_SECRET=your-very-long-secret-key-at-least-256-bits

# Google OAuth
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
export GITHUB_CLIENT_ID=your-github-client-id
export GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. 애플리케이션 실행

```bash
./gradlew bootRun
```

## 📖 API 사용법

### 1. 일반 로그인

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer"
}
```

### 2. OAuth 로그인

브라우저에서 접속:
- Google: `http://localhost:8080/oauth2/authorization/google`
- GitHub: `http://localhost:8080/oauth2/authorization/github`

로그인 성공 시 프론트엔드 redirect URI로 이동:
```
http://localhost:3000/oauth/redirect?accessToken=xxx&refreshToken=yyy
```

### 3. API 요청 (인증 필요)

```bash
GET /api/protected-endpoint
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

### 4. Access Token 갱신

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**응답:**
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",  // ← Rotation 적용!
  "tokenType": "Bearer"
}
```

### 5. 로그아웃

```bash
POST /api/auth/logout
Content-Type: application/json

{
  "accessToken": "current-access-token",
  "refreshToken": "current-refresh-token"
}
```

### 6. 현재 사용자 정보 조회

```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

### 7. 모든 세션 강제 종료 (보안)

```bash
POST /api/auth/revoke-all-sessions
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

## 🛡️ 토큰 탈취 시 대응 방법

### 시나리오: Access Token이 탈취되었다!

**문제점:**
- JWT는 Stateless이므로 서버에서 강제 무효화 불가
- 만료 시간까지는 유효함

**해결 방법 1: 짧은 유효기간 (15분)**
- 탈취되어도 15분 후 자동 만료
- 피해 최소화

**해결 방법 2: 로그아웃 시 Blacklist 추가**
```kotlin
@PostMapping("/logout")
fun logout(@RequestBody request: LogoutRequest) {
    // Access Token을 Blacklist에 추가
    tokenBlacklistService.addToBlacklist(request.accessToken)

    // 이후 해당 토큰으로 요청 시 401 Unauthorized
}
```

**해결 방법 3: 의심스러운 활동 감지 시 모든 세션 종료**
```kotlin
// 사용자의 모든 토큰 무효화
refreshTokenService.revokeAllTokens(userEmail)
tokenBlacklistService.blacklistAllUserTokens(userEmail)
```

### 시나리오: Refresh Token이 탈취되었다!

**문제점:**
- 7일 동안 유효
- 새로운 Access Token 발급 가능

**해결 방법 1: Refresh Token Rotation**
```kotlin
// Refresh Token 사용 시마다 새 토큰 발급
val newRefreshToken = jwtTokenProvider.createRefreshToken(auth)
storedToken.rotate(newRefreshToken, expiresAt)

// 기존 토큰은 무효화
// 공격자가 기존 토큰 재사용 시 감지 가능!
```

**해결 방법 2: IP/User-Agent 검증**
```kotlin
// Refresh Token 발급 시 IP, User-Agent 저장
val refreshToken = RefreshToken(
    userEmail = email,
    token = token,
    ipAddress = request.remoteAddr,
    userAgent = request.getHeader("User-Agent")
)

// 사용 시 비교
if (currentIp != storedToken.ipAddress) {
    logger.warn("🚨 IP 불일치 감지!")
    // 추가 인증 요구 또는 토큰 무효화
}
```

**해결 방법 3: DB에 저장**
```kotlin
// Refresh Token을 DB에 저장
// 탈취 의심 시 DB에서 삭제 → 즉시 무효화
refreshTokenRepository.deleteByUserEmail(userEmail)
```

## 🔬 보안 강화 옵션

### 1. Redis 사용 (권장)

현재는 학습을 위해 ConcurrentHashMap 사용 중.
실무에서는 Redis 사용 권장:

```kotlin
// Token Blacklist with Redis
@Service
class RedisTokenBlacklistService(
    private val redisTemplate: StringRedisTemplate
) {
    fun addToBlacklist(token: String) {
        val expirationDate = jwtTokenProvider.getExpirationDate(token)
        val duration = expirationDate.time - System.currentTimeMillis()

        redisTemplate.opsForValue().set(
            "blacklist:$token",
            "revoked",
            duration,
            TimeUnit.MILLISECONDS
        )
    }

    fun isBlacklisted(token: String): Boolean {
        return redisTemplate.hasKey("blacklist:$token")
    }
}
```

**장점:**
- 빠른 조회 속도 (O(1))
- TTL 자동 만료
- 분산 환경 지원

### 2. 동시 로그인 제한

```kotlin
// 사용자당 최대 N개의 Refresh Token만 허용
fun createRefreshToken(userEmail: String, token: String): RefreshToken {
    val existingTokens = refreshTokenRepository.findByUserEmail(userEmail)

    if (existingTokens.size >= MAX_SESSIONS) {
        // 가장 오래된 토큰 삭제
        val oldestToken = existingTokens.minByOrNull { it.createdAt }
        oldestToken?.let { refreshTokenRepository.delete(it) }
    }

    return refreshTokenRepository.save(...)
}
```

### 3. Rate Limiting

```kotlin
// 토큰 재발급 요청 횟수 제한
@RateLimiter(name = "refreshToken", fallbackMethod = "rateLimitFallback")
@PostMapping("/refresh")
fun refreshToken(...) { ... }
```

### 4. 2FA (Two-Factor Authentication)

```kotlin
// 민감한 작업 시 추가 인증 요구
@PostMapping("/sensitive-action")
@PreAuthorize("hasRole('USER') and @twoFactorService.verify(#code)")
fun sensitiveAction(@RequestParam code: String) { ... }
```

## 📊 모니터링

### Access Token 만료 추이 확인

```kotlin
@GetMapping("/actuator/tokens/stats")
fun getTokenStats(): TokenStats {
    return TokenStats(
        blacklistSize = tokenBlacklistService.getBlacklistSize(),
        activeRefreshTokens = refreshTokenRepository.count(),
        // ...
    )
}
```

### 의심스러운 활동 로그

```kotlin
// 로그 패턴
🚨 Blacklist에 등록된 토큰 사용 시도: 192.168.1.100
🚨 IP 불일치 감지: user=user@example.com, original=192.168.1.1, current=10.0.0.1
🚨 의심스러운 IP 변경 감지: user=user@example.com, ip=suspicious-ip
```

## 🎓 학습 포인트

### 왜 Access Token과 Refresh Token을 나누나?

**Access Token만 사용하면:**
- 유효기간이 길면 → 탈취 시 위험
- 유효기간이 짧으면 → 사용자가 자주 로그인해야 함

**두 개로 나누면:**
- Access Token: 짧은 유효기간 (15분) → 탈취 피해 최소화
- Refresh Token: 긴 유효기간 (7일) → 사용자 편의성
- Refresh Token은 안전하게 저장 (DB, HttpOnly Cookie)

### Refresh Token Rotation이란?

**Before (위험):**
```
1. 사용자: Refresh Token으로 Access Token 요청
2. 서버: 새 Access Token 발급, Refresh Token 그대로
3. 공격자: 탈취한 Refresh Token으로 계속 사용 가능!
```

**After (안전):**
```
1. 사용자: Refresh Token으로 Access Token 요청
2. 서버: 새 Access Token + 새 Refresh Token 발급
3. 서버: 기존 Refresh Token 무효화
4. 공격자: 탈취한 Refresh Token 사용 시도 → 차단!
```

### JWT vs 세션 인증

| 항목 | JWT | 세션 |
|------|-----|------|
| 저장 위치 | 클라이언트 | 서버 |
| Stateful/Stateless | Stateless | Stateful |
| 확장성 | 우수 (분산 시스템) | 보통 (Sticky Session 필요) |
| 보안 | 토큰 탈취 위험 | 세션 고정 공격 위험 |
| 강제 로그아웃 | Blacklist 필요 | 세션 삭제로 즉시 가능 |

## 🔗 다음 단계

1. **User 엔티티와 통합**: 실제 사용자 DB와 연동
2. **Role 기반 권한 관리**: @PreAuthorize("hasRole('ADMIN')")
3. **이메일 인증**: 회원가입 시 이메일 확인
4. **비밀번호 재설정**: 이메일로 재설정 링크 발송
5. **2FA 구현**: Google Authenticator 연동

## 📚 참고 자료

- [Spring Security Official Docs](https://docs.spring.io/spring-security/reference/)
- [JWT.io](https://jwt.io/) - JWT 디버거
- [OAuth 2.0 RFC](https://oauth.net/2/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - 보안 취약점

---

**Happy Coding! 🚀**
