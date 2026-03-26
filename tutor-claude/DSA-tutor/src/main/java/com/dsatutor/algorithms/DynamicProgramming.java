package com.dsatutor.algorithms;

import java.util.Arrays;

/**
 * DP 핵심 패턴 모음.
 *
 * 포인트:
 * - 상태 정의가 절반이다: dp[i]가 무엇을 의미하는지 명확히
 * - 전이식(점화식)은 불변식을 지켜야 한다
 */
public final class DynamicProgramming {
    private DynamicProgramming() {}

    /** 피보나치: O(n), O(1) */
    public static long fib(int n) {
        if (n <= 1) return n;
        long a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            long c = a + b;
            a = b;
            b = c;
        }
        return b;
    }

    /** 0/1 배낭: dp[w] = 가치 최대, O(nW) */
    public static int knapsack01(int[] weight, int[] value, int capacity) {
        int[] dp = new int[capacity + 1];
        for (int i = 0; i < weight.length; i++) {
            for (int w = capacity; w >= weight[i]; w--) {
                dp[w] = Math.max(dp[w], dp[w - weight[i]] + value[i]);
            }
        }
        return dp[capacity];
    }

    /**
     * LIS (Longest Increasing Subsequence): O(n log n)
     * tails[k] = 길이 k+1인 증가 부분수열의 최소 마지막 값
     */
    public static int lis(int[] arr) {
        int[] tails = new int[arr.length];
        int size = 0;
        for (int x : arr) {
            int i = Arrays.binarySearch(tails, 0, size, x);
            if (i < 0) i = -i - 1;
            tails[i] = x;
            if (i == size) size++;
        }
        return size;
    }

    /** 동전 교환(최소 개수), 불가능하면 -1 */
    public static int coinChangeMin(int[] coins, int amount) {
        int INF = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (a - c >= 0) dp[a] = Math.min(dp[a], dp[a - c] + 1);
            }
        }
        return dp[amount] == INF ? -1 : dp[amount];
    }
}
