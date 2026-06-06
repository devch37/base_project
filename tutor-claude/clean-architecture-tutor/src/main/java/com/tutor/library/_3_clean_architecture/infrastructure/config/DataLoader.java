package com.tutor.library._3_clean_architecture.infrastructure.config;

import com.tutor.library._3_clean_architecture.domain.model.Member;
import com.tutor.library._3_clean_architecture.domain.port.out.MemberRepositoryPort;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 앱 시작 시 테스트용 초기 데이터 삽입
 * H2 Console: http://localhost:8080/h2-console
 */
@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initData(MemberRepositoryPort memberRepositoryPort) {
        return args -> {
            memberRepositoryPort.save(Member.createNew("김철수", "kim@example.com"));
            memberRepositoryPort.save(Member.createNew("이영희", "lee@example.com"));
            memberRepositoryPort.save(Member.createNew("박민준", "park@example.com"));

            System.out.println("==============================================");
            System.out.println("테스트 데이터가 로드되었습니다!");
            System.out.println("API 테스트: http://localhost:8080/api/books");
            System.out.println("H2 Console: http://localhost:8080/h2-console");
            System.out.println("  JDBC URL: jdbc:h2:mem:library");
            System.out.println("==============================================");
        };
    }
}
