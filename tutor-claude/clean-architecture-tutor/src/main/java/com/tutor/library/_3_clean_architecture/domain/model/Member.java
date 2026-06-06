package com.tutor.library._3_clean_architecture.domain.model;

/**
 * 도메인 모델 - Member (도서관 회원)
 * 프레임워크 의존성 없는 순수 Java 클래스
 */
public class Member {

    private static final int DEFAULT_BORROW_LIMIT = 5;

    private Long id;
    private String name;
    private String email;
    private int borrowLimit;

    public static Member createNew(String name, String email) {
        validateName(name);
        validateEmail(email);

        Member member = new Member();
        member.name = name;
        member.email = email;
        member.borrowLimit = DEFAULT_BORROW_LIMIT;
        return member;
    }

    public static Member reconstitute(Long id, String name, String email, int borrowLimit) {
        Member member = new Member();
        member.id = id;
        member.name = name;
        member.email = email;
        member.borrowLimit = borrowLimit;
        return member;
    }

    // ============================================================
    // 비즈니스 규칙: 대출 한도 초과 여부 확인
    // ============================================================

    /**
     * 이 메서드가 도메인 모델에 있는 이유:
     * "대출 한도 초과 여부 확인"은 비즈니스 규칙이다.
     * 서비스 레이어가 아닌 도메인 모델이 알아야 할 지식이다.
     * 만약 서비스에 있다면: memberCurrentCount >= 5 (매직 넘버!)
     * 도메인 모델에 있으면: member.hasExceededBorrowLimit(currentCount)
     */
    public boolean canBorrowMore(int currentBorrowCount) {
        return currentBorrowCount < borrowLimit;
    }

    public boolean hasExceededBorrowLimit(int currentBorrowCount) {
        return !canBorrowMore(currentBorrowCount);
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("이름은 필수입니다.");
        }
    }

    private static void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        if (!email.contains("@")) {
            throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다: " + email);
        }
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public int getBorrowLimit() { return borrowLimit; }

    public void assignId(Long id) {
        if (this.id != null) {
            throw new IllegalStateException("ID는 이미 할당되었습니다.");
        }
        this.id = id;
    }
}
