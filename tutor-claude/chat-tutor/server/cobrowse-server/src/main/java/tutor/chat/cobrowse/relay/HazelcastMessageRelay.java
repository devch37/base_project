package tutor.chat.cobrowse.relay;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.topic.ITopic;

/**
 * 서버 N대용: Hazelcast Topic(Pub/Sub)으로 모든 노드에 방송.
 *
 * <pre>
 *  고객 ─▶ 서버A.publish ─▶ [Hazelcast Topic "cobrowse-relay"] ─┬─▶ 서버A 리스너 ─▶ A 의 로컬 브로커 ─▶ (A 에 붙은 구독자)
 *                                                              └─▶ 서버B 리스너 ─▶ B 의 로컬 브로커 ─▶ 상담사
 * </pre>
 *
 * <p>보낸 서버(A) 자신도 Topic 메시지를 받는다. 그래서 publish 에서 로컬로 "따로" 보내지 않는다.
 * (따로 보내면 A 에 붙은 구독자는 같은 메시지를 두 번 받는다 — 흔한 중복 버그)
 *
 * <p>Topic vs IMap (23장):
 * <ul>
 *   <li>Topic: "지금 듣고 있는 노드"에게 흘려보내는 메시지. 저장되지 않는다. 늦게 온 노드는 못 받는다.</li>
 *   <li>IMap : 저장되는 상태. 언제든 조회 가능. 방 정보·presence 를 여기에 둔다.</li>
 * </ul>
 * 주의: 일반 ITopic 은 노드 장애·과부하 시 메시지를 잃을 수 있다(최대 1회 전달).
 * 화면 동기화는 seq 공백 감지 → 재동기화(19장)로 이 손실을 메운다. 손실이 치명적이면 ReliableTopic 을 검토.
 */
public class HazelcastMessageRelay implements MessageRelay {

    private final ITopic<RelayedMessage> relay;
    private final ITopic<ControlEvent> control;
    private final String nodeId;

    public HazelcastMessageRelay(HazelcastInstance hz, LocalBroker broker, ControlHandler controlHandler, String nodeId) {
        this.relay = hz.getTopic("cobrowse-relay");
        this.control = hz.getTopic("cobrowse-control");
        this.nodeId = nodeId;
        // 모든 노드가 같은 Topic 을 구독한다 → 누가 publish 하든 모든 노드의 리스너가 실행된다
        relay.addMessageListener(m -> broker.send(m.getMessageObject().destination(), m.getMessageObject().payload()));
        control.addMessageListener(m -> controlHandler.handle(m.getMessageObject()));
    }

    @Override
    public void publish(String destination, byte[] json) {
        relay.publish(new RelayedMessage(destination, json, nodeId));
    }

    @Override
    public void publishControl(ControlEvent event) {
        control.publish(event);
    }
}
