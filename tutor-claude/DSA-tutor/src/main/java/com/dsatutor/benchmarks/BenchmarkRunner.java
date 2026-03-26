package com.dsatutor.benchmarks;

import com.dsatutor.algorithms.Sorting;
import com.dsatutor.algorithms.Searching;

import java.util.Arrays;
import java.util.Random;

/**
 * 간단 벤치마크 러너.
 *
 * 주의:
 * - JVM 워밍업, GC, 환경 영향이 크다. 절대값보다 추세 비교용으로만 사용.
 */
public class BenchmarkRunner {
    private static final Random RNG = new Random(42);

    public static void main(String[] args) {
        benchmarkSorting();
        benchmarkSearching();
    }

    private static void benchmarkSorting() {
        System.out.println("== Sorting Benchmark ==");
        int n = 200_000;
        int[] base = randomArray(n);

        // 워밍업
        for (int i = 0; i < 3; i++) {
            int[] arr = Arrays.copyOf(base, base.length);
            Sorting.mergeSort(arr);
        }

        time("mergeSort", () -> {
            int[] arr = Arrays.copyOf(base, base.length);
            Sorting.mergeSort(arr);
        });

        time("quickSort", () -> {
            int[] arr = Arrays.copyOf(base, base.length);
            Sorting.quickSort(arr);
        });

        time("heapSort", () -> {
            int[] arr = Arrays.copyOf(base, base.length);
            Sorting.heapSort(arr);
        });
    }

    private static void benchmarkSearching() {
        System.out.println("== Searching Benchmark ==");
        int n = 5_000_000;
        int[] arr = sortedArray(n);
        int target = n - 10;

        // 워밍업
        for (int i = 0; i < 3; i++) Searching.binarySearch(arr, target);

        time("binarySearch", () -> Searching.binarySearch(arr, target));
        time("lowerBound", () -> Searching.lowerBound(arr, target));
        time("upperBound", () -> Searching.upperBound(arr, target));
    }

    private static void time(String name, Runnable r) {
        long start = System.nanoTime();
        r.run();
        long end = System.nanoTime();
        double ms = (end - start) / 1_000_000.0;
        System.out.printf("%s: %.3f ms%n", name, ms);
    }

    private static int[] randomArray(int n) {
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = RNG.nextInt();
        return arr;
    }

    private static int[] sortedArray(int n) {
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = i;
        return arr;
    }
}
