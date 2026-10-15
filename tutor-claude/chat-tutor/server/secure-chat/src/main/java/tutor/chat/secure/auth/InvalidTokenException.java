package tutor.chat.secure.auth;

/** 토큰이 없거나, 위조됐거나, 만료됐거나, 형식이 틀림 → "인증 실패" (HTTP 라면 401) */
public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
        super(message);
    }
}
