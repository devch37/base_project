package tutor.chat.basics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tutor.chat.basics.crm.CrmClient;
import tutor.chat.basics.policy.BusinessHoursConsultPolicy;
import tutor.chat.basics.policy.ConsultPolicy;

/**
 * 05장 핵심: 설정값(chat.tenant) 하나로 정책 Bean 이 바뀌는지 확인.
 * 시각은 Clock Bean 을 교체해 "2026-10-10(토) 서울 오후 3시"로 고정한다.
 */
@SpringBootTest(properties = "chat.tenant=acme-bank")
@AutoConfigureMockMvc
class TenantPolicyTest {

    @TestConfiguration
    static class FixedClock {
        @Bean
        @Primary // 같은 타입 Bean 이 둘이면 이것을 우선 주입
        Clock saturdayAfternoon() {
            // 06:00 UTC = 15:00 KST, 2026-10-10 은 토요일
            return Clock.fixed(Instant.parse("2026-10-10T06:00:00Z"), ZoneOffset.UTC);
        }
    }

    @Autowired ConsultPolicy policy;
    @Autowired MockMvc mvc;
    @MockitoBean CrmClient crmClient;

    @Test
    void acme_bank_설정이면_영업시간_정책_Bean이_주입된다() {
        assertThat(policy).isInstanceOf(BusinessHoursConsultPolicy.class);
    }

    @Test
    void 주말에는_422로_거절된다() throws Exception {
        mvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":\"c-1\",\"topic\":\"대출\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("주말")));
    }

    @Test
    void 평일_영업시간_경계값() {
        // 월요일 08:59 KST 는 거절, 09:00 은 허용, 18:00 은 거절
        assertThat(policy.allowOpen("c", Instant.parse("2026-10-12T23:59:00Z").minusSeconds(86400)).allowed()).isFalse();
        assertThat(policy.allowOpen("c", Instant.parse("2026-10-12T00:00:00Z")).allowed()).isTrue();
        assertThat(policy.allowOpen("c", Instant.parse("2026-10-12T09:00:00Z")).allowed()).isFalse();
    }
}
