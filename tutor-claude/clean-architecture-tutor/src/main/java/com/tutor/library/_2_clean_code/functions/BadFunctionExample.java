package com.tutor.library._2_clean_code.functions;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================
 * [2단계 - 클린 코드 원칙 2] 나쁜 함수 설계 예시
 * ============================================================
 *
 * 나쁜 함수의 특징:
 * 1. 함수가 너무 길다 (50줄 이상)
 * 2. 함수가 한 가지 이상의 일을 한다
 * 3. 추상화 수준이 섞여 있다 (DB 접근 + 비즈니스 로직 + UI 로직)
 * 4. 중복 코드가 존재한다
 * 5. 플래그 인수 (boolean 파라미터로 분기)
 * 6. 출력 인수 (리턴 대신 파라미터를 수정)
 * 7. 부수 효과(Side Effect)가 있다
 */
public class BadFunctionExample {

    private Map<String, Map<String, Object>> bookDatabase = new HashMap<>();
    private Map<String, Map<String, Object>> memberDatabase = new HashMap<>();
    private List<Map<String, Object>> loanRecords = new ArrayList<>();

    /**
     * 나쁜 예 1: 너무 많은 일을 하는 함수 (God Function)
     * 이 함수가 하는 일:
     * - 입력값 유효성 검사
     * - 책 존재 여부 확인
     * - 회원 존재 여부 확인
     * - 대출 한도 확인
     * - 책 상태 변경
     * - 대출 기록 저장
     * - 알림 발송
     * - 로그 기록
     *
     * -> 하나의 함수가 8가지 일을 함!
     * -> 나중에 "대출 한도만 바꾸고 싶다"면 이 거대한 함수를 이해하고 수정해야 함
     */
    public Map<String, Object> processBookBorrow(String bookId, String memberId, boolean isFastTrack, int priority) {

        // ---- 입력값 유효성 검사 ----
        if (bookId == null || bookId.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Book ID is required");
            return error;
        }
        if (memberId == null || memberId.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Member ID is required");
            return error;
        }

        // ---- 책 조회 ----
        Map<String, Object> book = bookDatabase.get(bookId);
        if (book == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Book not found");
            return error;
        }

        // ---- 회원 조회 ----
        Map<String, Object> member = memberDatabase.get(memberId);
        if (member == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Member not found");
            return error;
        }

        // ---- 책 상태 확인 ----
        if (!"AVAILABLE".equals(book.get("status"))) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Book is not available");
            return error;
        }

        // ---- 대출 한도 확인 ----
        // 나쁜 예: isFastTrack 플래그로 분기 -> 이 함수를 두 개로 나눠야 함
        int borrowLimit;
        if (isFastTrack) {
            borrowLimit = 10;  // fast track 회원은 10권
        } else {
            borrowLimit = 5;   // 일반 회원은 5권
        }

        long currentBorrowCount = loanRecords.stream()
                .filter(r -> memberId.equals(r.get("memberId")) && "ACTIVE".equals(r.get("status")))
                .count();

        if (currentBorrowCount >= borrowLimit) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Borrow limit exceeded");
            return error;
        }

        // ---- 책 상태 변경 ----
        book.put("status", "BORROWED");
        book.put("borrowerId", memberId);
        book.put("borrowDate", LocalDateTime.now());

        // ---- 대출 기록 저장 ----
        Map<String, Object> loanRecord = new HashMap<>();
        loanRecord.put("bookId", bookId);
        loanRecord.put("memberId", memberId);
        loanRecord.put("borrowDate", LocalDateTime.now());
        loanRecord.put("dueDate", LocalDateTime.now().plusDays(14));
        loanRecord.put("status", "ACTIVE");
        loanRecords.add(loanRecord);

        // ---- 알림 발송 ----
        // 나쁜 예: 비즈니스 로직(대출)과 알림 발송이 섞임
        // 나중에 "SMS 대신 이메일로 바꾸고 싶다"면 이 함수를 수정해야 함
        String memberEmail = (String) member.get("email");
        String bookTitle = (String) book.get("title");
        System.out.println("Sending email to: " + memberEmail);
        System.out.println("Subject: 도서 대출 확인 - " + bookTitle);

        // ---- 로그 기록 ----
        System.out.println("[" + LocalDateTime.now() + "] BORROW_SUCCESS bookId=" + bookId + " memberId=" + memberId);

        // ---- 응답 조립 ----
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("bookTitle", bookTitle);
        result.put("dueDate", LocalDateTime.now().plusDays(14));
        result.put("message", "대출이 완료되었습니다.");
        return result;
    }

    /**
     * 나쁜 예 2: 플래그 인수 (Flag Argument)
     * boolean 파라미터로 함수 동작을 분기하는 것은 함수가
     * 두 가지 일을 하고 있다는 신호다.
     *
     * render(true)  -> HTML 렌더링
     * render(false) -> JSON 렌더링
     * 이 함수는 사실 renderHtml()과 renderJson() 두 개로 나눠야 한다.
     */
    public String render(boolean isHtml) {
        if (isHtml) {
            return "<html><body>책 목록</body></html>";
        } else {
            return "{\"books\": []}";
        }
    }

    /**
     * 나쁜 예 3: 출력 인수 (Output Argument)
     * 리턴값으로 결과를 반환하는 대신 파라미터를 수정하는 방식.
     * Java에서 이런 패턴은 코드 추적을 어렵게 만든다.
     *
     * appendFooter(s)를 호출하면 s에 내용이 추가된다.
     * -> 함수명만 봐서는 s가 수정되는지 알기 어렵다.
     */
    public void appendFooter(StringBuffer pageText) {
        pageText.append("--Footer--");
        // s.append(footer(s)); // 이게 맞는 건지 appendFooter(s) 가 맞는 건지?
    }

    /**
     * 나쁜 예 4: 부수 효과 (Side Effect)
     * 함수 이름은 "checkPassword"인데 실제로는 세션을 초기화한다.
     * 이름에서 드러나지 않는 숨겨진 동작 = 버그의 씨앗
     */
    public boolean checkPassword(String username, String password) {
        // ... 패스워드 검증 로직 ...
        if ("valid".equals(password)) {
            // 부수 효과: 비밀번호 확인 함수가 세션을 초기화?!
            // 이걸 로그아웃 상태에서 호출하면 큰일남
            System.out.println("Session initialized for: " + username);
            return true;
        }
        return false;
    }

    /**
     * 나쁜 예 5: 명령과 조회가 섞인 함수 (Command Query Separation 위반)
     * setAttribute는 값을 설정(Command)하고 동시에 기존 값 존재 여부를 반환(Query)한다.
     * -> 이 함수를 호출하는 쪽에서 혼란이 생김
     */
    private Map<String, String> attributes = new HashMap<>();

    public boolean setAttribute(String attribute, String value) {
        if (attributes.containsKey(attribute)) {
            return false;  // 이미 존재하면 설정 실패
        }
        attributes.put(attribute, value);
        return true;  // 설정 성공
    }

    // 호출하는 쪽:
    // if (setAttribute("userName", "bob")) { ... }
    // "userName"이 설정됐다는 건지, 원래 존재했다는 건지 헷갈림
}
