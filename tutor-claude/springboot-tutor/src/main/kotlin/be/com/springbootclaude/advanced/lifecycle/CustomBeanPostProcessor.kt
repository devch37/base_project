package be.com.springbootclaude.advanced.lifecycle

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.config.BeanPostProcessor
import org.springframework.stereotype.Component

/**
 * Custom BeanPostProcessor
 *
 * BeanPostProcessor란?
 * - 모든 Bean의 초기화 전후에 실행되는 후처리기
 * - Bean 생성 과정에 개입하여 커스터마이징 가능
 * - Spring의 핵심 확장 포인트
 *
 * 실행 순서:
 * 1. postProcessBeforeInitialization
 * 2. @PostConstruct
 * 3. InitializingBean.afterPropertiesSet()
 * 4. postProcessAfterInitialization
 *
 * 실무 활용:
 * - AOP Proxy 생성 (@Transactional, @Async 등)
 * - Bean Validation
 * - Custom Annotation 처리
 * - 로깅, 모니터링
 * - Bean 메타데이터 수집
 */
@Component
class CustomBeanPostProcessor : BeanPostProcessor {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Bean 초기화 전에 실행
     * - @PostConstruct 이전
     * - Bean 수정 가능
     * - 다른 Bean으로 교체 가능
     *
     * @param bean 초기화할 Bean 인스턴스
     * @param beanName Bean 이름
     * @return 수정된 Bean (또는 원본 Bean)
     */
    override fun postProcessBeforeInitialization(bean: Any, beanName: String): Any? {
        // 특정 Bean에만 적용
        if (bean is BeanLifecycleDemo) {
            logger.info("🔧 postProcessBeforeInitialization: $beanName")
            logger.info("   → Bean 초기화 전 처리 (예: Validation)")
        }

        // 실무 예시: Custom Annotation 처리
        processCustomAnnotations(bean, beanName)

        return bean
    }

    /**
     * Bean 초기화 후에 실행
     * - @PostConstruct, afterPropertiesSet() 이후
     * - AOP Proxy 생성 시점
     *
     * @param bean 초기화된 Bean 인스턴스
     * @param beanName Bean 이름
     * @return Proxy Bean 또는 원본 Bean
     */
    override fun postProcessAfterInitialization(bean: Any, beanName: String): Any? {
        if (bean is BeanLifecycleDemo) {
            logger.info("🔧 postProcessAfterInitialization: $beanName")
            logger.info("   → Bean 초기화 완료 (AOP Proxy 생성 시점)")
        }

        // 실무 예시: Proxy 생성
        // return createProxyIfNeeded(bean, beanName)

        return bean
    }

    /**
     * Custom Annotation 처리 예시
     */
    private fun processCustomAnnotations(bean: Any, beanName: String) {
        // 예시: @Audited 어노테이션 처리
        val clazz = bean.javaClass
        if (clazz.isAnnotationPresent(Audited::class.java)) {
            logger.info("   ✅ @Audited 발견: $beanName")
            // 감사 로직 설정
        }

        // 예시: @Cacheable 메서드 스캔
        clazz.methods.forEach { method ->
            if (method.isAnnotationPresent(org.springframework.cache.annotation.Cacheable::class.java)) {
                logger.info("   ✅ @Cacheable 메서드 발견: ${method.name}")
            }
        }
    }
}

/**
 * 실무 활용 예시:
 *
 * 1. AOP Proxy 생성
 *    - @Transactional, @Async, @Cacheable 등
 *    - postProcessAfterInitialization에서 Proxy 생성
 *
 * 2. Bean Validation
 *    - postProcessBeforeInitialization에서 검증
 *    - 조건 미충족 시 예외 발생
 *
 * 3. Custom Annotation 처리
 *    - @Audited, @RateLimited 등 커스텀 어노테이션
 *    - Bean 스캔 및 메타데이터 수집
 *
 * 4. Metrics 수집
 *    - 모든 Bean의 생성 시간 측정
 *    - Micrometer로 메트릭 전송
 */

/**
 * Custom Annotation 예시
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Audited(val value: String = "")
