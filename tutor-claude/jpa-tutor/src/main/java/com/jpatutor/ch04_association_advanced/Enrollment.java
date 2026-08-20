package com.jpatutor.ch04_association_advanced;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * [4장] Student <-> Course 다대다 관계를 풀어낸 "연결 엔티티".
 *
 * @ManyToMany 대신 이렇게 중간 엔티티를 직접 두면:
 * - enrolledDate, grade처럼 "수강 신청"이라는 관계 자체에 속하는 데이터를 자연스럽게 담을 수 있다.
 * - Student -> Enrollment, Course -> Enrollment 각각 평범한 @OneToMany/@ManyToOne이므로
 *   3장에서 배운 것과 동일한 방식으로 조회/최적화(fetch join, N+1 대응 등)를 적용할 수 있다.
 */
@Entity
@Table(name = \"ch04_enrollment\")
@Getter
@NoArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    private LocalDate enrolledDate;

    private String grade;

    public Enrollment(Student student, Course course, LocalDate enrolledDate) {
        this.student = student;
        this.course = course;
        this.enrolledDate = enrolledDate;
        student.getEnrollments().add(this);
        course.getEnrollments().add(this);
    }

    public void assignGrade(String grade) {
        this.grade = grade;
    }
}
