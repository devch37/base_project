package com.dsatutor.algorithms;

import java.util.ArrayList;
import java.util.List;

/**
 * 백트래킹: 해 공간 탐색 + 가지치기.
 */
public final class Backtracking {
    private Backtracking() {}

    public static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfsSubsets(nums, 0, new ArrayList<>(), res);
        return res;
    }

    private static void dfsSubsets(int[] nums, int idx, List<Integer> path, List<List<Integer>> res) {
        res.add(new ArrayList<>(path));
        for (int i = idx; i < nums.length; i++) {
            path.add(nums[i]);
            dfsSubsets(nums, i + 1, path, res);
            path.remove(path.size() - 1);
        }
    }

    public static List<List<Integer>> permutations(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        dfsPerm(nums, used, new ArrayList<>(), res);
        return res;
    }

    private static void dfsPerm(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
        if (path.size() == nums.length) {
            res.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            dfsPerm(nums, used, path, res);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }

    /** N-Queens: 한 행에 하나씩 배치 */
    public static List<List<String>> nQueens(int n) {
        List<List<String>> res = new ArrayList<>();
        int[] cols = new int[n]; // cols[row] = col
        dfsQueens(0, n, cols, res);
        return res;
    }

    private static void dfsQueens(int row, int n, int[] cols, List<List<String>> res) {
        if (row == n) {
            res.add(renderBoard(cols));
            return;
        }
        for (int c = 0; c < n; c++) {
            if (isSafe(row, c, cols)) {
                cols[row] = c;
                dfsQueens(row + 1, n, cols, res);
            }
        }
    }

    private static boolean isSafe(int row, int col, int[] cols) {
        for (int r = 0; r < row; r++) {
            int c = cols[r];
            if (c == col) return false;
            if (Math.abs(r - row) == Math.abs(c - col)) return false;
        }
        return true;
    }

    private static List<String> renderBoard(int[] cols) {
        int n = cols.length;
        List<String> board = new ArrayList<>();
        for (int r = 0; r < n; r++) {
            StringBuilder sb = new StringBuilder();
            for (int c = 0; c < n; c++) {
                sb.append(cols[r] == c ? 'Q' : '.');
            }
            board.add(sb.toString());
        }
        return board;
    }
}
