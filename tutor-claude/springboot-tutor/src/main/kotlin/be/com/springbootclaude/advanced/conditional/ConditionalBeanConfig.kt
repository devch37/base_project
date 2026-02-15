package be.com.springbootclaude.advanced.conditional

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.*
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile

/**
 * Conditional Bean Configuration
 *
 * ★ 조건에 따라 Bean을 생성하거나 생성하지 않기 ★
 *
 * 조건부 Bean이 필요한 이유:
 * 1. 환경별 설정 (dev, prod)
 * 2. 특정 라이브러리 존재 여부
 * 3. 특정 Bean 존재 여부
 * 4. 프로퍼티 값에 따라
 *
 * Spring Boot의 Auto-Configuration도 이 방식 사용!
 */
@Configuration
class ConditionalBeanConfig {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * @Profile
     * - 가장 기본적인 조건부 Bean
     * - 활성 프로파일에 따라 Bean 생성
     *
     * 사용법:
     * - application.yml: spring.profiles.active=dev
     * - VM 옵션: -Dspring.profiles.active=dev
     * - 환경변수: SPRING_PROFILES_ACTIVE=dev
     */
    @Bean
    @Profile("dev")
    fun devDatabaseConfig(): DatabaseConfig {
        logger.info("🔧 개발 환경 Database Config 생성")
        return DatabaseConfig(
            host = "localhost",
            port = 5432,
            maxConnections = 10
        )
    }

    @Bean
    @Profile("prod")
    fun prodDatabaseConfig(): DatabaseConfig {
        logger.info("🚀 운영 환경 Database Config 생성")
        return DatabaseConfig(
            host = "prod-db.example.com",
            port = 5432,
            maxConnections = 100
        )
    }

    /**
     * @ConditionalOnProperty
     * - 프로퍼티 값에 따라 Bean 생성
     * - application.yml에 설정된 값 확인
     *
     * 옵션:
     * - havingValue: 특정 값일 때
     * - matchIfMissing: 프로퍼티 없을 때 기본값
     */
    @Bean
    @ConditionalOnProperty(
        name = ["app.feature.cache.enabled"],
        havingValue = "true",
        matchIfMissing = false
    )
    fun cacheService(): CacheService {
        logger.info("📦 Cache Service 활성화")
        return CacheService()
    }

    /**
     * @ConditionalOnClass
     * - 특정 클래스가 classpath에 있을 때만 Bean 생성
     * - 라이브러리 의존성 체크
     *
     * 예시: Redis가 있을 때만 RedisCacheManager 생성
     */
    @Bean
    @ConditionalOnClass(name = ["org.springframework.data.redis.core.RedisTemplate"])
    fun redisCacheManager(): String {
        logger.info("🔴 Redis가 감지되어 RedisCacheManager 생성")
        return "RedisCacheManager"
    }

    /**
     * @ConditionalOnMissingClass
     * - 특정 클래스가 없을 때만 Bean 생성
     * - Fallback 구현체
     */
    @Bean
    @ConditionalOnMissingClass("org.springframework.data.redis.core.RedisTemplate")
    fun simpleCacheManager(): String {
        logger.info("📝 Redis가 없어 SimpleCacheManager 생성")
        return "SimpleCacheManager"
    }

    /**
     * @ConditionalOnBean
     * - 특정 Bean이 존재할 때만 생성
     *
     * 예시: DataSource가 있을 때만 JdbcTemplate 생성
     */
    @Bean
    @ConditionalOnBean(name = ["dataSource"])
    fun customJdbcTemplate(): String {
        logger.info("🔧 DataSource 발견, CustomJdbcTemplate 생성")
        return "CustomJdbcTemplate"
    }

    /**
     * @ConditionalOnMissingBean
     * - 특정 Bean이 없을 때만 생성
     * - Auto-Configuration의 핵심!
     * - 사용자 정의 Bean 우선, 없으면 기본 Bean 생성
     *
     * 예시: 사용자가 ObjectMapper를 안 만들면 기본 생성
     */
    @Bean
    @ConditionalOnMissingBean(name = ["customObjectMapper"])
    fun defaultObjectMapper(): String {
        logger.info("🔧 CustomObjectMapper 없음, 기본 ObjectMapper 생성")
        return "DefaultObjectMapper"
    }

    /**
     * @ConditionalOnExpression
     * - SpEL 표현식으로 조건 지정
     * - 복잡한 조건 처리 가능
     */
    @Bean
    @ConditionalOnExpression("\${app.feature.advanced:false} and '\${app.environment}' == 'prod'")
    fun advancedFeature(): String {
        logger.info("🚀 고급 기능 활성화")
        return "AdvancedFeature"
    }

    /**
     * Multiple Conditions
     * - 여러 조건 조합 가능
     */
    @Bean
    @Profile("!test")  // test 프로파일이 아닐 때
    @ConditionalOnProperty(name = ["app.feature.email.enabled"], havingValue = "true")
    fun emailService(): String {
        logger.info("📧 Email Service 생성")
        return "EmailService"
    }
}

/**
 * 예시 클래스들
 */
data class DatabaseConfig(
    val host: String,
    val port: Int,
    val maxConnections: Int
)

class CacheService {
    fun get(key: String): Any? = null
    fun put(key: String, value: Any) {}
}

/**
 * 실무 활용:
 *
 * 1. 환경별 Bean
 *    @Profile("dev") → H2 Database
 *    @Profile("prod") → PostgreSQL
 *
 * 2. Feature Toggle
 *    @ConditionalOnProperty("app.feature.new-ui.enabled")
 *    → 새 UI 기능 On/Off
 *
 * 3. Fallback 구현
 *    @ConditionalOnMissingBean(RedisTemplate::class)
 *    → Redis 없으면 InMemory Cache
 *
 * 4. 라이브러리 자동 감지
 *    @ConditionalOnClass(Kafka::class)
 *    → Kafka 있으면 KafkaProducer 자동 생성
 *
 * 5. Custom Auto-Configuration
 *    - 자신만의 Starter 만들 때 필수
 *    - spring.factories에 등록
 */
