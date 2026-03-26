package com.dsatutor.structures;

/**
 * Trie (Prefix Tree).
 *
 * 용도:
 * - 문자열 검색/자동완성/사전
 * - 접두사 공유로 공간 절약 가능
 */
public class Trie {
    static class Node {
        Node[] next = new Node[26];
        boolean isWord;
    }

    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (idx < 0 || idx >= 26) throw new IllegalArgumentException("only a-z");
            if (cur.next[idx] == null) cur.next[idx] = new Node();
            cur = cur.next[idx];
        }
        cur.isWord = true;
    }

    public boolean search(String word) {
        Node node = findNode(word);
        return node != null && node.isWord;
    }

    public boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }

    private Node findNode(String s) {
        Node cur = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (idx < 0 || idx >= 26) return null;
            if (cur.next[idx] == null) return null;
            cur = cur.next[idx];
        }
        return cur;
    }
}
