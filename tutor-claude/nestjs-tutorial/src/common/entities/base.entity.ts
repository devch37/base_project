/**
 * ============================================================================
 * base.entity.ts — 모든 엔티티가 공통으로 갖는 컬럼
 * ----------------------------------------------------------------------------
 * id / createdAt / updatedAt 를 매번 쓰지 않도록 추상 엔티티로 분리합니다.
 * `abstract` 이므로 이 클래스 자체로는 테이블이 만들어지지 않고,
 * 상속하는 엔티티의 컬럼으로 "합쳐집니다".
 * ============================================================================
 */
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  // 학습 편의상 자동 증가 정수 PK를 씁니다.
  // 실무에서는 노출/추측 방지를 위해 UUID(@PrimaryGeneratedColumn('uuid'))를
  // 쓰는 경우가 많습니다 — docs/05 참고.
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
