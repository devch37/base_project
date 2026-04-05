# Lab 2 (Solution). 입력 검증과 안전한 DTO

## 요약
- DTO에 검증 애너테이션을 추가하고, 예외 응답을 표준화한다.

## 예시 코드
```java
public class CreateUserRequest {
  @NotBlank
  @Size(max = 50)
  private String username;

  @NotBlank
  @Email
  private String email;
}
```

```java
@PostMapping("/users")
public ResponseEntity<Void> create(@Valid @RequestBody CreateUserRequest req) {
  return ResponseEntity.ok().build();
}
```

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
