package be.com.springbootclaude.advanced.lifecycle

import jakarta.annotation.PostConstruct
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.DisposableBean
import org.springframework.beans.factory.InitializingBean
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationContext
import org.springframework.stereotype.Component

/**
 * Bean Lifecycle Demo
 *
 * ★ Spring Bean의 생명주기를 완벽하게 이해하기 ★
 *
 * Bean 생명주기 순서:
 * 1. 생성자 호출
 * 2. 의존성 주입 (@Autowired)
 * 3. BeanNameAware.setBeanName()
 * 4. BeanFactoryAware.setBeanFactory()
 * 5. ApplicationContextAware.setApplicationContext()
 * 6. @PostConstruct
 * 7. InitializingBean.afterPropertiesSet()
 * 8. @Bean(initMethod = "init")
 * 9. ▶ Bean 사용 가능 상태 ◀
 * 10. @PreDestroy
 * 11. DisposableBean.destroy()
 * 12. @Bean(destroyMethod = "cleanup")
 *
 * 실무 활용:
 * - 초기화 로직: 외부 API 연결, 캐시 워밍업, 리소스 할당
 * - 종료 로직: 연결 종료, 임시 파일 삭제, 리소스 해제
 */
@Component
class BeanLifecycleDemo(
    // 1. 생성자 주입 (권장)
    private val applicationContext: ApplicationContext
) : InitializingBean, DisposableBean {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Constructor (생성자)
     * - Bean 생성의 첫 단계
     * - 필수 의존성 주입 (생성자 주입)
     */
    init {
        logger.info("1️⃣ 생성자 호출됨")
    }

    /**
     * Field/Setter Injection
     * - 생성자 이후 실행
     * - 선택적 의존성에 사용
     */
    @Autowired
    fun setOptionalDependency(context: ApplicationContext) {
        logger.info("2️⃣ @Autowired 메서드 호출됨 (의존성 주입)")
    }

    /**
     * @PostConstruct
     * - JSR-250 표준 (Jakarta Annotations)
     * - 가장 많이 사용되는 초기화 방법
     * - 의존성 주입 완료 후 실행
     *
     * 실무 활용:
     * - DB 연결 풀 초기화
     * - 외부 API 클라이언트 설정
     * - 캐시 워밍업
     * - 스케줄러 시작
     */
    @PostConstruct
    fun postConstruct() {
        logger.info("3️⃣ @PostConstruct 호출됨")
        logger.info("   → 실무 예시: DB 연결 풀 초기화")
        logger.info("   → 실무 예시: Redis 연결 확인")
        logger.info("   → 실무 예시: 외부 API Health Check")

        // 예시: 초기화 작업
        initializeResources()
    }

    /**
     * InitializingBean.afterPropertiesSet()
     * - Spring 인터페이스
     * - @PostConstruct 이후 실행
     * - 프레임워크에 종속적이므로 @PostConstruct 권장
     */
    override fun afterPropertiesSet() {
        logger.info("4️⃣ InitializingBean.afterPropertiesSet() 호출됨")
        logger.info("   → @PostConstruct 권장, 이건 레거시 코드에서 볼 수 있음")
    }

    /**
     * 실제 초기화 로직
     */
    private fun initializeResources() {
        // 1. 데이터베이스 연결 확인
        // dataSource.connection.use { conn ->
        //     logger.info("✅ Database connection OK")
        // }

        // 2. Redis 연결 확인
        // redisTemplate.opsForValue().set("health:check", "OK")

        // 3. 외부 API Health Check
        // restTemplate.getForEntity("https://api.example.com/health", String::class.java)

        // 4. 캐시 워밍업
        // cacheManager.getCache("products")?.put("top-100", loadTopProducts())

        logger.info("✅ 모든 리소스 초기화 완료")
    }

    /**
     * Bean이 실제로 사용 가능한 상태
     * - 모든 초기화 완료
     * - 다른 Bean에서 주입받아 사용 가능
     */
    fun doBusinessLogic() {
        logger.info("📊 비즈니스 로직 실행 중...")
    }

    /**
     * @PreDestroy
     * - JSR-250 표준
     * - ApplicationContext 종료 시 호출
     * - 리소스 정리, 연결 종료
     *
     * 실무 활용:
     * - DB 연결 종료
     * - 외부 API 연결 종료
     * - 임시 파일 삭제
     * - 진행 중인 작업 완료 대기
     */
    @PreDestroy
    fun preDestroy() {
        logger.info("5️⃣ @PreDestroy 호출됨")
        logger.info("   → 실무 예시: DB 연결 종료")
        logger.info("   → 실무 예시: 임시 파일 삭제")
        logger.info("   → 실무 예시: 진행 중인 작업 완료 대기")

        cleanupResources()
    }

    /**
     * DisposableBean.destroy()
     * - Spring 인터페이스
     * - @PreDestroy 이후 실행
     * - 프레임워크에 종속적이므로 @PreDestroy 권장
     */
    override fun destroy() {
        logger.info("6️⃣ DisposableBean.destroy() 호출됨")
        logger.info("   → @PreDestroy 권장, 이건 레거시 코드에서 볼 수 있음")
    }

    /**
     * 실제 정리 로직
     */
    private fun cleanupResources() {
        // 1. 데이터베이스 연결 종료
        // dataSource.close()

        // 2. Redis 연결 종료
        // redisConnectionFactory.destroy()

        // 3. HTTP Client 종료
        // httpClient.close()

        // 4. 임시 파일 삭제
        // Files.walk(tempDir).sorted(Comparator.reverseOrder()).forEach { Files.delete(it) }

        // 5. 진행 중인 작업 완료 대기 (Graceful Shutdown)
        // executorService.shutdown()
        // executorService.awaitTermination(30, TimeUnit.SECONDS)

        logger.info("✅ 모든 리소스 정리 완료")
    }

    /**
     * Lazy Initialization
     * - Bean이 실제로 사용될 때 초기화
     * - 애플리케이션 시작 시간 단축
     * - 메모리 절약
     */
    companion object {
        /**
         * Lazy Bean 생성 예시
         * @Bean
         * @Lazy
         * fun expensiveBean(): ExpensiveService {
         *     return ExpensiveService()
         * }
         */
    }
}

/**
 * 실무 팁: Bean Lifecycle 활용
 *
 * 1. @PostConstruct vs Constructor
 *    - Constructor: 필수 의존성 주입
 *    - @PostConstruct: 선택적 초기화 (예외 발생 가능)
 *
 * 2. Graceful Shutdown
 *    - @PreDestroy에서 진행 중인 작업 완료 대기
 *    - spring.lifecycle.timeout-per-shutdown-phase 설정
 *
 * 3. 초기화 실패 처리
 *    - @PostConstruct에서 예외 발생 시 Bean 생성 실패
 *    - 애플리케이션 시작 실패
 *    - 필수 리소스 확인용으로 활용
 *
 * 4. 외부 리소스 연결
 *    - DB, Redis, Kafka 등 외부 리소스
 *    - @PostConstruct에서 연결 확인
 *    - @PreDestroy에서 연결 종료
 */
