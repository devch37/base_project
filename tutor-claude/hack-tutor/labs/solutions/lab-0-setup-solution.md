# Lab 0 (Solution). 로컬 실습 환경 만들기

## 요약
- 로컬 전용 Spring Boot 앱을 생성하고 `/ping`을 추가한다.

## 예시 구조
- `src/main/java/com/example/hacktutor/HackTutorApplication.java`
- `src/main/java/com/example/hacktutor/api/PingController.java`

## 예시 코드
```java
@RestController
public class PingController {
  @GetMapping("/ping")
  public String ping() {
    return "pong";
  }
}
```

## 실행
- `./gradlew bootRun`
