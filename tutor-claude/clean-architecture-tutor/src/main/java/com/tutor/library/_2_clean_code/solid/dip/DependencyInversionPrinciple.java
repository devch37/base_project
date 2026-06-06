package com.tutor.library._2_clean_code.solid.dip;

/**
 * ============================================================
 * [2단계 - SOLID 원칙 3] 의존성 역전 원칙 (DIP)
 * Dependency Inversion Principle
 * ============================================================
 *
 * "고수준 모듈은 저수준 모듈에 의존해서는 안 된다.
 *  둘 다 추상화에 의존해야 한다."
 * - Robert C. Martin
 *
 * 더 쉽게 말하면:
 * "구체적인 구현체가 아닌, 인터페이스(추상화)에 의존하라."
 *
 * 이것이 클린 아키텍처의 핵심 원칙이다!
 *
 * 왜 중요한가?
 * - MySQL을 PostgreSQL로 바꿔도 비즈니스 로직 코드를 수정하지 않아도 됨
 * - 테스트 시 실제 DB 대신 Mock 객체를 사용할 수 있음
 * - 의존성이 한 방향으로만 흐름 (도메인 -> 추상화 <- 인프라)
 */
public class DependencyInversionPrinciple {

    // ============================================================
    // 나쁜 예: 고수준 모듈이 저수준 모듈에 직접 의존
    // ============================================================

    /**
     * 나쁜 예: MySQL 구현체에 직접 의존
     *
     * 문제 상황:
     * - DB를 PostgreSQL로 바꾸려면 BookService 코드를 수정해야 함
     * - 단위 테스트 시 실제 MySQL 서버가 필요 (느리고 불안정)
     * - BookService와 MySqlBookRepository가 강하게 결합됨
     */
    static class MySqlBookRepository {
        public void save(String bookId, String title) {
            System.out.println("MySQL에 저장: " + bookId + " - " + title);
        }

        public String findById(String bookId) {
            System.out.println("MySQL에서 조회: " + bookId);
            return "book title";
        }
    }

    // 고수준 모듈(비즈니스 로직)이 저수준 모듈(MySQL)에 직접 의존 -> DIP 위반!
    static class BadBookService {
        // new MySqlBookRepository() -> 구체 클래스에 직접 의존!
        private final MySqlBookRepository repository = new MySqlBookRepository();

        public void registerBook(String bookId, String title) {
            // 유효성 검사 (비즈니스 로직)
            if (title == null || title.isBlank()) {
                throw new IllegalArgumentException("제목은 필수입니다.");
            }
            // MySQL에 직접 저장
            repository.save(bookId, title);
        }
    }
    // BadBookService를 테스트하려면? -> 반드시 MySQL이 있어야 함!
    // DB를 PostgreSQL로 바꾸려면? -> BadBookService 코드를 수정해야 함!

    // ============================================================
    // 좋은 예: 추상화(인터페이스)에 의존
    // ============================================================

    /**
     * 좋은 예 1: 추상화 (인터페이스) 정의
     * BookService가 의존할 "계약서"
     * 구체적인 구현이 어떤 DB를 쓰는지 BookService는 알 필요 없음
     */
    interface BookRepository {
        void save(String bookId, String title);
        String findById(String bookId);
    }

    /**
     * 좋은 예 2: MySQL 구현체 (저수준 모듈)
     * 인터페이스를 구현
     */
    static class MySqlBookRepositoryImpl implements BookRepository {
        @Override
        public void save(String bookId, String title) {
            System.out.println("MySQL에 저장: " + bookId + " - " + title);
        }

        @Override
        public String findById(String bookId) {
            System.out.println("MySQL에서 조회: " + bookId);
            return "book title";
        }
    }

    /**
     * 좋은 예 3: PostgreSQL 구현체 (저수준 모듈)
     * DB가 바뀌어도 BookService는 전혀 수정하지 않아도 됨!
     */
    static class PostgreSqlBookRepositoryImpl implements BookRepository {
        @Override
        public void save(String bookId, String title) {
            System.out.println("PostgreSQL에 저장: " + bookId + " - " + title);
        }

        @Override
        public String findById(String bookId) {
            System.out.println("PostgreSQL에서 조회: " + bookId);
            return "book title";
        }
    }

    /**
     * 좋은 예 4: 테스트용 가짜 구현체 (Mock)
     * 테스트 시 실제 DB 없이도 사용 가능!
     */
    static class InMemoryBookRepository implements BookRepository {
        private final java.util.Map<String, String> store = new java.util.HashMap<>();

        @Override
        public void save(String bookId, String title) {
            store.put(bookId, title);
        }

        @Override
        public String findById(String bookId) {
            return store.get(bookId);
        }
    }

    /**
     * 좋은 예 5: BookService는 인터페이스에만 의존 (DIP 준수!)
     * 어떤 DB 구현체가 주입되는지 전혀 알 필요 없음
     */
    static class GoodBookService {
        // 구체 클래스(MySQL, PostgreSQL)가 아닌 인터페이스에 의존!
        private final BookRepository bookRepository;

        // 의존성을 외부에서 주입받음 (Dependency Injection)
        GoodBookService(BookRepository bookRepository) {
            this.bookRepository = bookRepository;
        }

        public void registerBook(String bookId, String title) {
            if (title == null || title.isBlank()) {
                throw new IllegalArgumentException("제목은 필수입니다.");
            }
            bookRepository.save(bookId, title);
            // MySQL인지 PostgreSQL인지 전혀 신경 쓰지 않음!
        }
    }

    // ============================================================
    // 실제 사용 예시
    // ============================================================

    public static void main(String[] args) {
        // 프로덕션: MySQL 사용
        BookRepository mysqlRepo = new MySqlBookRepositoryImpl();
        GoodBookService productionService = new GoodBookService(mysqlRepo);
        productionService.registerBook("B001", "클린 코드");

        // DB 마이그레이션: PostgreSQL로 교체 -> BookService 코드 수정 없음!
        BookRepository postgresRepo = new PostgreSqlBookRepositoryImpl();
        GoodBookService migratedService = new GoodBookService(postgresRepo);
        migratedService.registerBook("B002", "클린 아키텍처");

        // 테스트: 실제 DB 없이 인메모리로 테스트 -> 빠르고 안정적!
        BookRepository inMemoryRepo = new InMemoryBookRepository();
        GoodBookService testService = new GoodBookService(inMemoryRepo);
        testService.registerBook("B003", "리팩터링");

        System.out.println("조회: " + inMemoryRepo.findById("B003")); // 리팩터링

        // 핵심: GoodBookService 코드를 한 줄도 수정하지 않았다!
    }
}
