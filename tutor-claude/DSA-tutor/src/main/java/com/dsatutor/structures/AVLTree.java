package com.dsatutor.structures;

import java.util.ArrayList;
import java.util.List;

/**
 * AVL Tree (자기 균형 이진 탐색 트리)
 *
 * 핵심:
 * - 각 노드의 balance = height(left) - height(right)
 * - balance가 -1,0,1을 벗어나면 회전으로 복구
 */
public class AVLTree {
    static class Node {
        int value;
        int height;
        Node left, right;
        Node(int value) { this.value = value; this.height = 1; }
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
    }

    public void delete(int value) {
        root = delete(root, value);
    }

    private Node insert(Node node, int value) {
        if (node == null) return new Node(value);
        if (value < node.value) node.left = insert(node.left, value);
        else if (value > node.value) node.right = insert(node.right, value);
        else return node; // 중복 무시

        updateHeight(node);
        return rebalance(node);
    }

    private Node delete(Node node, int value) {
        if (node == null) return null;
        if (value < node.value) node.left = delete(node.left, value);
        else if (value > node.value) node.right = delete(node.right, value);
        else {
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            Node succ = min(node.right);
            node.value = succ.value;
            node.right = delete(node.right, succ.value);
        }
        updateHeight(node);
        return rebalance(node);
    }

    private Node min(Node node) {
        Node cur = node;
        while (cur.left != null) cur = cur.left;
        return cur;
    }

    private void updateHeight(Node node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
    }

    private int height(Node node) {
        return node == null ? 0 : node.height;
    }

    private int balance(Node node) {
        return height(node.left) - height(node.right);
    }

    private Node rebalance(Node node) {
        int bal = balance(node);
        if (bal > 1) {
            if (balance(node.left) < 0) node.left = rotateLeft(node.left);
            return rotateRight(node);
        }
        if (bal < -1) {
            if (balance(node.right) > 0) node.right = rotateRight(node.right);
            return rotateLeft(node);
        }
        return node;
    }

    private Node rotateRight(Node y) {
        Node x = y.left;
        Node t2 = x.right;
        x.right = y;
        y.left = t2;
        updateHeight(y);
        updateHeight(x);
        return x;
    }

    private Node rotateLeft(Node x) {
        Node y = x.right;
        Node t2 = y.left;
        y.left = x;
        x.right = t2;
        updateHeight(x);
        updateHeight(y);
        return y;
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
