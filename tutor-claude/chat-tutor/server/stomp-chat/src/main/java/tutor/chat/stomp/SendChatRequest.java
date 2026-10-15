package tutor.chat.stomp;

/** 클라이언트가 SEND /app/rooms/{roomId}/send 로 보내는 본문 */
public record SendChatRequest(String from, String text) {}
