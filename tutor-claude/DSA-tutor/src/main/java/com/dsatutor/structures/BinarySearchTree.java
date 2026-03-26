package com.dsatutor.structures;

import java.util.ArrayList;
import java.util.List;

/**
 * 이진 탐색 트리 (BST) 기본 구현.
 *
 * 특성:
 * - 왼쪽 서브트리 < 루트 < 오른쪽 서브트리
 * - 평균 O(log n), 최악 O(n) (편향 트리)
 * - 균형을 보장하려면 AVL/Red-Black Tree가 필요
 */
public class BinarySearchTree {
    static class Node {
        int value;
        Node left, right;
        Node(int value) { this.value = value; }
    }

    private Node root;

    public void insert(int value) {
        root = insert(root, value);
    }

    private Node insert(Node node, int value) {
        if (node == null) return new Node(value);
        if (value < node.value) node.left = insert(node.left, value);
        else if (value > node.value) node.right = insert(node.right, value);
        // 중복 값은 무시
        return node;
    }

    public boolean contains(int value) {
        Node cur = root;
        while (cur != null) {
            if (value == cur.value) return true;
            cur = value < cur.value ? cur.left : cur.right;
        }
        return false;
    }

    /**
     * 삭제: 3가지 케이스
     * 1) 자식 없음 -> 제거
     * 2) 자식 1개 -> 자식으로 대체
     * 3) 자식 2개 -> 오른쪽 서브트리 최소값(후계자)로 대체
     */
    public void delete(int value) {
        root = delete(root, value);
    }

    private Node delete(Node node, int value) {
        if (node == null) return null;
        if (value < node.value) node.left = delete(node.left, value);
        else if (value > node.value) node.right = delete(node.right, value);
        else {
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            Node successor = minNode(node.right);
            node.value = successor.value;
            node.right = delete(node.right, successor.value);
        }
        return node;
    }

    private Node minNode(Node node) {
        Node cur = node;
        while (cur.left != null) cur = cur.left;
        return cur;
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

    public List<Integer> preorder() {
        List<Integer> out = new ArrayList<>();
        preorder(root, out);
        return out;
    }

    private void preorder(Node node, List<Integer> out) {
        if (node == null) return;
        out.add(node.value);
        preorder(node.left, out);
        preorder(node.right, out);
    }

    public List<Integer> postorder() {
        List<Integer> out = new ArrayList<>();
        postorder(root, out);
        return out;
    }

    private void postorder(Node node, List<Integer> out) {
        if (node == null) return;
        postorder(node.left, out);
        postorder(node.right, out);
        out.add(node.value);
    }
}
