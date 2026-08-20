package com.jpatutor.ch08_persistence_context;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [8장] 쓰기 지연(transactional write-behind)을 보여주기 위해 일부러 SEQUENCE 전략을 사용한다.
 *
 * 1장에서 다룬 IDENTITY 전략은 DB가 키를 채번하기 때문에, JPA가 ID 값을 알아내려면 반드시
 * INSERT를 즉시 실행해야만 했다 (그래서 persist() 즉시 SQL이 나갔다).
 *
 * 반대로 SEQUENCE 전략은 DB 시퀀스에서 다음 값을 미리 받아와 ID를 채울 수 있으므로,
 * 실제 INSERT 문 자체는 즉시 나가지 않고 영속성 컨텍스트의 "쓰기 지연 SQL 저장소"에 쌓인다.
 * 이 SQL들은 flush 시점(트랜잭션 커밋 직전, 또는 JPQL 실행 직전, 또는 명시적 em.flush())에
 * 한꺼번에 DB로 전달된다. 이 덕분에 하이버네이트는 같은 타입의 INSERT를 모아서
 * JDBC batch insert로 최적화할 수 있는 여지가 생긴다 (실무에서 대량 데이터 처리 시 중요한 포인트).
 */
@Entity
@Table(name = \"ch08_member\")
@Getter
@NoArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    private String name;

    public Member(String name) {
        this.name = name;
    }

    public void changeName(String name) {
        this.name = name;
    }
}
