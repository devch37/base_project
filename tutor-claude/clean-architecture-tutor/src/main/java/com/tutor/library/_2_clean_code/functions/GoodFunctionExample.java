package com.tutor.library._2_clean_code.functions;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================
 * [2단계 - 클린 코드 원칙 2] 좋은 함수 설계 예시
 * ============================================================
 *
 * 좋은 함수의 규칙:
 * 1. 작게 만들어라 (20줄 이내 권장)
 * 2. 한 가지만 해라 (Single Responsibility)
 * 3. 위에서 아래로 읽히도록 추상화 수준을 맞춰라
 * 4. 서술적인 이름을 사용하라
 * 5. 인수를 최소화하라 (0~2개 권장)
 * 6. 부수 효과를 없애라
 * 7. 명령과 조회를 분리하라 (Command Query Separation)
 */
public class GoodFunctionExample {

    private BookRepository bookRepository = new BookRepository();
    private MemberRepository memberRepository = new MemberRepository();
    private LoanRepository loanRepository = new LoanRepository();
    private NotificationService notificationService = new NotificationService();

    // ============================================================
    // 핵심 원칙: 함수는 딱 "한 가지" 일만 해야 한다.
    // 아래 borrowBook()은 전체 흐름을 보여주는 "오케스트레이터"
    // 각 세부 작업은 별도의 작은 함수가 담당
    // ============================================================

    /**
     * 책 대출 처리 - 전체 흐름만 담당 (추상화 수준이 일관됨)
     * 이 함수만 읽어도 대출 프로세스 전체를 파악할 수 있음
     */
    public LoanResult borrowBook(String bookId, String memberId) {
        Book book = findAvailableBookOrThrow(bookId);
        Member member = findActiveMemberOrThrow(memberId);

        validateBorrowLimit(member);

        Loan loan = createLoan(book, member);
        markBookAsBorrowed(book, member);

        notificationService.sendBorrowConfirmation(member, book, loan);

        return LoanResult.success(loan);
    }

    // 각 함수가 딱 "한 가지" 일만 함 - 이름만 봐도 무슨 일인지 명확

    private Book findAvailableBookOrThrow(String bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException(bookId));

        if (!book.isAvailable()) {
            throw new BookAlreadyBorrowedException(bookId);
        }
        return book;
    }

    private Member findActiveMemberOrThrow(String memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new MemberNotFoundException(memberId));
    }

    private void validateBorrowLimit(Member member) {
        int currentBorrowCount = loanRepository.countActiveLoansByMember(member.getId());
        if (member.hasExceededBorrowLimit(currentBorrowCount)) {
            throw new BorrowLimitExceededException(member.getId());
        }
    }

    private Loan createLoan(Book book, Member member) {
        return loanRepository.save(Loan.of(book, member));
    }

    private void markBookAsBorrowed(Book book, Member member) {
        book.markAsBorrowed(member.getId());
        bookRepository.save(book);
    }

    // ============================================================
    // 좋은 예 2: 플래그 인수 제거 -> 함수를 둘로 분리
    // ============================================================

    // 나쁜 버전: render(boolean isHtml)
    // 좋은 버전: 명확히 분리된 두 함수
    public String renderAsHtml() {
        return "<html><body>책 목록</body></html>";
    }

    public String renderAsJson() {
        return "{\"books\": []}";
    }

    // ============================================================
    // 좋은 예 3: 출력 인수 제거 -> 리턴값으로 반환
    // ============================================================

    // 나쁜 버전: void appendFooter(StringBuffer pageText)
    // 좋은 버전: 새 값을 반환
    public String withFooter(String pageContent) {
        return pageContent + "\n--Footer--";
    }

    // ============================================================
    // 좋은 예 4: 부수 효과 제거 - 함수 이름이 하는 일을 정확히 설명
    // ============================================================

    // 비밀번호 확인과 세션 초기화를 분리
    public boolean verifyPassword(String username, String password) {
        // 오직 비밀번호 검증만 담당
        return "valid".equals(password);
    }

    public void initializeSession(String username) {
        // 세션 초기화만 담당
        System.out.println("Session initialized for: " + username);
    }

    // 호출하는 쪽:
    // if (verifyPassword(username, password)) {
    //     initializeSession(username);
    // }
    // -> 각 함수가 무슨 일을 하는지 명확!

    // ============================================================
    // 좋은 예 5: Command Query Separation - 명령과 조회 분리
    // ============================================================

    private Map<String, String> attributes = new HashMap<>();

    // Query (조회): 값을 바꾸지 않고 존재 여부만 확인
    public boolean hasAttribute(String attribute) {
        return attributes.containsKey(attribute);
    }

    // Command (명령): 값을 설정, 반환값 없음
    public void setAttribute(String attribute, String value) {
        attributes.put(attribute, value);
    }

    // 호출하는 쪽:
    // if (!hasAttribute("userName")) {
    //     setAttribute("userName", "bob");
    // }
    // -> 각각이 뭘 하는지 완전히 명확!

    // ============================================================
    // 내부용 더미 클래스들 (실제로는 별도 파일)
    // ============================================================

    private static class Book {
        private String id;
        public boolean isAvailable() { return true; }
        public void markAsBorrowed(String memberId) {}
    }

    private static class Member {
        private String id;
        public String getId() { return id; }
        public boolean hasExceededBorrowLimit(int count) { return count >= 5; }
    }

    private static class Loan {
        public static Loan of(Book book, Member member) { return new Loan(); }
    }

    private static class LoanResult {
        public static LoanResult success(Loan loan) { return new LoanResult(); }
    }

    private static class BookRepository {
        public Optional<Book> findById(String id) { return Optional.empty(); }
        public Book save(Book book) { return book; }
    }

    private static class MemberRepository {
        public Optional<Member> findById(String id) { return Optional.empty(); }
    }

    private static class LoanRepository {
        public int countActiveLoansByMember(String memberId) { return 0; }
        public Loan save(Loan loan) { return loan; }
    }

    private static class NotificationService {
        public void sendBorrowConfirmation(Member member, Book book, Loan loan) {}
    }

    private static class BookNotFoundException extends RuntimeException {
        public BookNotFoundException(String id) { super("Book not found: " + id); }
    }

    private static class BookAlreadyBorrowedException extends RuntimeException {
        public BookAlreadyBorrowedException(String id) { super("Book already borrowed: " + id); }
    }

    private static class MemberNotFoundException extends RuntimeException {
        public MemberNotFoundException(String id) { super("Member not found: " + id); }
    }

    private static class BorrowLimitExceededException extends RuntimeException {
        public BorrowLimitExceededException(String id) { super("Borrow limit exceeded: " + id); }
    }
}
