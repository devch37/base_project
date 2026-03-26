package com.dsatutor.structures;

import java.util.Arrays;

/**
 * 최소 힙 (Min-Heap) 구현.
 *
 * 핵심:
 * - 완전 이진 트리를 배열로 표현
 * - 부모 i의 자식: 2i+1, 2i+2
 * - 삽입: 마지막에 추가 후 up-heap
 * - 삭제(최소값): 루트 제거 후 down-heap
 */
public class BinaryHeap {
    private int[] data;
    private int size;

    public BinaryHeap() {
        data = new int[16];
    }

    public int size() { return size; }

    public boolean isEmpty() { return size == 0; }

    public void add(int value) {
        ensureCapacity(size + 1);
        data[size] = value;
        siftUp(size);
        size++;
    }

    public int peek() {
        if (size == 0) throw new IllegalStateException("empty");
        return data[0];
    }

    public int poll() {
        if (size == 0) throw new IllegalStateException("empty");
        int min = data[0];
        data[0] = data[--size];
        siftDown(0);
        return min;
    }

    private void siftUp(int idx) {
        int cur = idx;
        while (cur > 0) {
            int parent = (cur - 1) / 2;
            if (data[parent] <= data[cur]) break;
            swap(parent, cur);
            cur = parent;
        }
    }

    private void siftDown(int idx) {
        int cur = idx;
        while (true) {
            int left = cur * 2 + 1;
            int right = left + 1;
            if (left >= size) break;
            int smaller = left;
            if (right < size && data[right] < data[left]) smaller = right;
            if (data[cur] <= data[smaller]) break;
            swap(cur, smaller);
            cur = smaller;
        }
    }

    private void ensureCapacity(int required) {
        if (required <= data.length) return;
        data = Arrays.copyOf(data, data.length * 2);
    }

    private void swap(int i, int j) {
        int t = data[i];
        data[i] = data[j];
        data[j] = t;
    }
}
