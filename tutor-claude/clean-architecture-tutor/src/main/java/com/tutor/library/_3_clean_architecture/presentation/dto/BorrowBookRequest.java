package com.tutor.library._3_clean_architecture.presentation.dto;

import com.tutor.library._3_clean_architecture.domain.port.in.BorrowBookUseCase;
import jakarta.validation.constraints.NotNull;

public record BorrowBookRequest(
        @NotNull(message = "책 ID는 필수입니다.")
        Long bookId,

        @NotNull(message = "회원 ID는 필수입니다.")
        Long memberId
) {
    public BorrowBookUseCase.BorrowBookCommand toCommand() {
        return new BorrowBookUseCase.BorrowBookCommand(bookId, memberId);
    }
}
