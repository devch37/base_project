package tutor.chat.cobrowse.relay;

import java.io.Serializable;

/** Hazelcast Topic 으로 서버 사이를 오가는 봉투. originNode 는 디버깅용(어느 서버에서 왔나). */
public record RelayedMessage(String destination, byte[] payload, String originNode) implements Serializable {}
