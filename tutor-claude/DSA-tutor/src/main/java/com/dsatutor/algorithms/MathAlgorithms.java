package com.dsatutor.algorithms;

import java.util.ArrayList;
import java.util.List;

/**
 * 수학적 알고리즘들.
 */
public final class MathAlgorithms {
    private MathAlgorithms() {}

    /** 에라토스테네스의 체: 2..n 소수 리스트 */
    public static List<Integer> sieve(int n) {
        boolean[] isPrime = new boolean[n + 1];
        for (int i = 2; i <= n; i++) isPrime[i] = true;
        for (int p = 2; p * p <= n; p++) {
            if (!isPrime[p]) continue;
            for (int x = p * p; x <= n; x += p) isPrime[x] = false;
        }
        List<Integer> primes = new ArrayList<>();
        for (int i = 2; i <= n; i++) if (isPrime[i]) primes.add(i);
        return primes;
    }

    /** 확장 유클리드: ax + by = gcd(a,b) */
    public static long[] extendedGcd(long a, long b) {
        if (b == 0) return new long[]{a, 1, 0};
        long[] res = extendedGcd(b, a % b);
        long g = res[0], x = res[2], y = res[1] - (a / b) * res[2];
        return new long[]{g, x, y};
    }

    /** 모듈러 역원: a^{-1} mod m (m은 소수/또는 a와 서로소) */
    public static long modInverse(long a, long mod) {
        long[] eg = extendedGcd(a, mod);
        if (eg[0] != 1) throw new IllegalArgumentException("not coprime");
        long x = eg[1] % mod;
        if (x < 0) x += mod;
        return x;
    }
}
