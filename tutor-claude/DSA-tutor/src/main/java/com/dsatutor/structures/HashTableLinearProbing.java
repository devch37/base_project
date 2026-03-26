package com.dsatutor.structures;

import java.util.Objects;

/**
 * 선형 탐사를 사용하는 해시 테이블 (간단 구현).
 *
 * 포인트:
 * - 평균 O(1) 조회/삽입 (충돌은 선형 탐사)
 * - 로드팩터가 커지면 재해싱
 * - 삭제 처리는 tombstone 필요 (여기서는 단순화를 위해 제한)
 */
public class HashTableLinearProbing<K, V> {
    private static final Object TOMBSTONE = new Object();

    private Object[] keys;
    private Object[] values;
    private int size;
    private int used; // tombstone 포함

    public HashTableLinearProbing() {
        this(16);
    }

    public HashTableLinearProbing(int capacity) {
        int cap = 1;
        while (cap < capacity) cap <<= 1;
        keys = new Object[cap];
        values = new Object[cap];
    }

    public int size() {
        return size;
    }

    public V get(K key) {
        int idx = findSlot(key);
        if (idx < 0) return null;
        @SuppressWarnings("unchecked")
        V v = (V) values[idx];
        return v;
    }

    public void put(K key, V value) {
        if (used * 1.0 / keys.length > 0.7) rehash();
        int idx = probeForInsert(key);
        if (keys[idx] == null || keys[idx] == TOMBSTONE) {
            used++;
            size++;
        }
        keys[idx] = key;
        values[idx] = value;
    }

    public boolean containsKey(K key) {
        return findSlot(key) >= 0;
    }

    public boolean remove(K key) {
        int idx = findSlot(key);
        if (idx < 0) return false;
        keys[idx] = TOMBSTONE;
        values[idx] = null;
        size--;
        return true;
    }

    private int findSlot(K key) {
        int mask = keys.length - 1;
        int idx = (Objects.hashCode(key)) & mask;
        int steps = 0;
        while (steps < keys.length) {
            Object k = keys[idx];
            if (k == null) return -1;
            if (k != TOMBSTONE && k.equals(key)) return idx;
            idx = (idx + 1) & mask;
            steps++;
        }
        return -1;
    }

    private int probeForInsert(K key) {
        int mask = keys.length - 1;
        int idx = (Objects.hashCode(key)) & mask;
        int firstTombstone = -1;
        while (true) {
            Object k = keys[idx];
            if (k == null) {
                return firstTombstone >= 0 ? firstTombstone : idx;
            }
            if (k == TOMBSTONE && firstTombstone < 0) {
                firstTombstone = idx;
            } else if (k.equals(key)) {
                return idx;
            }
            idx = (idx + 1) & mask;
        }
    }

    private void rehash() {
        Object[] oldKeys = keys;
        Object[] oldValues = values;
        keys = new Object[oldKeys.length * 2];
        values = new Object[oldValues.length * 2];
        size = 0;
        used = 0;
        for (int i = 0; i < oldKeys.length; i++) {
            Object k = oldKeys[i];
            if (k != null && k != TOMBSTONE) {
                @SuppressWarnings("unchecked")
                K key = (K) k;
                @SuppressWarnings("unchecked")
                V val = (V) oldValues[i];
                put(key, val);
            }
        }
    }
}
