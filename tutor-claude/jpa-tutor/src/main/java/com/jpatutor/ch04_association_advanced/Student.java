package com.jpatutor.ch04_association_advanced;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * [4장] @ManyToMany를 "실무에서는 절대 그대로 쓰지 않는다"는 걸 보여주기 위한 예제.
 *
 * JPA는 @ManyToMany를 지원하지만, 실무에서는 거의 사용하지 않는다. 이유:
 * 1) 중간 조인 테이블에 컬럼을 추가할 수 없다 (예: 수강 신청일, 성적 등 부가 정보를 못 담는다).
 * 2) 실제로 실행되는 SQL을 예측/제어하기 어렵다 (숨겨진 조인 테이블이라 쿼리 최적화가 힘들다).
 * 3) 조인 테이블에 대한 별도의 엔티티가 없어서 조회 조건을 걸거나 페이징하기 까다롭다.
 *
 * 그래서 실무에서는 항상 다대다를 "일대다 + 다대일"로 풀어서, 중간에 명시적인 연결 엔티티
 * (여기서는 Enrollment)를 둔다. 이렇게 하면 수강 신청일, 성적처럼 관계 자체에 속하는 데이터를
 * 자연스럽게 담을 수 있다.
 */
@Entity
@Table(name = \"ch04_student\")
@Getter
@NoArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "student")
    private List<Enrollment> enrollments = new ArrayList<>();

    public Student(String name) {
        this.name = name;
    }
}
