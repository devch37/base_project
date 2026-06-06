package com.tutor.library._2_clean_code.naming;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ============================================================
 * [2단계 - 클린 코드 원칙 1] 좋은 네이밍 예시
 * ============================================================
 *
 * 좋은 이름의 조건:
 * 1. 의도를 분명하게 밝혀라 (Reveal intention)
 * 2. 발음할 수 있는 이름을 사용하라
 * 3. 검색할 수 있는 이름을 사용하라
 * 4. 인코딩을 피하라 (타입 정보를 이름에 넣지 말 것)
 * 5. 의미 있는 맥락을 추가하라
 */
public class GoodNamingExample {

    // 좋은 예: 이름만 봐도 무엇을 의미하는지 알 수 있음
    private int elapsedDaysAfterLastModification;
    private String bookTitle;
    private List<Book> borrowedBooks;

    // 좋은 예: 타입 접두사 없이 의미 있는 이름
    private String memberName;
    private int borrowCount;
    private boolean isEmailVerified;

    // 좋은 예: 발음 가능한 이름
    private LocalDateTime creationDateTime;  // genymdhms -> creationDateTime
    private String customerId;               // cstmrId -> customerId
    private int remainingStock;              // hp -> remainingStock (도메인에 맞는 이름)

    // 좋은 예: 검색 가능한 이름 + 의미 있는 파라미터명
    // BORROW_LIMIT은 상수로 추출해서 어디서든 검색 가능
    private static final int BORROW_LIMIT = 5;
    private static final int MAX_TITLE_LENGTH = 30;

    public void processBooks(List<Book> targetBooks, int maxCount) {
        for (int i = 0; i < maxCount; i++) {
            Book book = targetBooks.get(i);
            processBook(book);
        }
    }

    // 좋은 예: source, destination으로 역할 명확
    public void copyCharacters(char[] source, char[] destination) {
        for (int i = 0; i < source.length; i++) {
            destination[i] = source[i];
        }
    }

    // 좋은 예: 각 파라미터가 명확하게 구분됨
    public void mergeBookData(Book originalBook, Book updatedBook) {
        // originalBook과 updatedBook이 각각 뭔지 명확
    }

    // 좋은 예: 불린 변수는 긍정형으로
    private boolean isNotificationEnabled;  // isNotEnabled -> isNotificationEnabled
    private boolean isDeleted;              // wasNotDeleted -> isDeleted

    // 좋은 예: 동사+명사 구조의 메서드 이름
    public Book findBookById(Long bookId) {
        return null;
    }

    // 좋은 예: 적당히 간결하면서도 의미 있는 이름
    public void registerBook(BookRegistrationRequest request) {
        // ...
    }

    // ============================================================
    // 실제 코드 예시: 나쁜 코드 vs 좋은 코드 비교
    // ============================================================

    // 나쁜 버전: 이 코드가 뭘 하는지 한눈에 파악 불가
    public List<int[]> badVersion() {
        List<int[]> list1 = new java.util.ArrayList<>();
        int[][] theList = {{1, 1}, {2, 0}, {3, 5}};

        for (int[] x : theList) {
            if (x[0] == 4) {
                list1.add(x);
            }
        }
        return list1;
    }

    // 좋은 버전: 게임 보드에서 깃발 꽂힌 칸을 반환한다는 것이 명확
    private static final int STATUS_INDEX = 0;
    private static final int FLAGGED = 4;

    public List<int[]> getFlaggedCells() {
        List<int[]> flaggedCells = new java.util.ArrayList<>();
        int[][] gameBoard = {{1, 1}, {2, 0}, {3, 5}};

        for (int[] cell : gameBoard) {
            if (cell[STATUS_INDEX] == FLAGGED) {
                flaggedCells.add(cell);
            }
        }
        return flaggedCells;
    }

    // 내부에서만 쓰는 더미 클래스들
    private static class Book {}
    private static class BookRegistrationRequest {}

    private void processBook(Book book) {}
}
