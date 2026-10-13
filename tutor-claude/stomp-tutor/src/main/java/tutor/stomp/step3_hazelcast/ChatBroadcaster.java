package tutor.stomp.step3_hazelcast;

import tutor.stomp.step2_stomp.ChatMessage;

/**
 * [3단계] "방 구독자 전원에게 보내기"를 인터페이스로 뺐다.
 *
 * 구현 두 개:
 *  - LocalChatBroadcaster     : 서버 1대. 이 서버의 브로커로 바로 보낸다.
 *  - HazelcastChatBroadcaster : 서버 N대. Hazelcast Topic 으로 "모든 서버"에 보내고, 각 서버가 자기 브로커로 보낸다.
 * application.yml 의 app.hazelcast.enabled 값 하나로 어느 쪽이 Bean 이 될지 정해진다 (BroadcastConfig).
 */
public interface ChatBroadcaster {
    void send(ChatMessage message);
}
