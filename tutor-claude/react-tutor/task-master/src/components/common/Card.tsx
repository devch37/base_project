/**
 * ============================================
 * Card 컴포넌트
 * ============================================
 *
 * 재사용 가능한 카드 컴포넌트입니다.
 *
 * 학습 포인트:
 * 1. Composition 패턴
 * 2. Compound Components
 * 3. children prop 활용
 */

import { HTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

// ============================================
// Card 타입
// ============================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 패딩 크기 */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 그림자 크기 */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  /** 호버 효과 */
  hoverable?: boolean;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

// ============================================
// 스타일 맵
// ============================================

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const shadowStyles = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

// ============================================
// Card 컴포넌트
// ============================================

/**
 * Card 메인 컴포넌트
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>
 *     <h2>제목</h2>
 *   </Card.Header>
 *   <Card.Body>
 *     내용...
 *   </Card.Body>
 *   <Card.Footer>
 *     <Button>확인</Button>
 *   </Card.Footer>
 * </Card>
 * ```
 */
function Card({
  children,
  padding = 'md',
  shadow = 'md',
  hoverable = false,
  className,
  ...rest
}: CardProps) {
  const cardClassName = cn(
    'bg-white rounded-lg border border-gray-200',
    paddingStyles[padding],
    shadowStyles[shadow],
    hoverable && 'hover:shadow-lg transition-shadow duration-200 cursor-pointer',
    className
  );

  return (
    <div className={cardClassName} {...rest}>
      {children}
    </div>
  );
}

/**
 * Card Header
 *
 * 카드 상단 영역
 */
function CardHeader({ children, className, ...rest }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-gray-200 pb-3 mb-3', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * Card Body
 *
 * 카드 본문 영역
 */
function CardBody({ children, className, ...rest }: CardBodyProps) {
  return (
    <div className={cn('', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 *
 * 카드 하단 영역
 */
function CardFooter({ children, className, ...rest }: CardFooterProps) {
  return (
    <div className={cn('border-t border-gray-200 pt-3 mt-3', className)} {...rest}>
      {children}
    </div>
  );
}

// Compound Components 패턴
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };

/**
 * 학습 노트:
 *
 * 1. Composition 패턴
 *    - children prop으로 유연한 구조
 *    - 내부 컨텐츠를 자유롭게 구성
 *
 * 2. Compound Components
 *    - Card.Header, Card.Body, Card.Footer
 *    - 논리적으로 관련된 컴포넌트 그룹
 *    - 일관된 API
 *
 * 3. Props 전달
 *    - {...rest}로 HTML 속성 전달
 *    - onClick, onMouseEnter 등 이벤트 지원
 *
 * 4. 선택적 섹션
 *    - Header, Body, Footer는 필요한 것만 사용
 *    - 유연한 레이아웃
 *
 * 5. 사용 예시
 *    ```tsx
 *    // 기본 사용
 *    <Card>
 *      <h3>제목</h3>
 *      <p>내용</p>
 *    </Card>
 *
 *    // 구조화된 사용
 *    <Card hoverable>
 *      <Card.Header>
 *        <div className="flex justify-between items-center">
 *          <h3>작업 제목</h3>
 *          <Badge>진행 중</Badge>
 *        </div>
 *      </Card.Header>
 *      <Card.Body>
 *        <p>작업 설명...</p>
 *      </Card.Body>
 *      <Card.Footer>
 *        <div className="flex gap-2">
 *          <Button>수정</Button>
 *          <Button variant="danger">삭제</Button>
 *        </div>
 *      </Card.Footer>
 *    </Card>
 *    ```
 */
