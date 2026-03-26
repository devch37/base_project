package com.dsatutor.structures;

import java.util.Arrays;

/**
 * ArrayList의 핵심 아이디어를 축약한 동적 배열.
 *
 * 포인트:
 * - 배열은 고정 크기이므로, 꽉 차면 더 큰 배열로 복사한다.
 * - 보통 2배 확장 전략을 사용하면 amortized O(1) append가 가능하다.
 */
public class DynamicArray {
    private int[] data;
    private int size;

    public DynamicArray() {
        this(8);
    }

    public DynamicArray(int capacity) {
        if (capacity < 1) capacity = 1;
        this.data = new int[capacity];
        this.size = 0;
    }

    public int size() {
        return size;
    }

    public int get(int index) {
        rangeCheck(index);
        return data[index];
    }

    public void set(int index, int value) {
        rangeCheck(index);
        data[index] = value;
    }

    public void add(int value) {
        ensureCapacity(size + 1);
        data[size++] = value;
    }

    public int removeLast() {
        if (size == 0) throw new IllegalStateException("empty");
        int v = data[--size];
        return v;
    }

    private void ensureCapacity(int required) {
        if (required <= data.length) return;
        int newCap = data.length * 2;
        while (newCap < required) newCap *= 2;
        data = Arrays.copyOf(data, newCap);
    }

    private void rangeCheck(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("index=" + index + ", size=" + size);
        }
    }
}
