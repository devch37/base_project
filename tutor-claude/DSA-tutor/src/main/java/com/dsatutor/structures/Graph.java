package com.dsatutor.structures;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 인접 리스트 기반 그래프.
 *
 * 정점은 0..n-1 정수로 식별.
 */
public class Graph {
    public static class Edge {
        public final int to;
        public final int weight;
        public Edge(int to, int weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    private final List<List<Edge>> adj;
    private final boolean directed;

    public Graph(int n, boolean directed) {
        this.directed = directed;
        this.adj = new ArrayList<>(n);
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    }

    public int size() { return adj.size(); }

    public void addEdge(int u, int v, int w) {
        adj.get(u).add(new Edge(v, w));
        if (!directed) adj.get(v).add(new Edge(u, w));
    }

    public List<Edge> neighbors(int u) {
        return Collections.unmodifiableList(adj.get(u));
    }

    public boolean isDirected() { return directed; }
}
