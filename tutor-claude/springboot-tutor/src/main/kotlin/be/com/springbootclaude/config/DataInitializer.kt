package be.com.springbootclaude.config

import be.com.springbootclaude.domain.Article
import be.com.springbootclaude.domain.User
import be.com.springbootclaude.domain.UserRole
import be.com.springbootclaude.repository.ArticleRepository
import be.com.springbootclaude.repository.UserRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

private val logger = KotlinLogging.logger {}

/**
 * DataInitializer: 애플리케이션 시작 시 초기 데이터 생성
 *
 * 학습 포인트:
 * 1. ApplicationRunner: 애플리케이션 시작 후 자동으로 실행됩니다.
 * 2. @Transactional: 초기 데이터 생성을 하나의 트랜잭션으로 처리합니다.
 * 3. 개발/테스트 환경에서 샘플 데이터를 자동 생성합니다.
 *
 * 실무 팁:
 * - 운영 환경에서는 이런 초기화 로직을 비활성화해야 합니다.
 * - @Profile("dev") 어노테이션으로 개발 환경에서만 실행하도록 설정할 수 있습니다.
 * - 실제 운영에서는 DB Migration 도구(Flyway, Liquibase)를 사용합니다.
 */
@Component
class DataInitializer(
    private val userRepository: UserRepository,
    private val articleRepository: ArticleRepository
) : ApplicationRunner {

    @Transactional
    override fun run(args: ApplicationArguments) {
        logger.info { "=== 초기 데이터 생성 시작 ===" }

        // 사용자 생성
        val users = createUsers()
        logger.info { "사용자 ${users.size}명 생성 완료" }

        // 기사 생성
        val articles = createArticles(users)
        logger.info { "기사 ${articles.size}개 생성 완료" }

        logger.info { "=== 초기 데이터 생성 완료 ===" }
        logger.info { "H2 Console: http://localhost:8080/h2-console" }
        logger.info { "API Docs: http://localhost:8080/api/users, /api/articles" }
    }

    private fun createUsers(): List<User> {
        val users = listOf(
            User(
                email = "admin@example.com",
                name = "관리자",
                role = UserRole.ADMIN
            ),
            User(
                email = "john@example.com",
                name = "John Doe",
                role = UserRole.USER
            ),
            User(
                email = "jane@example.com",
                name = "Jane Smith",
                role = UserRole.USER
            ),
            User(
                email = "bob@example.com",
                name = "Bob Johnson",
                role = UserRole.USER
            )
        )

        return userRepository.saveAll(users)
    }

    private fun createArticles(users: List<User>): List<Article> {
        val articles = listOf(
            Article(
                title = "Spring Boot AOP 완벽 가이드",
                content = """
                    AOP(Aspect-Oriented Programming)는 횡단 관심사를 분리하는 강력한 프로그래밍 패러다임입니다.

                    ## 주요 개념
                    - Aspect: 횡단 관심사를 모듈화한 것
                    - Join Point: 프로그램 실행 중 특정 지점
                    - Pointcut: Join Point를 선택하는 표현식
                    - Advice: Join Point에서 실행할 코드

                    ## 실무 활용
                    1. 로깅: 모든 서비스 메서드 실행 시간 측정
                    2. 트랜잭션: @Transactional 구현
                    3. 보안: @PreAuthorize 구현
                    4. 캐싱: @Cacheable 구현

                    AOP를 잘 활용하면 코드 중복을 줄이고 관심사를 명확히 분리할 수 있습니다.
                """.trimIndent(),
                author = users[0]
            ),
            Article(
                title = "Exception Handling 모범 사례",
                content = """
                    효과적인 예외 처리는 안정적인 API의 핵심입니다.

                    ## 원칙
                    1. 예외를 계층화하라
                    2. 비즈니스 예외와 시스템 예외를 구분하라
                    3. 일관된 에러 응답 포맷을 사용하라

                    ## RFC 7807 Problem Details
                    표준화된 에러 응답 포맷으로, 다음 정보를 포함합니다:
                    - type: 에러 타입
                    - title: 짧은 제목
                    - status: HTTP 상태 코드
                    - detail: 상세 메시지

                    GlobalExceptionHandler를 사용하면 모든 예외를 중앙에서 일관되게 처리할 수 있습니다.
                """.trimIndent(),
                author = users[1]
            ),
            Article(
                title = "Custom Validator 만들기",
                content = """
                    Jakarta Validation을 확장하여 비즈니스 규칙을 선언적으로 표현할 수 있습니다.

                    ## 장점
                    1. 코드가 자기 문서화됩니다
                    2. 재사용성이 높습니다
                    3. 테스트하기 쉽습니다

                    ## 구현 방법
                    1. @Constraint 어노테이션 정의
                    2. ConstraintValidator 구현
                    3. DTO에 적용

                    예: @UniqueEmail, @ValidPhoneNumber, @FutureDate 등

                    복잡한 비즈니스 규칙도 Validator로 캡슐화하면 깔끔합니다.
                """.trimIndent(),
                author = users[2]
            ),
            Article(
                title = "N+1 문제 해결 전략",
                content = """
                    N+1 문제는 ORM 사용 시 가장 흔한 성능 문제입니다.

                    ## 문제 상황
                    게시글 목록 조회 시:
                    1. SELECT * FROM articles (1번)
                    2. SELECT * FROM users WHERE id = ? (N번)

                    총 N+1번의 쿼리가 실행됩니다!

                    ## 해결 방법
                    1. JOIN FETCH: JPQL에서 명시적 조인
                    2. @EntityGraph: 엔티티 그래프 정의
                    3. Batch Size: 한 번에 여러 ID 조회

                    실무에서는 항상 쿼리 로그를 확인하여 N+1 문제를 조기에 발견해야 합니다.
                """.trimIndent(),
                author = users[3]
            ),
            Article(
                title = "트랜잭션 관리 심화",
                content = """
                    Spring의 @Transactional은 매우 강력하지만, 제대로 이해하고 사용해야 합니다.

                    ## 주요 속성
                    - propagation: 트랜잭션 전파 방식
                    - isolation: 격리 수준
                    - readOnly: 읽기 전용 최적화
                    - timeout: 타임아웃 설정

                    ## 주의사항
                    1. private 메서드에는 적용되지 않습니다
                    2. 같은 클래스 내부 호출은 프록시를 거치지 않습니다
                    3. RuntimeException만 자동 롤백됩니다

                    변경 감지(Dirty Checking)를 활용하면 명시적 save() 호출이 필요 없습니다.
                """.trimIndent(),
                author = users[0]
            )
        )

        // 처음 3개는 게시 상태로, 나머지는 임시저장 상태로
        articles.take(3).forEach { it.publish() }

        return articleRepository.saveAll(articles)
    }
}
