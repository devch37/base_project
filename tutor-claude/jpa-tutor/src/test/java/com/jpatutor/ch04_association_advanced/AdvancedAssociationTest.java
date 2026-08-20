package com.jpatutor.ch04_association_advanced;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class AdvancedAssociationTest {

    @Autowired
    EntityManager em;

    @Test
    @DisplayName("OneToOne: 주인(Member)에 세팅해야 locker_id FK가 반영된다")
    @Transactional
    void oneToOneOwnerSide() {
        Locker locker = new Locker("5-1");
        Member member = new Member("홍길동");
        em.persist(locker);
        em.persist(member);

        member.assignLocker(locker);
        em.flush();
        em.clear();

        Member reloaded = em.find(Member.class, member.getId());
        assertThat(reloaded.getLocker().getNumber()).isEqualTo("5-1");
    }

    @Test
    @DisplayName("ManyToMany 대신 연결 엔티티(Enrollment)로 부가 데이터(수강일, 성적)를 담을 수 있다")
    @Transactional
    void manyToManyResolvedByJoinEntity() {
        Student student = new Student("이영희");
        Course course = new Course("데이터베이스 개론");
        em.persist(student);
        em.persist(course);

        Enrollment enrollment = new Enrollment(student, course, LocalDate.of(2026, 3, 2));
        em.persist(enrollment);
        enrollment.assignGrade("A+");

        em.flush();
        em.clear();

        Enrollment reloaded = em.find(Enrollment.class, enrollment.getId());
        assertThat(reloaded.getStudent().getName()).isEqualTo("이영희");
        assertThat(reloaded.getCourse().getTitle()).isEqualTo("데이터베이스 개론");
        assertThat(reloaded.getGrade()).isEqualTo("A+");
    }
}
