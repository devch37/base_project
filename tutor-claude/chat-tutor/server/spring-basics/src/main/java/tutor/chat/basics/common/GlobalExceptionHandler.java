package tutor.chat.basics.common;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import tutor.chat.basics.policy.PolicyViolationException;
import tutor.chat.basics.room.RoomNotFoundException;

/**
 * 예외 → HTTP 상태 코드 변환을 한곳에 모은다.
 *
 * <p>응답 본문은 RFC 9457 "Problem Details" 형식(ProblemDetail)을 쓴다.
 * <pre>{ "type": "about:blank", "title": "Not Found", "status": 404, "detail": "방을 찾을 수 없습니다: x" }</pre>
 * 클라이언트(브라우저 SDK)가 오류를 늘 같은 모양으로 받을 수 있게 하는 것이 목적이다.
 *
 * <p>상태 코드 고르기:
 * <ul>
 *   <li>400 — 요청 모양이 틀림 (필드 누락, 길이 초과)</li>
 *   <li>404 — 그런 자원 없음</li>
 *   <li>422 — 모양은 맞는데 "업무 규칙"상 처리 불가 (영업시간 외)</li>
 *   <li>403 은 "너는 권한이 없다"(인가, 10장)에 아껴 둔다. 영업시간 외는 권한 문제가 아니다.</li>
 * </ul>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid(MethodArgumentNotValidException e) {
        String detail = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    @ExceptionHandler(RoomNotFoundException.class)
    public ProblemDetail notFound(RoomNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(PolicyViolationException.class)
    public ProblemDetail policy(PolicyViolationException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
    }
}
