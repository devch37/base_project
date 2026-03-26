package com.dsatutor.algorithms;

import com.dsatutor.structures.Graph;
import com.dsatutor.structures.UnionFind;

import java.util.*;

/**
 * 그래프 알고리즘 모음.
 */
public final class GraphAlgorithms {
    private GraphAlgorithms() {}

    /** BFS: 최단 거리(간선 가중치=1) */
    public static int[] bfs(Graph g, int start) {
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

    /** DFS (재귀): 연결성 탐색 */
    public static void dfs(Graph g, int start, boolean[] visited) {
        visited[start] = true;
        for (Graph.Edge e : g.neighbors(start)) {
            if (!visited[e.to]) dfs(g, e.to, visited);
        }
    }

    /** 위상 정렬 (Kahn). DAG에서만 유효 */
    public static List<Integer> topologicalSort(Graph g) {
        int n = g.size();
        int[] indeg = new int[n];
        for (int u = 0; u < n; u++) {
            for (Graph.Edge e : g.neighbors(u)) indeg[e.to]++;
        }
        ArrayDeque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);
        List<Integer> order = new ArrayList<>();
        while (!q.isEmpty()) {
            int u = q.poll();
            order.add(u);
            for (Graph.Edge e : g.neighbors(u)) {
                if (--indeg[e.to] == 0) q.add(e.to);
            }
        }
        if (order.size() != n) throw new IllegalStateException("graph has cycle");
        return order;
    }

    /** 다익스트라: 음수 가중치 없음 */
    public static int[] dijkstra(Graph g, int start) {
        int n = g.size();
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[start] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
        pq.add(new int[]{start, 0});
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int u = cur[0], d = cur[1];
            if (d != dist[u]) continue; // stale
            for (Graph.Edge e : g.neighbors(u)) {
                if (dist[u] != Integer.MAX_VALUE && dist[u] + e.weight < dist[e.to]) {
                    dist[e.to] = dist[u] + e.weight;
                    pq.add(new int[]{e.to, dist[e.to]});
                }
            }
        }
        return dist;
    }

    /** 벨만-포드: 음수 가중치 허용, 음수 사이클 탐지 가능 */
    public static int[] bellmanFord(Graph g, int start) {
        int n = g.size();
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[start] = 0;
        for (int i = 0; i < n - 1; i++) {
            boolean updated = false;
            for (int u = 0; u < n; u++) {
                if (dist[u] == Integer.MAX_VALUE) continue;
                for (Graph.Edge e : g.neighbors(u)) {
                    if (dist[u] + e.weight < dist[e.to]) {
                        dist[e.to] = dist[u] + e.weight;
                        updated = true;
                    }
                }
            }
            if (!updated) break;
        }
        // 음수 사이클 체크가 필요하면 한 번 더 relax 시도해서 변하면 사이클 존재
        return dist;
    }

    /**
     * Kruskal MST: 무방향 그래프에서 최소 신장 트리
     * 간선을 가중치 기준으로 정렬 후, 사이클이 없으면 채택
     */
    public static int kruskalMST(int n, List<int[]> edges) {
        // edges: [u, v, w]
        edges.sort(Comparator.comparingInt(a -> a[2]));
        UnionFind uf = new UnionFind(n);
        int total = 0;
        int used = 0;
        for (int[] e : edges) {
            if (uf.union(e[0], e[1])) {
                total += e[2];
                used++;
                if (used == n - 1) break;
            }
        }
        if (used != n - 1) throw new IllegalStateException("graph is disconnected");
        return total;
    }
}
