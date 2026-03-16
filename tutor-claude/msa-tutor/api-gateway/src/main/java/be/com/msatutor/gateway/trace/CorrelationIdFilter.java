package be.com.msatutor.gateway.trace;

import be.com.msatutor.common.trace.TraceHeaders;
import java.util.UUID;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getRequest()
            .getHeaders()
            .getFirst(TraceHeaders.CORRELATION_ID);

        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }

        return chain.filter(
            exchange.mutate()
                .request(builder -> builder.header(TraceHeaders.CORRELATION_ID, correlationId))
                .build()
        );
    }

    @Override
    public int getOrder() {
        return -2;
    }
}
