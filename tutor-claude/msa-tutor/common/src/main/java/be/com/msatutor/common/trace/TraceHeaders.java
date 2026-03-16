package be.com.msatutor.common.trace;

public final class TraceHeaders {
    public static final String CORRELATION_ID = "X-Correlation-Id";
    public static final String IDEMPOTENCY_KEY = "Idempotency-Key";

    private TraceHeaders() {
    }
}
