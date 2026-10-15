package tutor.chat.cobrowse.relay;

import java.io.Serializable;

/** 노드 간 제어 명령. type: "kick" */
public record ControlEvent(String type, String tenant, String userId) implements Serializable {}
