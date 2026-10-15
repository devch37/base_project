package tutor.chat.basics;

import static org.assertj.core.api.Assertions.assertThat;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tutor.chat.basics.crm.CrmClient;
import tutor.chat.basics.crm.CrmResult.Outcome;

/**
 * 06장: 진짜 HTTP 서버(JDK 내장 HttpServer)를 "상대 회사 CRM"으로 띄워 놓고
 * 타임아웃·재시도·오류 분류가 의도대로 동작하는지 확인한다.
 * Mock 이 아니라 실제 소켓을 쓰기 때문에 타임아웃까지 진짜로 검증된다.
 */
@SpringBootTest(properties = {"chat.crm.read-timeout=300ms", "chat.crm.max-attempts=3"})
class CrmClientTest {

    static final HttpServer crm;
    // 고객 ID 별 호출 횟수. (테스트끼리 섞이지 않게 ID 마다 따로 센다)
    static final Map<String, AtomicInteger> hits = new ConcurrentHashMap<>();

    static {
        try {
            crm = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0); // 0 = 빈 포트 아무거나
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        crm.createContext("/customers/", exchange -> {
            String id = exchange.getRequestURI().getPath().substring("/customers/".length());
            hits.computeIfAbsent(id, k -> new AtomicInteger()).incrementAndGet();
            try {
                if (id.startsWith("slow")) Thread.sleep(1000);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            int status = id.startsWith("err") ? 500 : id.startsWith("none") ? 404 : 200;
            byte[] body = ("{\"name\":\"김고객\"}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(status, status == 200 ? body.length : -1);
            if (status == 200) exchange.getResponseBody().write(body);
            exchange.close();
        });
        // 주의: executor 를 안 정하면 JDK HttpServer 는 "스레드 1개"로 요청을 하나씩 처리한다.
        // 그러면 느린 요청 하나가 뒤의 모든 요청을 막는다 — 서버 스레드 모델이 왜 중요한지 보여 주는 실제 함정.
        crm.setExecutor(Executors.newCachedThreadPool());
        crm.start();
    }

    @DynamicPropertySource
    static void crmUrl(DynamicPropertyRegistry registry) {
        registry.add("chat.crm.base-url", () -> "http://127.0.0.1:" + crm.getAddress().getPort());
    }

    @AfterAll
    static void stop() {
        crm.stop(0);
    }

    @Autowired CrmClient client;

    @Test
    void 정상() {
        var r = client.lookup("c-1");
        assertThat(r.outcome()).isEqualTo(Outcome.FOUND);
        assertThat(r.name()).isEqualTo("김고객");
    }

    @Test
    void _404는_재시도하지_않는다() {
        var r = client.lookup("none-1");
        assertThat(r.outcome()).isEqualTo(Outcome.NOT_FOUND);
        assertThat(hits.get("none-1").get()).isEqualTo(1);
    }

    @Test
    void _500은_최대횟수까지_재시도한_뒤_대체값() {
        var r = client.lookup("err-1");
        assertThat(r.outcome()).isEqualTo(Outcome.UNAVAILABLE);
        assertThat(r.name()).isEqualTo("고객");
        assertThat(hits.get("err-1").get()).isEqualTo(3);
    }

    @Test
    void 읽기_타임아웃이면_오래_기다리지_않고_대체값() {
        long start = System.nanoTime();
        var r = client.lookup("slow-1");
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertThat(r.outcome()).isEqualTo(Outcome.UNAVAILABLE);
        // 300ms × 3회 + 백오프(100+200ms) ≈ 1.2s. 상대가 1초씩 끌어도 우리는 정해진 시간 안에 포기한다.
        assertThat(elapsedMs).isLessThan(2500);
    }
}
