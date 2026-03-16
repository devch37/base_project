package be.com.msatutor.auth.api;

import be.com.msatutor.auth.domain.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthDto.TokenResponse register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        String token = authService.register(request);
        return new AuthDto.TokenResponse(token, "Bearer");
    }

    @PostMapping("/login")
    public AuthDto.TokenResponse login(@Valid @RequestBody AuthDto.LoginRequest request) {
        String token = authService.login(request);
        return new AuthDto.TokenResponse(token, "Bearer");
    }
}
