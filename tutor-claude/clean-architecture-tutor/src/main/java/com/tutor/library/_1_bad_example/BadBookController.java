package com.tutor.library._1_bad_example;

import jakarta.persistence.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================
 * [1단계] 나쁜 코드 예시 - Bad Example
 * ============================================================
 *
 * 이 클래스는 실제 현업에서 자주 발견되는 "나쁜 코드"의 전형적인 패턴입니다.
 * 아래 코드가 왜 문제인지 주석을 통해 설명합니다.
 *
 * 문제점 목록:
 * 1. 컨트롤러가 DB 접근, 비즈니스 로직, HTTP 응답을 모두 처리 (역할 분리 없음)
 * 2. 의미 없는 변수명 (a, b, c, d, tmp, data...)
 * 3. 하나의 메서드가 너무 많은 일을 함 (100줄짜리 메서드)
 * 4. 중복 코드가 여기저기 흩어져 있음
 * 5. 매직 넘버/문자열이 코드에 직접 박혀 있음
 * 6. 에러 처리가 없거나 무분별한 try-catch
 * 7. 테스트하기 불가능한 구조
 *
 * 아래 코드를 읽으면서 "이게 왜 문제야?"를 느껴보세요.
 * 그리고 나중에 클린 코드 버전과 비교해보세요.
 */
@RestController
@RequestMapping("/bad")
public class BadBookController {

    // 문제 1: DB 연결을 컨트롤러에서 직접 관리
    // 이렇게 하면 테스트할 때 실제 DB가 없으면 아무것도 테스트 못함
    private Connection conn;

    // 문제 2: 의미 없는 변수명
    // 'list', 'map' 이 뭘 담는지 이름만 봐서는 모름
    private List<Map<String, Object>> list = new ArrayList<>();
    private static int cnt = 0;  // cnt가 뭘 세는 건지?

    /**
     * 문제 3: 메서드 이름이 동사+명사 구조가 아님
     * "book"이 뭘 하는 메서드인지 이름만 봐서는 모름
     * 등록? 조회? 수정? 삭제?
     */
    @PostMapping("/book")
    public ResponseEntity book(@RequestBody Map<String, Object> data) {
        // 문제 4: 매직 넘버 - 숫자 30이 뭘 의미하는지 모름
        // 책 제목 길이 제한? 회원 ID 제한? 다른 의미?
        if (((String) data.get("t")).length() > 30) {
            return ResponseEntity.badRequest().body("err");  // "err"이 뭔 에러인지?
        }

        // 문제 5: 비즈니스 로직이 컨트롤러에 섞임
        // 책 상태를 "1"로 설정 - 1이 뭘 의미하는지 숫자만 봐서는 모름
        // 나중에 "1"이 뭔지 알려면 코드 전체를 다 읽어야 함
        data.put("s", "1");
        data.put("dt", LocalDateTime.now().toString());

        // 문제 6: 중복 코드 - 아래에도 똑같이 cnt++, list.add() 하는 코드가 있음
        cnt++;
        data.put("id", cnt);
        list.add(data);

        // 문제 7: 직접 DB에 SQL 쿼리 - SQL Injection 취약점!
        // 사용자 입력값을 그대로 쿼리에 넣으면 해킹당할 수 있음
        try {
            if (conn != null) {
                String sql = "INSERT INTO book VALUES ('" + data.get("t") + "', '" + data.get("a") + "')";
                conn.createStatement().execute(sql);  // SQL Injection 위험!
            }
        } catch (Exception e) {
            // 문제 8: 에러를 그냥 삼킴 - 무슨 에러가 났는지 아무도 모름
            // 나중에 버그 찾을 때 원인을 절대 못 찾음
        }

        return ResponseEntity.ok("ok");  // "ok"가 뭘 의미하는지?
    }

    /**
     * 문제 9: 비슷한 로직이 중복으로 존재
     * book() 메서드와 90% 비슷한데 조금 다름
     * 나중에 로직 수정할 때 두 곳을 모두 수정해야 함 -> 하나 빠뜨리면 버그 발생!
     */
    @PostMapping("/book2")
    public ResponseEntity book2(@RequestBody Map<String, Object> d) {
        // book()과 거의 똑같은 코드... (복붙했음)
        if (((String) d.get("t")).length() > 30) {
            return ResponseEntity.badRequest().body("err");
        }

        d.put("s", "1");
        d.put("dt", LocalDateTime.now().toString());

        // book()과 다른 점: cnt가 아니라 다른 방식으로 ID 생성
        // 근데 이게 의도적인 차이인지 실수인지 모름
        d.put("id", UUID.randomUUID().toString());
        list.add(d);

        return ResponseEntity.ok("ok");
    }

