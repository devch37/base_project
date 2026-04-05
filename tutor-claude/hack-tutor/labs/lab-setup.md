# Lab 0. 로컬 실습 환경 만들기 (Spring Boot)

## 목표
- **로컬 전용** 보안 실습 환경을 만든다.
- 이후 모든 실습의 기반이 되는 간단한 Spring Boot 앱을 준비한다.

## 과제/정답
- `labs/assignments/lab-0-setup-assignment.md`
- `labs/solutions/lab-0-setup-solution.md`

## 주석
실습은 반드시 **내 PC/내 VM**에서만 진행한다. 외부 시스템은 건드리지 않는다.

## 준비
- JDK 17+
- Spring Boot 3.x
- Gradle 또는 Maven

## 단계
1. Spring Initializr로 프로젝트 생성
- Group: `com.example`
- Artifact: `hacktutor`
- Dependencies: `Spring Web`, `Spring Security`, `Validation`

2. 기본 컨트롤러 추가
- `GET /ping` 같은 단순 엔드포인트 하나만 만든다.
- 이 단계에서는 **기능보다 구조**가 중요하다.

3. 로컬 실행
- `./gradlew bootRun` 또는 `./mvnw spring-boot:run`

## 참고
- 이 레포에는 동일한 구조의 샘플 앱이 `app/`에 포함되어 있다.

## 체크리스트
- 외부 DB/외부 서비스 의존 없이 로컬에서 실행되는가
- 실습 중 생성된 테스트 데이터는 민감정보가 아닌가
