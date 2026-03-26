package com.dsatutor.algorithms;

/**
 * 이진 탐색 계열.
 * 정렬된 배열에 대해 O(log n).
 */
public final class Searching {
    private Searching() {}

    public static int binarySearch(int[] arr, int target) {
        int lo = 0, hi = arr.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }

    /**
     * lowerBound: target 이상이 처음 등장하는 인덱스
     * 존재하지 않으면 arr.length 반환
     */
    public static int lowerBound(int[] arr, int target) {
        int lo = 0, hi = arr.length; // hi는 열린 구간
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /**
     * upperBound: target 초과가 처음 등장하는 인덱스
     */
    public static int upperBound(int[] arr, int target) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
