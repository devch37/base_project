package tutor.chat.basics;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tutor.chat.basics.crm.CrmClient;

/**
 * 05장: HTTP 요청·응답을 "실제 서버를 띄우지 않고" 검증한다 (MockMvc).
 * 상태 코드, 헤더, JSON 본문 — 02장에서 배운 HTTP 의 구성 요소를 하나씩 확인한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RoomApiTest {

    @Autowired MockMvc mvc;

    // 외부 CRM 호출은 이 테스트의 관심사가 아니므로 가짜(mock)로 바꿔 끼운다 — DI 덕분에 가능한 일.
    @MockitoBean CrmClient crmClient;

    @Test
    void 방을_만들면_201과_Location_헤더를_돌려준다() throws Exception {
        org.mockito.Mockito.when(crmClient.findCustomerName("c-1")).thenReturn("홍길동");

        mvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":\"c-1\",\"topic\":\"카드 분실\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/rooms/")))
                .andExpect(jsonPath("$.customerName").value("홍길동"))
                // DTO 분리의 효과: 내부 메모는 응답에 없다
                .andExpect(jsonPath("$.internalMemo").doesNotExist());
    }

    @Test
    void 필수값이_빠지면_400_ProblemDetail() throws Exception {
        mvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":\"\",\"topic\":\"x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("customerId")));
    }

    @Test
    void 없는_방은_404() throws Exception {
        mvc.perform(get("/api/rooms/nope"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("nope")));
    }
}
