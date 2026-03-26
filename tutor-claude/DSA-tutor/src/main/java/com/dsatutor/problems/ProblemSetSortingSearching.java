package com.dsatutor.problems;

import java.util.Arrays;

/** 정렬/탐색 문제 모음. */
public final class ProblemSetSortingSearching {
    private ProblemSetSortingSearching() {}

    /**
     * K번째 작은 원소 (Quickselect)
     * - 평균 O(n)
     */
    public static int kthSmallest(int[] arr, int k) {
        if (k < 1 || k > arr.length) throw new IllegalArgumentException();
        int[] a = Arrays.copyOf(arr, arr.length);
        int lo = 0, hi = a.length - 1, target = k - 1;
        while (lo <= hi) {
            int p = partition(a, lo, hi);
            if (p == target) return a[p];
            if (p < target) lo = p + 1;
            else hi = p - 1;
        }
        return -1;
    }

    private static int partition(int[] a, int lo, int hi) {
        int pivot = a[hi];
        int i = lo;
        for (int j = lo; j < hi; j++) {
            if (a[j] <= pivot) {
                int t = a[i]; a[i] = a[j]; a[j] = t;
                i++;
            }
        }
        int t = a[i]; a[i] = a[hi]; a[hi] = t;
        return i;
    }

    /**
     * 정렬된 배열에서 특정 값의 개수
     * - lowerBound/upperBound 사용
     */
    public static int countOccurrences(int[] sorted, int target) {
        int lo = lowerBound(sorted, target);
        int hi = upperBound(sorted, target);
        return hi - lo;
    }

    private static int lowerBound(int[] arr, int target) {
        int l = 0, r = arr.length;
        while (l < r) {
            int m = l + (r - l) / 2;
            if (arr[m] < target) l = m + 1;
            else r = m;
        }
        return l;
    }

    private static int upperBound(int[] arr, int target) {
        int l = 0, r = arr.length;
        while (l < r) {
            int m = l + (r - l) / 2;
            if (arr[m] <= target) l = m + 1;
            else r = m;
        }
        return l;
    }
}
