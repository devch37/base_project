# Lab 4. 로깅과 민감정보 마스킹

## 목표
- 보안 이벤트를 구조화 로그로 남긴다.
- 민감정보를 마스킹한다.

## 과제/정답
- `labs/assignments/lab-4-logging-assignment.md`
- `labs/solutions/lab-4-logging-solution.md`

## 주석
로그는 사고 대응의 핵심 자료다. 그러나 로그 자체가 민감정보 유출원이 될 수 있으므로 **마스킹이 필수**다.

## 예시 코드
### 마스킹 유틸리티
```java
public final class Masking {
  private Masking() {}

  public static String maskToken(String token) {
    if (token == null || token.length() < 8) return "****";
    return token.substring(0, 3) + "****" + token.substring(token.length() - 3);
  }
}
```

### 로그 사용 예
```java
log.info("login attempt user={} token={}", userId, Masking.maskToken(token));
```

## 체크리스트
- 비밀번호/토큰/개인정보를 로그에 남기지 않는가
- 보안 이벤트(로그인 실패 등)를 구조화해서 남기는가
- 운영 로그 보관 정책을 정의했는가
