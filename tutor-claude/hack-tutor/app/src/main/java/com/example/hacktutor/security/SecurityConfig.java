package com.example.hacktutor.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.enable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/ping").permitAll()
        .anyRequest().authenticated()
      )
      .httpBasic(Customizer.withDefaults())
      .headers(headers -> headers
        .contentSecurityPolicy(csp -> csp
          .policyDirectives("default-src 'self'")
        )
        .referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
        .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
        .permissionsPolicy(perm -> perm.policy("geolocation=(), microphone=(), camera=()"))
      );

    return http.build();
  }
}
