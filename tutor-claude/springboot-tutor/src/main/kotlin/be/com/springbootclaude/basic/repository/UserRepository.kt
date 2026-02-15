package be.com.springbootclaude.basic.repository

import be.com.springbootclaude.basic.domain.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

/**
 * UserRepository: 사용자 데이터 접근 계층
 *
 * 학습 포인트:
 * 1. JpaRepository를 상속하면 기본 CRUD 메서드가 자동으로 제공됩니다.
 *    - save(), findById(), findAll(), delete() 등
 * 2. 메서드 이름 규칙(Query Method)으로 쿼리를 자동 생성할 수 있습니다.
 *    - findByEmail -> SELECT ... FROM users WHERE email = ?
 * 3. Optional을 반환하면 null 안전성이 높아집니다.
 *
 * 실무 팁:
 * - Repository는 인터페이스만 정의하면 Spring Data JPA가 구현체를 자동 생성합니다.
 * - 복잡한 쿼리는 @Query 어노테이션을 사용하거나 QueryDSL을 활용하세요.
 * - @Repository 어노테이션은 선택사항이지만, 명시하면 가독성이 좋습니다.
 */
@Repository
interface UserRepository : JpaRepository<User, Long> {

    /**
     * 이메일로 사용자 조회
     * Query Method 패턴: findBy + 필드명
     */
    fun findByEmail(email: String): Optional<User>

    /**
     * 이메일 존재 여부 확인
     * Query Method 패턴: existsBy + 필드명
     */
    fun existsByEmail(email: String): Boolean
}
