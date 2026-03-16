package be.com.msatutor.order.trace;

import be.com.msatutor.common.trace.TraceHeaders;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws IOException, jakarta.servlet.ServletException {
        String correlationId = request.getHeader(TraceHeaders.CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        // Echo correlation id for tracing across gateways, services, and logs.
        response.setHeader(TraceHeaders.CORRELATION_ID, correlationId);
        filterChain.doFilter(request, response);
    }
}
