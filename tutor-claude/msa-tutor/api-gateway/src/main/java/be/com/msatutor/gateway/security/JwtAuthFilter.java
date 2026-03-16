package be.com.msatutor.gateway.security;

import be.com.msatutor.common.trace.TraceHeaders;
import io.jsonwebtoken.Claims;
import java.util.List;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/auth/**",
        "/actuator/**"
    );

    private final JwtVerifier jwtVerifier;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtAuthFilter(JwtVerifier jwtVerifier) {
        this.jwtVerifier = jwtVerifier;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (isPublic(path)) {
            return chain.filter(exchange);
        }

        String header = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            return unauthorized(exchange, "Missing Authorization header");
        }

        String token = header.substring("Bearer ".length()).trim();
        Claims claims = jwtVerifier.parse(token).orElse(null);
        if (claims == null) {
            return unauthorized(exchange, "Invalid token");
        }

        // Propagate correlation id and user identity to downstream services.
        // In production, prefer a standardized identity header or mTLS with SPIFFE.
        String correlationId = exchange.getRequest().getHeaders().getFirst(TraceHeaders.CORRELATION_ID);
        return chain.filter(
            exchange.mutate()
                .request(builder -> builder
                    .header("X-User-Id", String.valueOf(claims.get("uid")))
                    .header("X-User-Email", claims.getSubject())
                    .header(TraceHeaders.CORRELATION_ID, correlationId == null ? "" : correlationId)
                )
                .build()
        );
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private boolean isPublic(String path) {
        return PUBLIC_PATHS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"message\":\"" + message + "\"}").getBytes();
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse()
            .bufferFactory()
            .wrap(body)));
    }
}
