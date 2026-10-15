package tutor.chat.cobrowse.auth;

// (secure-chat 모듈의 같은 이름 클래스와 동일. 설명 주석은 그쪽(10~12장)을 참고)

/** 토큰이 없거나, 위조됐거나, 만료됐거나, 형식이 틀림 → "인증 실패" (HTTP 라면 401) */
public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
        super(message);
    }
}
