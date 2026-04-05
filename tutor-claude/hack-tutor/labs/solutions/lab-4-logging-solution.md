# Lab 4 (Solution). 로깅과 민감정보 마스킹

## 요약
- 마스킹 유틸리티를 만들고 로그에 적용한다.

## 예시 코드
```java
public final class Masking {
  private Masking() {}

  public static String maskToken(String token) {
    if (token == null || token.length() < 8) return "****";
    return token.substring(0, 3) + "****" + token.substring(token.length() - 3);
  }
}
```

```java
log.info("login attempt user={} token={}", userId, Masking.maskToken(token));
```
