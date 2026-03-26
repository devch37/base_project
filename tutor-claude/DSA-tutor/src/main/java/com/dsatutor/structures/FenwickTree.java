package com.dsatutor.structures;

/**
 * Fenwick Tree (Binary Indexed Tree)
 * - prefix sum, point update
 * - O(log n)
 */
public class FenwickTree {
    private final int n;
    private final long[] bit;

    public FenwickTree(int n) {
        this.n = n;
        this.bit = new long[n + 1];
    }

    public FenwickTree(int[] arr) {
        this(arr.length);
        for (int i = 0; i < arr.length; i++) add(i, arr[i]);
    }

    /** index는 0-based */
    public void add(int index, long delta) {
        int i = index + 1;
        while (i <= n) {
            bit[i] += delta;
            i += i & -i;
        }
    }

    /** [0..index] prefix sum */
    public long sumPrefix(int index) {
        long res = 0;
        int i = index + 1;
        while (i > 0) {
            res += bit[i];
            i -= i & -i;
        }
        return res;
    }

    /** [l..r] range sum */
    public long sumRange(int l, int r) {
        if (l > r) return 0;
        return sumPrefix(r) - (l == 0 ? 0 : sumPrefix(l - 1));
    }
}
