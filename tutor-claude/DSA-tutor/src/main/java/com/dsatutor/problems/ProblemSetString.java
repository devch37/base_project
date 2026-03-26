package com.dsatutor.problems;

/** 문자열 문제 모음. */
public final class ProblemSetString {
    private ProblemSetString() {}

    /**
     * 가장 긴 팰린드롬 부분 문자열 (O(n^2))
     * - 각 중심에서 확장
     */
    public static String longestPalindrome(String s) {
        if (s.isEmpty()) return s;
        int bestL = 0, bestR = 0;
        for (int i = 0; i < s.length(); i++) {
            int[] p1 = expand(s, i, i);     // 홀수
            int[] p2 = expand(s, i, i + 1); // 짝수
            if (p1[1] - p1[0] > bestR - bestL) { bestL = p1[0]; bestR = p1[1]; }
            if (p2[1] - p2[0] > bestR - bestL) { bestL = p2[0]; bestR = p2[1]; }
        }
        return s.substring(bestL, bestR + 1);
    }

    private static int[] expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
            l--; r++;
        }
        return new int[]{l + 1, r - 1};
    }

    /**
     * 아나그램 판별
     * - 문자 빈도 비교 (ASCII 가정)
     */
    public static boolean isAnagram(String a, String b) {
        if (a.length() != b.length()) return false;
        int[] cnt = new int[256];
        for (int i = 0; i < a.length(); i++) cnt[a.charAt(i)]++;
        for (int i = 0; i < b.length(); i++) {
            if (--cnt[b.charAt(i)] < 0) return false;
        }
        return true;
    }

    /**
     * 가장 긴 공통 접두사
     */
    public static String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) return "";
        String prefix = strs[0];
        for (int i = 1; i < strs.length; i++) {
            while (!strs[i].startsWith(prefix)) {
                if (prefix.isEmpty()) return "";
                prefix = prefix.substring(0, prefix.length() - 1);
            }
        }
        return prefix;
    }
}
