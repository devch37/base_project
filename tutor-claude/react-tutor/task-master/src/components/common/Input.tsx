/**
 * ============================================
 * Input 컴포넌트
 * ============================================
 *
 * 재사용 가능한 입력 필드 컴포넌트입니다.
 *
 * 학습 포인트:
 * 1. Controlled vs Uncontrolled Components
 * 2. React Hook Form 통합
 * 3. 에러 상태 처리
 * 4. Label과 연결
 */

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/helpers';

// ============================================
// 타입 정의
// ============================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 레이블 텍스트 */
  label?: string;
  /** 에러 메시지 */
  error?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 전체 너비 */
  fullWidth?: boolean;
  /** 왼쪽 아이콘/요소 */
  leftElement?: React.ReactNode;
  /** 오른쪽 아이콘/요소 */
  rightElement?: React.ReactNode;
}

// ============================================
// 컴포넌트
// ============================================

/**
 * Input 컴포넌트
 *
 * React Hook Form과 함께 사용할 수 있도록 forwardRef를 사용합니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <Input
 *   label="이메일"
 *   type="email"
 *   placeholder="email@example.com"
 * />
 *
 * // 에러 상태
 * <Input
 *   label="비밀번호"
 *   type="password"
 *   error="비밀번호는 8자 이상이어야 합니다"
 * />
 *
 * // React Hook Form과 함께
 * <Input
 *   label="이름"
 *   {...register('name', { required: true })}
 *   error={errors.name?.message}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      leftElement,
      rightElement,
      className,
      id,
      ...rest
    },
    ref
  ) => {
    // ID 생성 (label과 input을 연결하기 위해)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    // ========================================
    // 스타일
    // ========================================

    const containerClassName = cn(fullWidth && 'w-full');

    const inputWrapperClassName = cn('relative', fullWidth && 'w-full');

    const inputClassName = cn(
      // 기본 스타일
      'w-full px-3 py-2 border rounded-md',
      'text-gray-900 placeholder-gray-400',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2',

      // 에러 상태
      hasError
        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',

      // Disabled 상태
      'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',

      // 아이콘이 있을 때 패딩 조정
      leftElement ? 'pl-10' : '',
      rightElement ? 'pr-10' : '',

      className
    );

    const labelClassName = cn(
      'block text-sm font-medium text-gray-700 mb-1',
      rest.required && "after:content-['*'] after:ml-0.5 after:text-red-500"
    );

    const helperTextClassName = cn(
      'mt-1 text-sm',
      hasError ? 'text-red-600' : 'text-gray-500'
    );

    // ========================================
    // 렌더링
    // ========================================

    return (
      <div className={containerClassName}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelClassName}>
            {label}
          </label>
        )}

        {/* Input Wrapper */}
        <div className={inputWrapperClassName}>
          {/* 왼쪽 요소 */}
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftElement}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={inputClassName}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...rest}
          />

          {/* 오른쪽 요소 */}
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightElement}
            </div>
          )}
        </div>

        {/* 에러 또는 도움말 텍스트 */}
        {(error || helperText) && (
          <p
            id={hasError ? `${inputId}-error` : `${inputId}-helper`}
            className={helperTextClassName}
            role={hasError ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * 학습 노트:
 *
 * 1. Controlled Component
 *    - value와 onChange로 React가 상태 제어
 *    - Form 라이브러리와 통합 용이
 *
 * 2. forwardRef
 *    - React Hook Form의 register와 함께 사용
 *    - DOM 요소에 직접 접근 가능
 *
 * 3. 접근성 (a11y)
 *    - label과 input을 htmlFor/id로 연결
 *    - aria-invalid로 에러 상태 표시
 *    - aria-describedby로 도움말/에러 연결
 *    - role="alert"로 에러를 스크린 리더에 알림
 *
 * 4. 에러 처리
 *    - error prop으로 에러 메시지 전달
 *    - 시각적 피드백 (빨간 테두리)
 *    - 의미있는 에러 메시지 표시
 *
 * 5. 조건부 스타일링
 *    - hasError에 따라 다른 스타일
 *    - leftElement/rightElement에 따라 padding 조정
 *
 * 6. ID 생성
 *    - 고유한 ID 자동 생성
 *    - label과 input 연결
 *
 * 7. React Hook Form 통합
 *    ```tsx
 *    const { register, formState: { errors } } = useForm();
 *
 *    <Input
 *      {...register('email', {
 *        required: '이메일을 입력하세요',
 *        pattern: {
 *          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
 *          message: '유효한 이메일 주소를 입력하세요'
 *        }
 *      })}
 *      error={errors.email?.message}
 *    />
 *    ```
 */
