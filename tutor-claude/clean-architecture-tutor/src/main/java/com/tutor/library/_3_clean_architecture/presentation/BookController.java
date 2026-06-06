package com.tutor.library._3_clean_architecture.presentation;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import com.tutor.library._3_clean_architecture.domain.port.in.BorrowBookUseCase;
import com.tutor.library._3_clean_architecture.domain.port.in.GetBooksUseCase;
import com.tutor.library._3_clean_architecture.domain.port.in.RegisterBookUseCase;
import com.tutor.library._3_clean_architecture.presentation.dto.BookResponse;
import com.tutor.library._3_clean_architecture.presentation.dto.BorrowBookRequest;
import com.tutor.library._3_clean_architecture.presentation.dto.RegisterBookRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 표현 계층 - Controller (Incoming Adapter)
 * ============================================================
 *
 * 컨트롤러의 유일한 책임:
 * 1. HTTP 요청을 유스케이스 커맨드로 변환
 * 2. 유스케이스 호출
 * 3. 결과를 HTTP 응답으로 변환
 *
 * 컨트롤러가 하면 안 되는 것:
 * - 비즈니스 로직 처리 (그건 서비스/도메인 모델의 일)
 * - DB 직접 접근 (그건 인프라의 일)
 *
 * 주목: 컨트롤러는 구체 클래스(RegisterBookService 등)가 아닌
 * 인터페이스(RegisterBookUseCase 등)에만 의존한다!
 * -> DIP (의존성 역전 원칙) 준수
 * -> 테스트 시 Mock UseCase를 주입해서 컨트롤러만 독립적으로 테스트 가능
 *
 * 1단계의 BadBookController와 비교해보세요:
 * - Bad: 컨트롤러가 DB 접근 + 비즈니스 로직 + HTTP 응답을 모두 처리
 * - Good: 컨트롤러는 HTTP 변환만, 비즈니스는 서비스가, DB는 인프라가
 */
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final RegisterBookUseCase registerBookUseCase;
    private final BorrowBookUseCase borrowBookUseCase;
    private final GetBooksUseCase getBooksUseCase;

    // 생성자 주입: 인터페이스에 의존 (구체 클래스를 모름)
    public BookController(RegisterBookUseCase registerBookUseCase,
                          BorrowBookUseCase borrowBookUseCase,
                          GetBooksUseCase getBooksUseCase) {
        this.registerBookUseCase = registerBookUseCase;
        this.borrowBookUseCase = borrowBookUseCase;
        this.getBooksUseCase = getBooksUseCase;
    }

    /**
     * 책 등록 API
     * POST /api/books
     */
    @PostMapping
    public ResponseEntity<BookResponse> registerBook(@Valid @RequestBody RegisterBookRequest request) {
        // 1. DTO -> Command 변환
        // 2. 유스케이스 호출
        // 3. 결과 -> DTO 변환
        Book book = registerBookUseCase.registerBook(request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(BookResponse.from(book));
    }

    /**
     * 전체 책 목록 조회 API
     * GET /api/books
     */
    @GetMapping
    public ResponseEntity<List<BookResponse>> getAllBooks() {
        List<BookResponse> books = getBooksUseCase.getAllBooks()
                .stream()
                .map(BookResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(books);
    }

    /**
     * 특정 책 조회 API
     * GET /api/books/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getBook(@PathVariable Long id) {
        return getBooksUseCase.getBookById(id)
                .map(BookResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 책 대출 API
     * POST /api/books/borrow
     */
    @PostMapping("/borrow")
    public ResponseEntity<BookResponse> borrowBook(@Valid @RequestBody BorrowBookRequest request) {
        Book book = borrowBookUseCase.borrowBook(request.toCommand());
        return ResponseEntity.ok(BookResponse.from(book));
    }
}
