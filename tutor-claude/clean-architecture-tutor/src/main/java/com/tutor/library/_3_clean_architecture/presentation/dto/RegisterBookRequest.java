package com.tutor.library._3_clean_architecture.presentation.dto;

import com.tutor.library._3_clean_architecture.domain.port.in.RegisterBookUseCase;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * ============================================================
 * [3단계 - 클린 아키텍처] 표현 계층 - Request DTO
 * ============================================================
 *
 * DTO(Data Transfer Object)를 도메인 모델과 분리하는 이유:
 *
 * 1. API 요청/응답 형식은 자주 바뀔 수 있다
 *    (필드 추가, 이름 변경, 형식 변경)
 * 2. 도메인 모델에 @JsonProperty, @NotBlank 같은 웹 관련 애너테이션을
 *    붙이면 도메인이 웹 기술에 의존하게 됨
 * 3. 외부에 노출하면 안 되는 필드를 숨길 수 있다
 *
 * 핵심: DTO는 "외부 세계와 소통하기 위한 데이터 형식"
 *       도메인 모델은 "비즈니스 로직을 담는 핵심 객체"
 */
public record RegisterBookRequest(
        @NotBlank(message = "책 제목은 필수입니다.")
        String title,

        @NotBlank(message = "저자는 필수입니다.")
        String author,

        @NotBlank(message = "ISBN은 필수입니다.")
        @Pattern(regexp = "^[0-9-]{10,17}$", message = "올바른 ISBN 형식이 아닙니다.")
        String isbn
) {
    /**
     * DTO -> UseCase Command 변환
     * 컨트롤러의 책임: HTTP 요청을 유스케이스가 이해하는 형태로 변환
     */
    public RegisterBookUseCase.RegisterBookCommand toCommand() {
        return new RegisterBookUseCase.RegisterBookCommand(title, author, isbn);
    }
}