    /**
     * 문제 10: 100줄짜리 거대한 메서드 - "God Method"
     * 한 메서드가 책 조회 + 대출 처리 + 알림 발송 + 로깅을 모두 함
     * 메서드가 길수록 이해하기 어렵고, 테스트하기도 어려움
     */
    @PostMapping("/borrow")
    public ResponseEntity processAllStuff(@RequestBody Map<String, Object> req) {

        // ---- 여기서부터 책 유효성 검사 ----
        String bookId = (String) req.get("bid");
        String memberId = (String) req.get("mid");

        if (bookId == null || bookId.isEmpty()) {
            return ResponseEntity.badRequest().body("no book id");
        }
        if (memberId == null || memberId.isEmpty()) {
            return ResponseEntity.badRequest().body("no member id");
        }

        // ---- 여기서부터 책 조회 로직 ----
        Map<String, Object> foundBook = null;
        for (Map<String, Object> b : list) {
            if (bookId.equals(b.get("id").toString())) {
                foundBook = b;
                break;
            }
        }

        if (foundBook == null) {
            return ResponseEntity.notFound().build();
        }

        // 문제 11: 매직 문자열 - "1", "2" 가 뭘 의미하는지?
        // 코드를 처음 보는 사람은 절대 모름
        // 근데 이게 코드 여기저기 흩어져 있으면... 유지보수 지옥
        if (!"1".equals(foundBook.get("s"))) {
            return ResponseEntity.badRequest().body("already borrowed");
        }

        // ---- 여기서부터 대출 처리 로직 ----
        foundBook.put("s", "2");  // 2가 뭔지? 대출중? 반납됨? 분실?
        foundBook.put("borrower", memberId);
        foundBook.put("borrowDate", LocalDateTime.now());

        // ---- 여기서부터 회원 대출 한도 체크 ----
        // 문제 12: 매직 넘버 5 - 왜 5권인지 설명 없음
        // 나중에 한도가 3권으로 바뀌면? 코드 전체 검색해서 5를 다 바꿔야 함
        int borrowCount = 0;
        for (Map<String, Object> b : list) {
            if (memberId.equals(b.get("borrower"))) {
                borrowCount++;
            }
        }
        if (borrowCount >= 5) {
            return ResponseEntity.badRequest().body("limit exceeded");
        }

        // ---- 여기서부터 알림 발송 ----
        // 문제 13: 알림 발송 로직이 대출 로직과 섞임
        // 나중에 "알림만 수정"하고 싶어도 이 거대한 메서드를 건드려야 함
        try {
            System.out.println("SMS 발송: " + memberId + "님이 " + foundBook.get("t") + "를 빌렸습니다.");
            // 실제로는 외부 SMS API 호출...
        } catch (Exception e) {
            // 또 에러 무시...
        }

        // ---- 여기서부터 로깅 ----
        // 문제 14: 로깅도 비즈니스 로직과 섞임
        System.out.println("[LOG] " + LocalDateTime.now() + " BORROW bookId=" + bookId + " memberId=" + memberId);

        // ---- 여기서부터 응답 조립 ----
        // 문제 15: 응답 구조가 일관성 없음
        // 어떤 API는 문자열 반환, 어떤 API는 Map 반환, 어떤 API는 객체 반환
        Map<String, Object> response = new HashMap<>();
        response.put("result", "success");
        response.put("bookTitle", foundBook.get("t"));  // "t"가 title인지 type인지?
        response.put("borrowDate", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    // 문제 16: 쓰이지 않는 메서드들이 여기저기
    // 언제 만들었는지, 지워도 되는지 아무도 모름
    private void doSomething(String a, String b, int c, boolean d) {
        // TODO: 나중에 구현...
    }

    private Map calculateStuff(List items) {
        return new HashMap();  // 아무것도 안 함
    }
}
