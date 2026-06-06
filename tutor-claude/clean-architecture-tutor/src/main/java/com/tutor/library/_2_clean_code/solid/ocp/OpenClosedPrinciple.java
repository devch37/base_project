package com.tutor.library._2_clean_code.solid.ocp;

import java.util.List;

/**
 * ============================================================
 * [2단계 - SOLID 원칙 2] 개방-폐쇄 원칙 (OCP)
 * Open-Closed Principle
 * ============================================================
 *
 * "소프트웨어 엔티티는 확장에는 열려 있어야 하고,
 *  수정에는 닫혀 있어야 한다."
 * - Bertrand Meyer
 *
 * 더 쉽게 말하면:
 * "새로운 기능을 추가할 때 기존 코드를 수정하지 않아야 한다."
 *
 * 왜 중요한가?
 * - 기존 코드를 수정하면 기존에 잘 돌아가던 것이 깨질 수 있다.
 * - 새 기능을 추가할 때마다 기존 테스트를 다시 해야 한다.
 * - 확장이 어려운 코드는 결국 재작성(rewrite)으로 이어진다.
 */
public class OpenClosedPrinciple {

    // ============================================================
    // 나쁜 예: 새 할인 타입이 추가될 때마다 기존 코드를 수정해야 함
    // ============================================================

    /**
     * 나쁜 예: if-else로 할인 타입을 분기
     *
     * 문제: "시니어 할인"을 추가하려면?
     * -> calculateDiscount() 메서드를 수정해야 함
     * -> 기존에 잘 동작하던 "일반 회원", "학생 할인" 로직이 깨질 수 있음
     * -> 수정할 때마다 모든 케이스를 다시 테스트해야 함
     * -> 할인 타입이 10개, 20개로 늘어나면? if-else 지옥!
     */
    static class BadDiscountCalculator {

        // 할인을 추가할 때마다 이 메서드를 수정해야 함 -> OCP 위반!
        public double calculateDiscount(String memberType, double price) {
            if (memberType.equals("REGULAR")) {
                return price * 0.0;          // 할인 없음
            } else if (memberType.equals("STUDENT")) {
                return price * 0.1;          // 10% 할인
            } else if (memberType.equals("SENIOR")) {
                return price * 0.2;          // 20% 할인 (나중에 추가됨)
            } else if (memberType.equals("VIP")) {
                return price * 0.3;          // 30% 할인 (또 나중에 추가됨)
            }
            // 다음에 또 새 타입이 추가되면? -> 이 메서드 또 수정!
            return 0;
        }
    }

    // ============================================================
    // 좋은 예: 새 할인 타입 추가 시 기존 코드 수정 없이 확장 가능
    // ============================================================

    /**
     * 좋은 예 1: 할인 정책을 인터페이스로 추상화
     * 각 할인 타입은 이 인터페이스를 구현
     */
    interface DiscountPolicy {
        double calculateDiscount(double price);
        String getPolicyName();
    }

    // 기존 할인 정책들 (기존 코드 - 수정 안 함)
    static class NoDiscount implements DiscountPolicy {
        @Override
        public double calculateDiscount(double price) { return 0; }

        @Override
        public String getPolicyName() { return "일반 회원 (할인 없음)"; }
    }

    static class StudentDiscount implements DiscountPolicy {
        private static final double STUDENT_DISCOUNT_RATE = 0.1;

        @Override
        public double calculateDiscount(double price) {
            return price * STUDENT_DISCOUNT_RATE;
        }

        @Override
        public String getPolicyName() { return "학생 10% 할인"; }
    }

    // 새 기능 추가: 기존 코드 수정 없이 새 클래스만 추가! (확장에 열림)
    static class SeniorDiscount implements DiscountPolicy {
        private static final double SENIOR_DISCOUNT_RATE = 0.2;

        @Override
        public double calculateDiscount(double price) {
            return price * SENIOR_DISCOUNT_RATE;
        }

        @Override
        public String getPolicyName() { return "시니어 20% 할인"; }
    }

    static class VipDiscount implements DiscountPolicy {
        private static final double VIP_DISCOUNT_RATE = 0.3;

        @Override
        public double calculateDiscount(double price) {
            return price * VIP_DISCOUNT_RATE;
        }

        @Override
        public String getPolicyName() { return "VIP 30% 할인"; }
    }

    /**
     * 좋은 예 2: 계산기는 인터페이스에만 의존 (수정에 닫힘)
     * 새 할인이 추가되어도 이 클래스는 전혀 수정하지 않아도 됨!
     */
    static class GoodDiscountCalculator {
        private final DiscountPolicy discountPolicy;

        // 어떤 할인 정책이든 주입 가능 (의존성 주입)
        GoodDiscountCalculator(DiscountPolicy discountPolicy) {
            this.discountPolicy = discountPolicy;
        }

        public double calculateFinalPrice(double originalPrice) {
            double discountAmount = discountPolicy.calculateDiscount(originalPrice);
            return originalPrice - discountAmount;
        }
    }

    // ============================================================
    // 실제 사용 예시
    // ============================================================

    public static void main(String[] args) {
        double bookPrice = 15000;

        // 학생 회원 -> 학생 할인 적용
        GoodDiscountCalculator studentCalc = new GoodDiscountCalculator(new StudentDiscount());
        System.out.println("학생 최종가: " + studentCalc.calculateFinalPrice(bookPrice)); // 13500

        // VIP 회원 -> VIP 할인 적용
        GoodDiscountCalculator vipCalc = new GoodDiscountCalculator(new VipDiscount());
        System.out.println("VIP 최종가: " + vipCalc.calculateFinalPrice(bookPrice));     // 10500

        // 새 할인 정책 추가: 기존 코드 수정 없이 새 클래스만 추가! (확장에 열림)
        DiscountPolicy specialDiscount = new DiscountPolicy() {
            @Override
            public double calculateDiscount(double price) { return price * 0.5; }
            @Override
            public String getPolicyName() { return "특별 50% 할인"; }
        };
        GoodDiscountCalculator specialCalc = new GoodDiscountCalculator(specialDiscount);
        System.out.println("특별 최종가: " + specialCalc.calculateFinalPrice(bookPrice)); // 7500
    }
}
