package tutor.chat.secure.chat;

import java.time.Instant;

/** from 은 클라이언트가 아니라 서버가 Principal 에서 채운다 — 사칭 불가 */
public record ChatMessage(String roomId, long seq, String type, String from, String role, String text, Instant sentAt) {}
