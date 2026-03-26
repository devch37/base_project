package com.dsatutor.fundamentals;

/**
 * 알고리즘에서 자주 쓰이는 수학적 기초.
 *
 * 핵심 아이디어:
 * - 유클리드 호제법: gcd(a, b) = gcd(b, a % b)
 * - 모듈러 연산은 곱셈/덧셈에 대해 분배 가능
 * - 빠른 거듭제곱: 지수를 이진 분해하여 O(log n)
 */
public final class MathBasics {
    private MathBasics() {}

    /** 최대공약수: O(log min(a,b)) */
    public static long gcd(long a, long b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b != 0) {
            long t = a % b;
            a = b;
            b = t;
        }
        return a;
    }

    /** 최소공배수: a/gcd(a,b) * b (오버플로 주의) */
    public static long lcm(long a, long b) {
        if (a == 0 || b == 0) return 0;
        return Math.abs(a / gcd(a, b) * b);
    }

    /** 빠른 거듭제곱: O(log exp) */
    public static long fastPow(long base, long exp) {
        long result = 1;
        long cur = base;
        long e = exp;
        while (e > 0) {
            if ((e & 1) == 1) result *= cur;
            cur *= cur;
            e >>= 1;
        }
        return result;
    }

    /** 모듈러 빠른 거듭제곱: (base^exp) % mod */
    public static long modPow(long base, long exp, long mod) {
        long result = 1 % mod;
        long cur = base % mod;
        long e = exp;
        while (e > 0) {
            if ((e & 1) == 1) result = (result * cur) % mod;
            cur = (cur * cur) % mod;
            e >>= 1;
        }
        return result;
    }

    /** 소수 판별: O(sqrt(n)) */
    public static boolean isPrime(int n) {
        if (n < 2) return false;
        if (n == 2 || n == 3) return true;
        if (n % 2 == 0) return false;
        for (int i = 3; i * i <= n; i += 2) {
            if (n % i == 0) return false;
        }
        return true;
    }

    /**
     * 이항계수 nCk (조합): O(nk)
     * DP로 파스칼 삼각형 활용
     */
    public static long nCk(int n, int k) {
        if (k < 0 || k > n) return 0;
        k = Math.min(k, n - k); // 대칭성 활용
        long[] dp = new long[k + 1];
        dp[0] = 1;
        for (int i = 1; i <= n; i++) {
            for (int j = Math.min(i, k); j >= 1; j--) {
                dp[j] += dp[j - 1];
            }
        }
        return dp[k];
    }
}
