package tutor.chat.basics.room;

import java.time.Instant;

/** 응답 DTO: 밖에 보여 줘도 되는 필드만 골라 담는다 (internalMemo 없음). */
public record RoomResponse(String id, String customerId, String customerName, String topic, Instant createdAt) {

    public static RoomResponse from(Room room) {
        return new RoomResponse(room.id(), room.customerId(), room.customerName(), room.topic(), room.createdAt());
    }
}
