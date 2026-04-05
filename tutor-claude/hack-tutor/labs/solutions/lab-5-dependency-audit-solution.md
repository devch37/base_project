# Lab 5 (Solution). 의존성 취약점 점검

## 요약
- Dependency-Check를 추가하고 스캔을 실행한다.

## 예시(Gradle)
```gradle
plugins {
  id "org.owasp.dependencycheck" version "9.0.9"
}

dependencyCheck {
  failBuildOnCVSS = 7
}
```

## 실행
- `./gradlew dependencyCheckAnalyze`
