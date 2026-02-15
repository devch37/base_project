package be.com.springbootclaude.basic.domain

import jakarta.persistence.*

/**
 * User: 사용자 엔티티
 *
 * 학습 포인트:
 * 1. @Entity: JPA가 관리하는 엔티티 클래스
 * 2. @Table: 테이블 이름과 인덱스 설정
 * 3. @Column: 컬럼 제약조건 (unique, nullable 등)
 * 4. @Enumerated: Enum 타입 저장 방식 (EnumType.STRING 권장)
 *
 * 실무 팁:
 * - EnumType.ORDINAL은 Enum 순서가 바뀌면 데이터가 깨지므로 절대 사용하지 마세요!
 * - unique 제약조건은 DB 레벨에서 중복을 방지합니다.
 * - @Column(name = "...")로 컬럼명을 명시적으로 지정하면 코드 리팩토링에 안전합니다.
 */
@Entity
@Table(
    name = "users",
    indexes = [
        Index(name = "idx_user_email", columnList = "email")
    ]
)
class User(
    @Column(nullable = false, unique = true, length = 100)
    var email: String,

    @Column(nullable = false, length = 50)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var role: UserRole = UserRole.USER
) : BaseEntity() {

    /**
     * 비즈니스 로직: 관리자 여부 확인
     * 실무 팁: 엔티티에 간단한 비즈니스 로직을 넣으면 응집도가 높아집니다.
     */
    fun isAdmin(): Boolean = role == UserRole.ADMIN
}

/**
 * UserRole: 사용자 권한
 *
 * 학습 포인트:
 * - Enum을 사용하면 타입 안정성이 높아집니다.
 * - description을 추가하면 API 응답에서 사용자 친화적인 메시지를 제공할 수 있습니다.
 */
enum class UserRole(val description: String) {
    USER("일반 사용자"),
    ADMIN("관리자")
}
