package tutor.chat.cobrowse.presence;

import java.io.Serializable;

/**
 * "누가 어느 방에서 무엇을 하고 있나" 한 줄.
 * Hazelcast 의 조건 검색(Predicates.equal("roomId", ..))이 getter 로 필드를 읽으므로 일반 클래스로 둔다.
 */
public class PresenceEntry implements Serializable {

    private String roomId;
    private String userId;
    private String role;     // CUSTOMER | AGENT
    private String channel;  // screen(상담사가 화면 보는 중) | commands(고객이 화면 공유 중) | chat
    private String nodeId;   // 어느 서버에 붙어 있나 — 장애 분석에 유용

    public PresenceEntry() {}

    public PresenceEntry(String roomId, String userId, String role, String channel, String nodeId) {
        this.roomId = roomId;
        this.userId = userId;
        this.role = role;
        this.channel = channel;
        this.nodeId = nodeId;
    }

    public String getRoomId() { return roomId; }
    public String getUserId() { return userId; }
    public String getRole() { return role; }
    public String getChannel() { return channel; }
    public String getNodeId() { return nodeId; }
}
