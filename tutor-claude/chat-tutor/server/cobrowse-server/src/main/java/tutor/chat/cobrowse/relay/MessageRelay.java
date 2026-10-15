package tutor.chat.cobrowse.relay;

/**
 * "구독자들에게 보내기"를 추상화한 인터페이스 (23장의 핵심).
 *
 * <p>왜 SimpMessagingTemplate 을 바로 쓰지 않나?
 * Spring 의 simple broker 는 "이 서버 메모리 안의 구독자"만 안다.
 * 고객이 서버 A, 상담사가 서버 B 에 붙어 있으면 A 의 브로커에 보낸 화면은 B 의 상담사에게 가지 않는다.
 *
 * <ul>
 *   <li>LocalMessageRelay     — 서버 1대. 로컬 브로커로 바로 보낸다.</li>
 *   <li>HazelcastMessageRelay — 서버 N대. Hazelcast Topic 으로 모든 서버에 방송하고,
 *                               각 서버가 받아서 자기 로컬 브로커로 보낸다.</li>
 * </ul>
 * 컨트롤러는 어느 쪽인지 모른다. 설정(chat.cluster.enabled)만 바꾸면 된다.
 */
public interface MessageRelay {

    /** destination(/topic/...) 의 구독자 전원(모든 서버)에게 JSON 을 보낸다. */
    void publish(String destination, byte[] json);

    /** 클러스터 전체에 제어 명령을 보낸다 (예: 사용자 강제 퇴장 — 소켓은 각 서버만 닫을 수 있으므로). */
    void publishControl(ControlEvent event);
}
