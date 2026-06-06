package com.tutor.library._3_clean_architecture.domain.model;

/**
 * 책의 상태를 나타내는 도메인 열거형
 * 매직 문자열("1", "2", "AVAILABLE") 대신 타입 안전한 Enum 사용
 */
public enum BookStatus {
    AVAILABLE("대출 가능"),
    BORROWED("대출 중"),
    LOST("분실");

    private final String description;

    BookStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
