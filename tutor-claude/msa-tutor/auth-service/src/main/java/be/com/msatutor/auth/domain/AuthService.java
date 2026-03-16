package be.com.msatutor.auth.domain;

import be.com.msatutor.auth.api.AuthDto;
import be.com.msatutor.auth.security.JwtTokenService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService tokenService;

    public AuthService(
        AuthUserRepository repository,
        PasswordEncoder passwordEncoder,
        JwtTokenService tokenService
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public String register(AuthDto.RegisterRequest request) {
        // Keep auth service as the single source of user credentials.
        if (repository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        AuthUser user = new AuthUser();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole("USER");
        repository.save(user);

        return tokenService.generate(user);
    }

    @Transactional(readOnly = true)
    public String login(AuthDto.LoginRequest request) {
        // Password check stays inside auth-service to avoid credential leakage.
        AuthUser user = repository.findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return tokenService.generate(user);
    }
}
