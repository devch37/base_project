package tutor.chat.stomp;

import java.time.Instant;

/**
 * 방에 뿌려지는 채팅 메시지 (서버 → 클라이언트).
 * seq: 방 안에서 서버가 붙이는 순번. 19장에서 "빠진 메시지가 있는지" 알아내는 열쇠가 된다.
 */
public record ChatMessage(String roomId, long seq, String type, String from, String text, Instant sentAt) {}
