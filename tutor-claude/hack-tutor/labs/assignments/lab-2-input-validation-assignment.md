# Lab 2 (Assignment). 입력 검증과 안전한 DTO

## 목표
- Bean Validation으로 입력을 검증한다.
- 검증 실패 응답을 표준화한다.

## 과제
- `CreateUserRequest` DTO에 검증 애너테이션을 적용한다.
- 컨트롤러에서 `@Valid`를 사용한다.
- 검증 실패 시 필드별 에러를 내려주는 예외 핸들러를 만든다.

## 힌트
- `@NotBlank`, `@Email`, `@Size`
- `@RestControllerAdvice`

## 체크리스트
- 문자열 파라미터를 컨트롤러에서 직접 받지 않는가
- 검증 실패 응답이 일정한 포맷인가
