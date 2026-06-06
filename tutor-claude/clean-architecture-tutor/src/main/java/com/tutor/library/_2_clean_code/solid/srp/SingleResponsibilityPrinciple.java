package com.tutor.library._2_clean_code.solid.srp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ============================================================
 * [2단계 - SOLID 원칙 1] 단일 책임 원칙 (SRP)
 * Single Responsibility Principle
 * ============================================================
 *
 * "클래스를 변경해야 하는 이유가 오직 하나여야 한다."
 * - Robert C. Martin (Uncle Bob)
 *
 * 더 쉽게 말하면:
 * "클래스는 한 가지 일만 해야 한다."
 *
 * 왜 중요한가?
 * - 여러 역할을 하는 클래스는 여러 이유로 변경된다.
 * - 한 기능을 변경했더니 다른 기능이 깨지는 현상이 발생한다.
 * - 테스트하기 어려워진다.
 */
public class SingleResponsibilityPrinciple {

    // ============================================================
    // 나쁜 예: 하나의 클래스가 너무 많은 책임을 가짐
    // ============================================================

    /**
     * 나쁜 예: BookManager가 하는 일이 너무 많다
     * 1. 책 데이터 관리 (비즈니스 로직)
     * 2. 데이터베이스 저장 (인프라)
     * 3. 이메일 발송 (외부 서비스)
     * 4. 보고서 생성 (리포팅)
     *
     * 문제 상황:
     * - 이메일 서버가 바뀌면 이 클래스를 수정해야 함
     * - DB가 MySQL에서 PostgreSQL로 바뀌면 이 클래스를 수정해야 함
     * - 보고서 형식이 바뀌면 이 클래스를 수정해야 함
     * - 책 대출 규칙이 바뀌면 이 클래스를 수정해야 함
     * -> 4가지 이유로 변경되는 클래스 = SRP 위반!
     */
    static class BadBookManager {

        // 비즈니스 로직
        public boolean isAvailableForBorrow(String bookId) {
            // ... DB 조회 로직이 섞임
            return true;
        }

        // DB 저장 (인프라 역할)
        public void saveToDatabase(String bookId, String status) {
            System.out.println("INSERT INTO books SET status='" + status + "' WHERE id=" + bookId);
        }

        // 이메일 발송 (외부 서비스 역할)
        public void sendBorrowConfirmationEmail(String email, String bookTitle) {
            System.out.println("Sending email to " + email + ": You borrowed " + bookTitle);
        }

        // 보고서 생성 (리포팅 역할)
        public String generateMonthlyReport(int year, int month) {
            return "Monthly report for " + year + "/" + month;
        }

        // 이 모든 것이 하나의 클래스에 있다!
        // 어떤 이유로 수정하든 이 클래스의 테스트를 다시 해야 한다.
    }

    // ============================================================
    // 좋은 예: 각 클래스가 하나의 책임만 가짐
    // ============================================================

    /**
     * 좋은 예 1: Book 비즈니스 로직만 담당
     * 변경 이유: "책 대출 규칙이 바뀔 때"만 이 클래스를 수정
     */
    static class BookService {
        private final BookRepository bookRepository;

        BookService(BookRepository bookRepository) {
            this.bookRepository = bookRepository;
        }

        public boolean isAvailableForBorrow(String bookId) {
            Book book = bookRepository.findById(bookId);
            return book != null && book.getStatus().equals("AVAILABLE");
        }

        public void processReturn(String bookId) {
            Book book = bookRepository.findById(bookId);
            book.setStatus("AVAILABLE");
            bookRepository.save(book);
        }
    }

    /**
     * 좋은 예 2: DB 접근만 담당
     * 변경 이유: "DB 기술이 바뀔 때"만 이 클래스를 수정
     */
    static class BookRepository {
        public Book findById(String bookId) {
            // DB 조회 로직
            return new Book(bookId, "AVAILABLE");
        }

        public void save(Book book) {
            // DB 저장 로직
            System.out.println("Saving book: " + book.getId());
        }
    }

    /**
     * 좋은 예 3: 이메일 발송만 담당
     * 변경 이유: "이메일 서버/형식이 바뀔 때"만 이 클래스를 수정
     */
    static class EmailNotificationService {
        public void sendBorrowConfirmation(String email, String bookTitle) {
            System.out.println("Sending email to " + email + ": You borrowed " + bookTitle);
        }

        public void sendReturnReminder(String email, String bookTitle, LocalDateTime dueDate) {
            System.out.println("Reminder: Return '" + bookTitle + "' by " + dueDate);
        }
    }

    /**
     * 좋은 예 4: 보고서 생성만 담당
     * 변경 이유: "보고서 형식이 바뀔 때"만 이 클래스를 수정
     */
    static class LoanReportService {
        private final BookRepository bookRepository;

        LoanReportService(BookRepository bookRepository) {
            this.bookRepository = bookRepository;
        }

        public String generateMonthlyReport(int year, int month) {
            return "Monthly Loan Report: " + year + "/" + month;
        }
    }

    /**
     * 결과:
     * - BookService 수정 -> Book 비즈니스 로직 테스트만 다시 실행
     * - BookRepository 수정 -> DB 관련 테스트만 다시 실행
     * - EmailNotificationService 수정 -> 이메일 관련 테스트만 다시 실행
     * - LoanReportService 수정 -> 보고서 관련 테스트만 다시 실행
     *
     * 각 클래스는 독립적으로 테스트 가능하고 변경 가능!
     */

    static class Book {
        private String id;
        private String status;

        Book(String id, String status) {
            this.id = id;
            this.status = status;
        }

        public String getId() { return id; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
