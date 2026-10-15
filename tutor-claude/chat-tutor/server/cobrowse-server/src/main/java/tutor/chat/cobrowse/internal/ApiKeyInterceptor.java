package tutor.chat.cobrowse.internal;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import tutor.chat.cobrowse.auth.TenantProperties;

/**
 * HTTP 쪽 관문: /internal/** 은 X-Api-Key 가 맞아야 통과.
 *
 * <p>인증 검사를 "어디서" 하는가 — 이 프로젝트에 등장하는 세 곳:
 * <ol>
 *   <li>Servlet Filter       : DispatcherServlet 앞. Spring Security 가 여기서 일한다.</li>
 *   <li>HandlerInterceptor   : DispatcherServlet 뒤, Controller 앞 (이 클래스). 어떤 핸들러로 갈지 안 뒤라 경로별 적용이 쉽다.</li>
 *   <li>ChannelInterceptor   : STOMP 프레임마다 (StompAuthInterceptor). WebSocket 연결 "안"의 메시지는 위 두 개를 지나가지 않는다!</li>
 * </ol>
 */
@Component
public class ApiKeyInterceptor implements HandlerInterceptor {

    static final String TENANT_ATTR = "tenant";
    private final TenantProperties tenants;

    public ApiKeyInterceptor(TenantProperties tenants) {
        this.tenants = tenants;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        var tenant = tenants.tenantOf(request.getHeader("X-Api-Key"));
        if (tenant.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401: 누구인지 모르겠다
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"invalid api key\"}");
            return false; // 컨트롤러까지 가지 않는다
        }
        request.setAttribute(TENANT_ATTR, tenant.get());
        return true;
    }
}
