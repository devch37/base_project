# Lab 5. 의존성 취약점 점검

## 목표
- 의존성 취약점 스캔의 기본 개념을 이해한다.
- 프로젝트에 스캔 도구를 통합하는 방법을 익힌다.

## 과제/정답
- `labs/assignments/lab-5-dependency-audit-assignment.md`
- `labs/solutions/lab-5-dependency-audit-solution.md`

## 주석
의존성 취약점은 코드 품질과 별개로 발생한다. 자동화가 중요하지만 **오탐/미탐**을 항상 고려한다.

## 예시(Gradle: OWASP Dependency-Check)
> 네트워크 접근이 필요할 수 있다. 사내 정책에 맞춰 실행한다.

```gradle
plugins {
  id "org.owasp.dependencycheck" version "9.0.9"
}

dependencyCheck {
  failBuildOnCVSS = 7
}
```

실행:
- `./gradlew dependencyCheckAnalyze`

## 체크리스트
- 주요 라이브러리에 대한 업데이트 정책이 있는가
- 취약점 결과를 분류하고 조치 기준을 세웠는가
- CI 파이프라인에 통합할 계획이 있는가
