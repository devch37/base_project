package com.dsatutor.structures;

/**
 * Disjoint Set Union (Union-Find).
 *
 * 핵심:
 * - 경로 압축 + 랭크/사이즈 유니온 => 거의 O(1)
 * - MST(Kruskal), 사이클 판별, 연결 요소 등에 사용
 */
public class UnionFind {
    private final int[] parent;
    private final int[] size;

    public UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
    }

    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    public boolean union(int a, int b) {
        int ra = find(a);
        int rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) {
            int t = ra; ra = rb; rb = t;
        }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }

    public boolean connected(int a, int b) {
        return find(a) == find(b);
    }
}
