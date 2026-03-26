package com.dsatutor.algorithms;

import java.util.ArrayList;
import java.util.List;

/**
 * 문자열 알고리즘.
 */
public final class StringAlgorithms {
    private StringAlgorithms() {}

    /** KMP: O(n + m) */
    public static List<Integer> kmpSearch(String text, String pattern) {
        List<Integer> res = new ArrayList<>();
        if (pattern.isEmpty()) return res;
        int[] lps = buildLps(pattern);
        int i = 0, j = 0;
        while (i < text.length()) {
            if (text.charAt(i) == pattern.charAt(j)) {
                i++; j++;
                if (j == pattern.length()) {
                    res.add(i - j);
                    j = lps[j - 1];
                }
            } else {
                if (j != 0) j = lps[j - 1];
                else i++;
            }
        }
        return res;
    }

    private static int[] buildLps(String p) {
        int[] lps = new int[p.length()];
        int len = 0;
        for (int i = 1; i < p.length();) {
            if (p.charAt(i) == p.charAt(len)) {
                lps[i++] = ++len;
            } else if (len != 0) {
                len = lps[len - 1];
            } else {
                lps[i++] = 0;
            }
        }
        return lps;
    }

    /**
     * Rabin-Karp: 롤링 해시
     * 충돌 가능성이 있으므로 실제 문자열 비교로 검증
     */
    public static List<Integer> rabinKarp(String text, String pattern) {
        List<Integer> res = new ArrayList<>();
        int n = text.length();
        int m = pattern.length();
        if (m == 0 || m > n) return res;
        long mod = 1_000_000_007L;
        long base = 911382323L; // 임의 기반
        long pow = 1;
        for (int i = 1; i < m; i++) pow = (pow * base) % mod;
        long hashP = 0, hashT = 0;
        for (int i = 0; i < m; i++) {
            hashP = (hashP * base + pattern.charAt(i)) % mod;
            hashT = (hashT * base + text.charAt(i)) % mod;
        }
        for (int i = 0; i <= n - m; i++) {
            if (hashP == hashT) {
                // 충돌 방지 검증
                if (text.regionMatches(i, pattern, 0, m)) res.add(i);
            }
            if (i < n - m) {
                hashT = (hashT - text.charAt(i) * pow) % mod;
                if (hashT < 0) hashT += mod;
                hashT = (hashT * base + text.charAt(i + m)) % mod;
            }
        }
        return res;
    }
}
