package com.dsatutor.structures;

/**
 * 단일 연결 리스트.
 *
 * 포인트:
 * - 노드가 다음 노드를 가리키는 포인터만 가진다.
 * - 임의 접근은 O(n), 앞/뒤 삽입은 O(1) (tail 유지 시)
 */
public class SinglyLinkedList {
    static class Node {
        int value;
        Node next;
        Node(int value) { this.value = value; }
    }

    private Node head;
    private Node tail;
    private int size;

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void addFirst(int value) {
        Node n = new Node(value);
        n.next = head;
        head = n;
        if (tail == null) tail = n;
        size++;
    }

    public void addLast(int value) {
        Node n = new Node(value);
        if (tail == null) {
            head = tail = n;
        } else {
            tail.next = n;
            tail = n;
        }
        size++;
    }

    public int removeFirst() {
        if (head == null) throw new IllegalStateException("empty");
        int v = head.value;
        head = head.next;
        if (head == null) tail = null;
        size--;
        return v;
    }

    public int get(int index) {
        if (index < 0 || index >= size) throw new IndexOutOfBoundsException();
        Node cur = head;
        for (int i = 0; i < index; i++) cur = cur.next;
        return cur.value;
    }
}
