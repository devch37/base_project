package com.tutor.library._3_clean_architecture.domain.service;

import com.tutor.library._3_clean_architecture.domain.model.Book;
import com.tutor.library._3_clean_architecture.domain.port.in.RegisterBookUseCase;
import com.tutor.library._3_clean_architecture.domain.port.out.BookRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 도메인 서비스 (Application Service)
 * ============================================================
 *
 * 도메인 서비스가 하는 일:
 * 1. 인커밍 포트(UseCase)를 구현 -> 컨트롤러에서 호출됨
 * 2. 도메인 모델의 비즈니스 메서드를 조율
 * 3. 아웃고잉 포트(Repository)를 통해 저장/조회
 *
 * 클린 아키텍처에서의 규칙:
 * - 도메인 서비스는 도메인 모델과 포트에만 의존
 * - HTTP, DB, 외부 API 등 기술적 구현을 직접 알지 못함
 * - @Service 애너테이션은 Spring 기술이지만, 도메인 서비스에 있어도 OK
 *   (프레임워크 기동에 필요한 최소한의 의존성은 허용)
 *
 * 테스트 관점:
 * - 이 클래스를 테스트할 때 BookRepositoryPort를 Mock으로 대체 가능
 * - 실제 DB 없이도 빠른 단위 테스트 작성 가능
 */
@Service
@Transactional
public class RegisterBookService implements RegisterBookUseCase {

    private final BookRepositoryPort bookRepositoryPort;

    // 생성자 주입 (Constructor Injection) - 불변성 보장, 테스트 용이
    public RegisterBookService(BookRepositoryPort bookRepositoryPort) {
        this.bookRepositoryPort = bookRepositoryPort;
    }

    @Override
    public Book registerBook(RegisterBookCommand command) {
        // 1. 중복 ISBN 확인 (비즈니스 규칙)
        if (bookRepositoryPort.existsByIsbn(command.isbn())) {
            throw new IllegalArgumentException(
                    "이미 등록된 ISBN입니다: " + command.isbn()
            );
        }

        // 2. 도메인 객체 생성 (비즈니스 규칙은 Book 클래스 내부에 있음)
        Book book = Book.createNew(command.title(), command.author(), command.isbn());

        // 3. 저장 (어떻게 저장하는지는 모름 - 포트에 위임)
        return bookRepositoryPort.save(book);

        // 이게 전부다! 깔끔하고 명확하다.
        // 서비스는 "흐름을 조율"하는 역할만 한다.
        // 비즈니스 규칙은 도메인 모델에, 저장 방법은 인프라에 있다.
    }
}
