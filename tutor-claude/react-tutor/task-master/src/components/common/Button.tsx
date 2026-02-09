/**
 * ============================================
 * Button 컴포넌트
 * ============================================
 *
 * 재사용 가능한 버튼 컴포넌트입니다.
 *
 * 학습 포인트:
 * 1. Props 타입 정의
 * 2. 기본 HTML 속성 확장
 * 3. 조건부 스타일링
 * 4. forwardRef 사용
 * 5. 접근성 (a11y)
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/helpers';

// ============================================
// 타입 정의
// ============================================

/**
 * 버튼 Variant (모양 변형)
 */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

/**
 * 버튼 크기
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button Props 인터페이스
 *
 * ButtonHTMLAttributes<HTMLButtonElement>를 확장하여
 * 기본 버튼 속성(onClick, disabled 등)을 모두 사용할 수 있습니다.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 변형 */
  variant?: ButtonVariant;
  /** 버튼 크기 */
  size?: ButtonSize;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 전체 너비 */
  fullWidth?: boolean;
  /** 왼쪽 아이콘 */
  leftIcon?: React.ReactNode;
  /** 오른쪽 아이콘 */
  rightIcon?: React.ReactNode;
}

// ============================================
// 스타일 맵
// ============================================

/**
 * Variant별 스타일
 *
 * Tailwind CSS 클래스를 사용한 스타일 정의
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ' +
    'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  secondary:
    'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 ' +
    'focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
    'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 ' +
    'focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
  link:
    'bg-transparent text-blue-600 hover:text-blue-700 hover:underline ' +
    'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
};

/**
 * Size별 스타일
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

// ============================================
// 컴포넌트
// ============================================

/**
 * Button 컴포넌트
 *
 * forwardRef를 사용하여 ref를 전달받을 수 있게 합니다.
 * 이는 부모 컴포넌트에서 버튼 DOM에 직접 접근이 필요할 때 유용합니다.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   클릭하세요
 * </Button>
 *
 * <Button variant="danger" isLoading>
 *   로딩 중...
 * </Button>
 *
 * <Button
 *   variant="primary"
 *   leftIcon={<PlusIcon />}
 *   onClick={handleAdd}
 * >
 *   추가
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    // ========================================
    // 스타일 계산
    // ========================================

    const baseStyles =
      'inline-flex items-center justify-center gap-2 ' +
      'font-medium rounded-md transition-colors ' +
      'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const computedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className
    );

    // ========================================
    // 렌더링
    // ========================================

    return (
      <button
        ref={ref}
        type={type}
        className={computedClassName}
        disabled={disabled || isLoading}
        {...rest}
      >
        {/* 로딩 스피너 */}
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* 왼쪽 아이콘 */}
        {!isLoading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}

        {/* 버튼 텍스트 */}
        <span>{children}</span>

        {/* 오른쪽 아이콘 */}
        {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

// displayName 설정 (React DevTools에서 표시됨)
Button.displayName = 'Button';

/**
 * 학습 노트:
 *
 * 1. Props 타입 정의
 *    - interface로 명확한 타입 정의
 *    - ButtonHTMLAttributes 확장으로 기본 속성 지원
 *    - JSDoc 주석으로 IDE 지원
 *
 * 2. forwardRef
 *    - ref를 자식 컴포넌트로 전달
 *    - DOM 요소에 직접 접근 가능
 *    - 폼 라이브러리와 통합 시 필수
 *
 * 3. 기본값 설정
 *    - Props destructuring에서 기본값 지정
 *    - variant = 'primary'
 *
 * 4. Rest/Spread 연산자
 *    - {...rest}로 나머지 props 전달
 *    - onClick, onBlur 등 모든 이벤트 지원
 *
 * 5. 조건부 렌더링
 *    - {isLoading && <Spinner />}
 *    - {leftIcon && <Icon />}
 *
 * 6. 조건부 스타일링
 *    - cn() 유틸리티로 클래스 조합
 *    - fullWidth && 'w-full'
 *
 * 7. 접근성 (a11y)
 *    - aria-hidden="true" for decorative icons
 *    - disabled 상태 명확히 표시
 *    - focus:ring으로 키보드 네비게이션 지원
 *
 * 8. TypeScript Benefits
 *    - 자동 완성
 *    - 잘못된 props 사용 시 컴파일 에러
 *    - 타입 안전성
 *
 * 9. Tailwind CSS
 *    - 유틸리티 클래스로 빠른 스타일링
 *    - 일관된 디자인 시스템
 *    - 반응형 디자인 쉽게 구현
 *
 * 10. 컴포넌트 재사용
 *     - variant, size로 다양한 변형
 *     - 일관된 UI 유지
 *     - 중앙화된 스타일 관리
 */
