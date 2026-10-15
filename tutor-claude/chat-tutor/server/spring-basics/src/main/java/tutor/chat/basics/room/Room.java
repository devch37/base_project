package tutor.chat.basics.room;

import java.time.Instant;

/**
 * 도메인 객체: "상담방".
 *
 * <p>DTO(CreateRoomRequest, RoomResponse)와 일부러 분리했다.
 * 도메인은 서버 내부의 진실이고, DTO 는 "밖과 주고받는 모양"이다.
 * 둘을 합치면 API 응답 모양을 바꾸려다 내부 로직이 깨지거나,
 * 내부 필드(예: 메모, 상담사 내부 ID)가 실수로 응답에 노출된다.
 */
public record Room(
        String id,
        String customerId,
        String customerName,
        String topic,
        Instant createdAt,
        String internalMemo // 응답에 절대 나가면 안 되는 내부 정보 (DTO 분리의 이유)
) {}
