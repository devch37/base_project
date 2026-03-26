package com.dsatutor.structures;

/**
 * 원형 버퍼 기반 큐 (FIFO).
 *
 * 포인트:
 * - head/tail 인덱스를 원형으로 이동
 * - 가득 차면 2배 확장
 */
public class ArrayQueue {
    private int[] data;
    private int head;
    private int tail;
    private int size;

    public ArrayQueue() {
        data = new int[8];
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void offer(int value) {
        ensureCapacity(size + 1);
        data[tail] = value;
        tail = (tail + 1) % data.length;
        size++;
    }

    public int poll() {
        if (size == 0) throw new IllegalStateException("empty");
        int v = data[head];
        head = (head + 1) % data.length;
        size--;
        return v;
    }

    public int peek() {
        if (size == 0) throw new IllegalStateException("empty");
        return data[head];
    }

    private void ensureCapacity(int required) {
        if (required <= data.length) return;
        int newCap = data.length * 2;
        int[] next = new int[newCap];
        for (int i = 0; i < size; i++) {
            next[i] = data[(head + i) % data.length];
        }
        data = next;
        head = 0;
        tail = size;
    }
}
