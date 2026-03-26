package com.dsatutor.structures;

/**
 * 세그먼트 트리 (구간 합)
 * - build: O(n)
 * - query/update: O(log n)
 */
public class SegmentTree {
    private final int n;
    private final long[] tree;

    public SegmentTree(int[] arr) {
        this.n = arr.length;
        this.tree = new long[4 * n];
        build(1, 0, n - 1, arr);
    }

    public long query(int l, int r) {
        if (l < 0 || r >= n || l > r) throw new IllegalArgumentException();
        return query(1, 0, n - 1, l, r);
    }

    public void update(int index, int value) {
        if (index < 0 || index >= n) throw new IllegalArgumentException();
        update(1, 0, n - 1, index, value);
    }

    private void build(int node, int l, int r, int[] arr) {
        if (l == r) {
            tree[node] = arr[l];
            return;
        }
        int mid = (l + r) / 2;
        build(node * 2, l, mid, arr);
        build(node * 2 + 1, mid + 1, r, arr);
        tree[node] = tree[node * 2] + tree[node * 2 + 1];
    }

    private long query(int node, int l, int r, int ql, int qr) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return tree[node];
        int mid = (l + r) / 2;
        return query(node * 2, l, mid, ql, qr) +
                query(node * 2 + 1, mid + 1, r, ql, qr);
    }

    private void update(int node, int l, int r, int idx, int value) {
        if (l == r) {
            tree[node] = value;
            return;
        }
        int mid = (l + r) / 2;
        if (idx <= mid) update(node * 2, l, mid, idx, value);
        else update(node * 2 + 1, mid + 1, r, idx, value);
        tree[node] = tree[node * 2] + tree[node * 2 + 1];
    }
}
