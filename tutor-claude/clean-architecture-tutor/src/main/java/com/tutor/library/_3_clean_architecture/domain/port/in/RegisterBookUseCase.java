package com.tutor.library._3_clean_architecture.domain.port.in;

import com.tutor.library._3_clean_architecture.domain.model.Book;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 인커밍 포트 (Input Port / Use Case)
 * ============================================================
 *
 * 포트(Port)란?
 * - 도메인이 외부 세계와 소통하기 위한 "창구" (인터페이스)
 * - 인커밍 포트(Incoming Port): 외부 -> 도메인으로 들어오는 창구
 * - 아웃고잉 포트(Outgoing Port): 도메인 -> 외부로 나가는 창구
 *
 * 헥사고날 아키텍처(Hexagonal Architecture)라고도 불리는 이유:
 * - 도메인이 중심에 있고, 여러 방향(port)으로 외부와 연결됨
 * - 각 포트는 어댑터(Adapter)를 통해 실제 구현과 연결됨
 *
 * UseCase 인터페이스의 장점:
 * - 이 인터페이스만 보면 시스템이 무엇을 할 수 있는지 알 수 있음
 * - 컨트롤러는 이 인터페이스에만 의존 (실제 구현 모름)
 * - 테스트 시 Mock으로 쉽게 대체 가능
 */
public interface RegisterBookUseCase {

    /**
     * 새 책을 도서관에 등록한다.
     *
     * 이 인터페이스를 보는 것만으로도:
     * - 어떤 입력이 필요한지 (RegisterBookCommand)
     * - 어떤 결과가 반환되는지 (Book)
     * - 어떤 예외가 발생할 수 있는지
     * 를 알 수 있다.
     */
    Book registerBook(RegisterBookCommand command);

    /**
     * 커맨드 객체 (Value Object)
     * - 유스케이스 실행에 필요한 입력값을 묶는다
     * - 불변(Immutable) 객체로 만드는 것이 원칙
     * - 생성 시점에 유효성 검사 수행
     */
    record RegisterBookCommand(
            String title,
            String author,
            String isbn
    ) {
        public RegisterBookCommand {
            if (title == null || title.isBlank()) {
                throw new IllegalArgumentException("책 제목은 필수입니다.");
            }
            if (author == null || author.isBlank()) {
                throw new IllegalArgumentException("저자는 필수입니다.");
            }
            if (isbn == null || isbn.isBlank()) {
                throw new IllegalArgumentException("ISBN은 필수입니다.");
            }
        }
    }
}
