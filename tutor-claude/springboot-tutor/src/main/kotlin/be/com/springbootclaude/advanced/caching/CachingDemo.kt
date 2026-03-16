package be.com.springbootclaude.advanced.caching

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.CachePut
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

/**
 * Caching Demo
 *
 * ★ Spring Cache Abstraction ★
 *
 * 캐싱이 필요한 이유:
 * 1. 성능 향상 - DB 조회 감소
 * 2. 비용 절감 - 외부 API 호출 감소
 * 3. 응답 속도 - 빠른 응답
 *
 * Spring Cache 어노테이션:
 * - @Cacheable: 캐시 조회 및 저장
 * - @CachePut: 캐시 업데이트
 * - @CacheEvict: 캐시 삭제
 * - @Caching: 여러 캐시 작업 조합
 *
 * 지원 캐시 구현체:
 * - ConcurrentHashMap (기본)
 * - EhCache
 * - Caffeine ✅ 권장
 * - Redis ✅ 분산 환경
 * - Hazelcast
 */
@Service
class CachingDemo {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * @Cacheable
     * - 캐시에서 조회, 없으면 메서드 실행 후 저장
     * - 같은 파라미터면 캐시 반환 (메서드 실행 안 함)
     *
     * 옵션:
     * - value/cacheNames: 캐시 이름
     * - key: 캐시 키 (SpEL)
     * - condition: 캐싱 조건
     * - unless: 캐싱 제외 조건
     *
     * 사용 시나리오:
     * - 자주 조회되는 데이터
     * - 변경이 적은 데이터
     * - 계산 비용이 큰 데이터
     */
    @Cacheable(
        value = ["products"],
        key = "#productId",
        condition = "#productId > 0"
    )
    fun getProduct(productId: Long): Product {
        logger.info("🔍 DB에서 상품 조회: productId=$productId")
        // 실제로는 DB 조회
        Thread.sleep(1000) // DB 조회 시뮬레이션
        return Product(productId, "상품 $productId", 10000)
    }

    /**
     * @Cacheable with Complex Key
     * - 여러 파라미터를 조합한 키
     * - SpEL 표현식 사용
     */
    @Cacheable(
        value = ["productSearch"],
        key = "#category + ':' + #keyword",
        unless = "#result.isEmpty()"  // 결과가 비어있으면 캐싱 안 함
    )
    fun searchProducts(category: String, keyword: String): List<Product> {
        logger.info("🔍 상품 검색: category=$category, keyword=$keyword")
        Thread.sleep(500)
        return listOf(
            Product(1, "$category - $keyword", 10000)
        )
    }

    /**
     * @CachePut
     * - 항상 메서드 실행
     * - 결과를 캐시에 업데이트
     *
     * @Cacheable과의 차이:
     * - @Cacheable: 캐시 있으면 메서드 실행 안 함
     * - @CachePut: 항상 메서드 실행, 캐시 업데이트
     *
     * 사용 시나리오:
     * - 데이터 수정 후 캐시 갱신
     */
    @CachePut(
        value = ["products"],
        key = "#product.id"
    )
    fun updateProduct(product: Product): Product {
        logger.info("💾 상품 업데이트: productId=${product.id}")
        // DB 업데이트
        return product
    }

    /**
     * @CacheEvict
     * - 캐시 삭제
     *
     * 옵션:
     * - allEntries: 캐시 전체 삭제
     * - beforeInvocation: 메서드 실행 전 삭제
     *
     * 사용 시나리오:
     * - 데이터 삭제
     * - 데이터 무효화
     * - 캐시 초기화
     */
    @CacheEvict(
        value = ["products"],
        key = "#productId"
    )
    fun deleteProduct(productId: Long) {
        logger.info("🗑️ 상품 삭제: productId=$productId")
        // DB 삭제
    }

    /**
     * 캐시 전체 삭제
     */
    @CacheEvict(
        value = ["products"],
        allEntries = true
    )
    fun clearAllProductCache() {
        logger.info("🧹 상품 캐시 전체 삭제")
    }

    /**
     * 조건부 캐싱
     * - premium 고객만 캐싱
     */
    @Cacheable(
        value = ["userProfile"],
        key = "#userId",
        condition = "#isPremium == true"
    )
    fun getUserProfile(userId: Long, isPremium: Boolean): UserProfile {
        logger.info("🔍 사용자 프로필 조회: userId=$userId")
        return UserProfile(userId, "User $userId", isPremium)
    }
}

/**
 * 실무 캐싱 전략
 */
@Service
class CachingStrategy {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Cache-Aside Pattern (권장)
     * 1. 캐시 조회
     * 2. 있으면 반환
     * 3. 없으면 DB 조회 후 캐시 저장
     *
     * @Cacheable이 이 패턴
     */
    @Cacheable("users")
    fun getUser(userId: Long): User {
        // DB 조회
        return User(userId, "User $userId")
    }

    /**
     * Write-Through Pattern
     * - 쓰기 시 DB와 캐시 동시 업데이트
     *
     * @CachePut이 이 패턴
     */
    @CachePut(value = ["users"], key = "#user.id")
    fun saveUser(user: User): User {
        // DB 저장
        // 캐시도 자동 업데이트
        return user
    }

    /**
     * Cache Warming
     * - 애플리케이션 시작 시 캐시 미리 로드
     * - 첫 요청 응답 시간 단축
     */
     @PostConstruct
    fun warmUpCache() {
        logger.info("🔥 캐시 워밍업 시작")
        // 인기 상품 100개 미리 캐싱
        // (1..100).forEach { getProduct(it.toLong()) }
        logger.info("✅ 캐시 워밍업 완료")
    }

    /**
     * TTL (Time To Live) 설정
     * - 캐시 만료 시간
     * - CacheManager 설정에서 지정
     *
     * 예시 (Caffeine):
     * @Bean
     * fun cacheManager(): CacheManager {
     *     return CaffeineCacheManager().apply {
     *         setCaffeine(Caffeine.newBuilder()
     *             .expireAfterWrite(10, TimeUnit.MINUTES)
     *             .maximumSize(1000)
     *         )
     *     }
     * }
     */
}

data class Product(val id: Long, val name: String, val price: Int)
data class UserProfile(val id: Long, val name: String, val isPremium: Boolean)
data class User(val id: Long, val name: String)

/**
 * 실무 체크리스트:
 *
 * 1. 캐시할 데이터 선정
 *    ✅ 자주 조회되는 데이터
 *    ✅ 변경이 적은 데이터
 *    ✅ 계산 비용이 큰 데이터
 *    ❌ 실시간 데이터
 *    ❌ 민감한 개인정보
 *
 * 2. 캐시 키 설계
 *    - 고유해야 함
 *    - 충돌 방지
 *    - 의미 있는 이름
 *
 * 3. 캐시 무효화
 *    - 데이터 변경 시 캐시 삭제/업데이트
 *    - TTL 설정
 *    - 수동 초기화 API
 *
 * 4. 캐시 크기
 *    - 메모리 사용량 모니터링
 *    - 최대 크기 설정
 *    - LRU 정책
 *
 * 5. 분산 환경
 *    - Local Cache: Caffeine (빠름)
 *    - Distributed Cache: Redis (공유)
 *    - 2-Level Cache: Caffeine + Redis
 */
