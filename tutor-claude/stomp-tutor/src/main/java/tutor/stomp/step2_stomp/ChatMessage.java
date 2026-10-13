package tutor.stomp.step2_stomp;

import java.io.Serializable;
import java.time.Instant;

/**
 * 방에 뿌려지는 채팅 메시지.
 *
 * Serializable 인 이유: 3단계에서 Hazelcast 가 이 객체를 "다른 서버로" 보내야 하기 때문.
 * receivedBy: 이 메시지를 처음 받은 서버의 포트 — 서버 2대 실습에서 "어느 서버를 거쳐 왔나"를 눈으로 보기 위해.
 */
public record ChatMessage(String roomId, String sender, String text, int receivedBy, Instant sentAt)
        implements Serializable {}
