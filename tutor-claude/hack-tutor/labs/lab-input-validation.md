# Lab 2. 입력 검증과 안전한 DTO

## 목표
- Bean Validation을 사용해 입력을 검증한다.
- 컨트롤러가 검증된 데이터만 받도록 만든다.

## 과제/정답
- `labs/assignments/lab-2-input-validation-assignment.md`
- `labs/solutions/lab-2-input-validation-solution.md`

## 주석
입력 검증은 **가장 비용 대비 효과가 큰 방어**다. 모든 외부 입력은 신뢰하지 않는다.

## 예시 코드
### DTO
```java
public class CreateUserRequest {
  @NotBlank
  @Size(max = 50)
  private String username;

  @NotBlank
  @Email
  private String email;

  // getter/setter
}
```

### Controller
```java
@PostMapping("/users")
public ResponseEntity<Void> create(@Valid @RequestBody CreateUserRequest req) {
  // req는 검증된 상태
  return ResponseEntity.ok().build();
}
```

### 에러 응답 표준화
```java
@RestControllerAdvice
public class ValidationErrorHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handle(MethodArgumentNotValidException e) {
    Map<String, String> errors = new HashMap<>();
    e.getBindingResult().getFieldErrors()
      .forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));
    return ResponseEntity.badRequest().body(errors);
  }
}
```

## 체크리스트
- 입력 DTO에 검증 애너테이션을 부착했는가
- 검증 실패 시 응답 포맷을 표준화했는가
- 컨트롤러가 `String` 파라미터를 무분별하게 받지 않는가
