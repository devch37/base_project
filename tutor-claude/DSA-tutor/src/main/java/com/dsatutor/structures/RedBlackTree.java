package com.dsatutor.structures;

import java.util.ArrayList;
import java.util.List;

/**
 * Left-Leaning Red-Black Tree (LLRB)
 * - 2-3 트리를 BST로 인코딩한 균형 트리
 * - 높이 O(log n)
 */
public class RedBlackTree {
    private static final boolean RED = true;
    private static final boolean BLACK = false;

    static class Node {
        int value;
        Node left, right;
        boolean color;
        Node(int value, boolean color) {
            this.value = value;
            this.color = color;
        }
    }

    private Node root;

    public boolean contains(int value) {
        Node cur = root;
        while (cur != null) {
            if (value == cur.value) return true;
            cur = value < cur.value ? cur.left : cur.right;
        }
        return false;
    }

    public void insert(int value) {
        root = insert(root, value);
        root.color = BLACK;
    }

    public void delete(int value) {
        if (!contains(value)) return;
        if (!isRed(root.left) && !isRed(root.right)) root.color = RED;
        root = delete(root, value);
        if (root != null) root.color = BLACK;
    }

    private Node insert(Node h, int value) {
        if (h == null) return new Node(value, RED);

        if (value < h.value) h.left = insert(h.left, value);
        else if (value > h.value) h.right = insert(h.right, value);
        // 중복 무시

        if (isRed(h.right) && !isRed(h.left)) h = rotateLeft(h);
        if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
        if (isRed(h.left) && isRed(h.right)) flipColors(h);

        return h;
    }

    private Node delete(Node h, int value) {
        if (value < h.value) {
            if (!isRed(h.left) && !isRed(h.left.left)) h = moveRedLeft(h);
            h.left = delete(h.left, value);
        } else {
            if (isRed(h.left)) h = rotateRight(h);
            if (value == h.value && h.right == null) return null;
            if (!isRed(h.right) && !isRed(h.right.left)) h = moveRedRight(h);
            if (value == h.value) {
                Node min = min(h.right);
                h.value = min.value;
                h.right = deleteMin(h.right);
            } else {
                h.right = delete(h.right, value);
            }
        }
        return balance(h);
    }

    private Node deleteMin(Node h) {
        if (h.left == null) return null;
        if (!isRed(h.left) && !isRed(h.left.left)) h = moveRedLeft(h);
        h.left = deleteMin(h.left);
        return balance(h);
    }

    private Node min(Node h) {
        Node cur = h;
        while (cur.left != null) cur = cur.left;
        return cur;
    }

    private Node rotateLeft(Node h) {
        Node x = h.right;
        h.right = x.left;
        x.left = h;
        x.color = h.color;
        h.color = RED;
        return x;
    }

    private Node rotateRight(Node h) {
        Node x = h.left;
        h.left = x.right;
        x.right = h;
        x.color = h.color;
        h.color = RED;
        return x;
    }

    private void flipColors(Node h) {
        h.color = !h.color;
        if (h.left != null) h.left.color = !h.left.color;
        if (h.right != null) h.right.color = !h.right.color;
    }

    private Node moveRedLeft(Node h) {
        flipColors(h);
        if (isRed(h.right.left)) {
            h.right = rotateRight(h.right);
            h = rotateLeft(h);
            flipColors(h);
        }
        return h;
    }

    private Node moveRedRight(Node h) {
        flipColors(h);
        if (isRed(h.left.left)) {
            h = rotateRight(h);
            flipColors(h);
        }
        return h;
    }

    private Node balance(Node h) {
        if (isRed(h.right)) h = rotateLeft(h);
        if (isRed(h.left) && isRed(h.left.left)) h = rotateRight(h);
        if (isRed(h.left) && isRed(h.right)) flipColors(h);
        return h;
    }

    private boolean isRed(Node x) {
        return x != null && x.color == RED;
    }

    public List<Integer> inorder() {
        List<Integer> out = new ArrayList<>();
        inorder(root, out);
        return out;
    }

    private void inorder(Node node, List<Integer> out) {
        if (node == null) return;
        inorder(node.left, out);
        out.add(node.value);
        inorder(node.right, out);
    }
}
