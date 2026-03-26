package com.dsatutor.problems;

import com.dsatutor.structures.Graph;
import com.dsatutor.structures.UnionFind;

import java.util.ArrayDeque;
import java.util.Arrays;

/** 그래프 문제 모음. */
public final class ProblemSetGraph {
    private ProblemSetGraph() {}

    /**
     * 무가중치 최단거리 (BFS)
     */
    public static int[] shortestPathUnweighted(Graph g, int start) {
        int n = g.size();
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        ArrayDeque<Integer> q = new ArrayDeque<>();
        q.add(start);
        dist[start] = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            for (Graph.Edge e : g.neighbors(u)) {
                if (dist[e.to] == -1) {
                    dist[e.to] = dist[u] + 1;
                    q.add(e.to);
                }
            }
        }
        return dist;
    }

    /**
     * 사이클 판별 (무방향 그래프) - Union-Find
     * edges: [u, v]
     */
    public static boolean hasCycleUndirected(int n, int[][] edges) {
        UnionFind uf = new UnionFind(n);
        for (int[] e : edges) {
            if (!uf.union(e[0], e[1])) return true;
        }
        return false;
    }

    /**
     * Number of Islands (grid BFS)
     * - '1'은 땅, '0'은 물
     */
    public static int numberOfIslands(char[][] grid) {
        int r = grid.length, c = grid[0].length;
        boolean[][] visited = new boolean[r][c];
        int count = 0;
        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};
        for (int i = 0; i < r; i++) {
            for (int j = 0; j < c; j++) {
                if (grid[i][j] == '1' && !visited[i][j]) {
                    count++;
                    ArrayDeque<int[]> q = new ArrayDeque<>();
                    q.add(new int[]{i, j});
                    visited[i][j] = true;
                    while (!q.isEmpty()) {
                        int[] cur = q.poll();
                        for (int k = 0; k < 4; k++) {
                            int nr = cur[0] + dr[k];
                            int nc = cur[1] + dc[k];
                            if (nr < 0 || nc < 0 || nr >= r || nc >= c) continue;
                            if (grid[nr][nc] == '1' && !visited[nr][nc]) {
                                visited[nr][nc] = true;
                                q.add(new int[]{nr, nc});
                            }
                        }
                    }
                }
            }
        }
        return count;
    }
}
