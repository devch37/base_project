package tutor.chat.basics.room;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 요청 DTO: 클라이언트가 POST /api/rooms 로 보내는 JSON 의 모양.
 *
 * <pre>{ "customerId": "c-100", "topic": "카드 분실" }</pre>
 *
 * <p>Jackson 이 JSON → record 로 바꿔 주고(역직렬화),
 * @Valid 가 붙어 있으면 아래 제약을 검사한다. 실패하면 400 Bad Request.
 * "서버는 클라이언트를 믿지 않는다" — 브라우저 쪽 검증은 UX 용, 서버 검증은 안전용.
 */
public record CreateRoomRequest(
        @NotBlank String customerId,
        @NotBlank @Size(max = 50) String topic
) {}
