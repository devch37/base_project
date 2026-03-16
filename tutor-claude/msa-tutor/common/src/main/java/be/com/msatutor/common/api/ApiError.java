package be.com.msatutor.common.api;

import java.time.Instant;
import java.util.List;

public record ApiError(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path,
    List<FieldError> errors
) {
    public record FieldError(String field, Object rejectedValue, String message) {
    }
}
