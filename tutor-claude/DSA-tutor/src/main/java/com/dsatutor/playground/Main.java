package com.dsatutor.playground;

import com.dsatutor.algorithms.*;
import com.dsatutor.fundamentals.*;
import com.dsatutor.structures.*;

import java.util.Arrays;
import java.util.List;

/**
 * 실행용 간단 데모. 필요한 부분만 직접 수정해서 학습하세요.
 */
public class Main {
    public static void main(String[] args) {
        demoBigO();
        demoStructures();
        demoAlgorithms();
    }

    private static void demoBigO() {
        int[] arr = {5, 1, 3, 2, 8, 5};
        System.out.println("Linear sum: " + BigO.linearSum(arr));
        System.out.println("Has duplicate: " + BigO.hasDuplicate(arr));
    }

    private static void demoStructures() {
        DynamicArray da = new DynamicArray();
        da.add(10); da.add(20); da.add(30);
        System.out.println("DynamicArray[1] = " + da.get(1));

        BinaryHeap heap = new BinaryHeap();
        heap.add(5); heap.add(2); heap.add(9);
        System.out.println("Heap min: " + heap.poll());

        Trie trie = new Trie();
        trie.insert("hello");
        trie.insert("helium");
        System.out.println("Trie startsWith hel: " + trie.startsWith("hel"));
    }

    private static void demoAlgorithms() {
        int[] arr = {7, 2, 9, 4, 1};
        Sorting.mergeSort(arr);
        System.out.println("Sorted: " + Arrays.toString(arr));

        int idx = Searching.binarySearch(arr, 4);
        System.out.println("Binary search index: " + idx);

        int[] coins = {1, 3, 4};
        System.out.println("Coin change: " + DynamicProgramming.coinChangeMin(coins, 6));

        List<Integer> primes = MathAlgorithms.sieve(30);
        System.out.println("Primes <= 30: " + primes);
    }
}
