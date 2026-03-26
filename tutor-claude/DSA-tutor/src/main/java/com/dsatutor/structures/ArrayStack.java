package com.dsatutor.structures;

/**
 * 배열 기반 스택 (LIFO).
 *
 * 연산 복잡도:
 * - push/pop/peek: O(1) amortized
 */
public class ArrayStack {
    private final DynamicArray data = new DynamicArray();

    public void push(int value) {
        data.add(value);
    }

    public int pop() {
        return data.removeLast();
    }

    public int peek() {
        if (data.size() == 0) throw new IllegalStateException("empty");
        return data.get(data.size() - 1);
    }

    public int size() {
        return data.size();
    }
}
