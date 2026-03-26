package com.dsatutor.problems;

/** DP 문제 모음. */
public final class ProblemSetDP {
    private ProblemSetDP() {}

    /**
     * LCS (Longest Common Subsequence) 길이
     * - dp[i][j] = a[0..i)와 b[0..j) LCS 길이
     * - O(nm)
     */
    public static int lcsLength(String a, String b) {
        int n = a.length();
        int m = b.length();
        int[][] dp = new int[n + 1][m + 1];
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[n][m];
    }

    /**
     * Edit Distance (Levenshtein)
     * - 삽입/삭제/교체 최소 횟수
     */
    public static int editDistance(String a, String b) {
        int n = a.length();
        int m = b.length();
        int[][] dp = new int[n + 1][m + 1];
        for (int i = 0; i <= n; i++) dp[i][0] = i;
        for (int j = 0; j <= m; j++) dp[0][j] = j;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],
                            Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
            }
        }
        return dp[n][m];
    }

    /**
     * Unique Paths (격자)
     * - 우/하 이동만 가능할 때 경로 수
     */
    public static long uniquePaths(int rows, int cols) {
        long[][] dp = new long[rows][cols];
        for (int i = 0; i < rows; i++) dp[i][0] = 1;
        for (int j = 0; j < cols; j++) dp[0][j] = 1;
        for (int i = 1; i < rows; i++) {
            for (int j = 1; j < cols; j++) {
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
            }
        }
        return dp[rows - 1][cols - 1];
    }
}
