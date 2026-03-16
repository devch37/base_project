package be.com.msatutor.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 72) String password
    ) {
    }

    public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
    ) {
    }

    public record TokenResponse(String accessToken, String tokenType) {
    }
}
