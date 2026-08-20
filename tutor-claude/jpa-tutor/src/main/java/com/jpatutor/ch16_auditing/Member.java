package com.jpatutor.ch16_auditing;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * [16장] 소프트 삭제(Soft Delete) - 실무에서 매우 자주 쓰는 패턴.
 * 회원 탈퇴, 게시글 삭제처럼 "완전히 지우면 안 되고, 복구/통계/법적 보관 요구사항 때문에
 * 흔적은 남겨야 하는" 데이터에 사용한다.
 *
 * - @SQLDelete: repository.delete(entity)를 호출했을 때 실제로 실행되는 SQL을 가로채서
 *   DELETE 대신 여기 적은 UPDATE 문으로 바꿔치기 한다. deleted 컬럼을 true로 바꾸는 것만으로
 *   "삭제"를 표현한다.
 * - @SQLRestriction: 이 엔티티에 대한 모든 SELECT 쿼리(findAll, findById 등 포함)에
 *   자동으로 WHERE절을 추가한다. 즉 deleted=true인 로우는 마치 존재하지 않는 것처럼
 *   투명하게 걸러진다. (예전 Hibernate에서는 같은 역할을 @Where가 담당했는데, 최신
 *   버전에서는 @SQLRestriction으로 대체되었다)
 *
 * 주의점: @SQLRestriction은 JPQL/Criteria/Spring Data 쿼리 메서드에는 자동 적용되지만,
 * 네이티브 쿼리에는 적용되지 않는다. 그리고 이 필터는 "이 엔티티에 대한" 조건만 자동 추가할 뿐,
 * 연관관계를 통해 조인해서 들어오는 경우까지 완벽하게 막아주는 건 아니므로 복잡한 조인 쿼리에서는
 * 항상 직접 검증이 필요하다.
 */
@Entity
@Table(name = \"ch16_member\")
@SQLDelete(sql = "update ch16_member set deleted = true where id = ?")
@SQLRestriction("deleted = false")
@Getter
@NoArgsConstructor
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private boolean deleted = false;

    public Member(String name) {
        this.name = name;
    }

    public void changeName(String name) {
        this.name = name;
    }
}
