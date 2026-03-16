package be.com.msatutor.order.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record OrderRequest(
    @NotBlank String customerId,
    @NotNull @Positive BigDecimal amount
) {
}
