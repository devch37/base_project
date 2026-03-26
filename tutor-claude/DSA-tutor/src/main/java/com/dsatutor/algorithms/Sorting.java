package com.dsatutor.algorithms;

/**
 * 대표 정렬 알고리즘 모음.
 */
public final class Sorting {
    private Sorting() {}

    public static void bubbleSort(int[] arr) {
        boolean swapped = true;
        for (int i = 0; i < arr.length - 1 && swapped; i++) {
            swapped = false;
            for (int j = 0; j < arr.length - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    swap(arr, j, j + 1);
                    swapped = true;
                }
            }
        }
    }

    public static void insertionSort(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

    public static void selectionSort(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            int min = i;
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[j] < arr[min]) min = j;
            }
            swap(arr, i, min);
        }
    }

    /** Merge Sort: 안정적, O(n log n), 추가 메모리 O(n) */
    public static void mergeSort(int[] arr) {
        int[] tmp = new int[arr.length];
        mergeSort(arr, tmp, 0, arr.length - 1);
    }

    private static void mergeSort(int[] arr, int[] tmp, int lo, int hi) {
        if (lo >= hi) return;
        int mid = lo + (hi - lo) / 2;
        mergeSort(arr, tmp, lo, mid);
        mergeSort(arr, tmp, mid + 1, hi);
        merge(arr, tmp, lo, mid, hi);
    }

    private static void merge(int[] arr, int[] tmp, int lo, int mid, int hi) {
        int i = lo, j = mid + 1, k = lo;
        while (i <= mid && j <= hi) {
            if (arr[i] <= arr[j]) tmp[k++] = arr[i++];
            else tmp[k++] = arr[j++];
        }
        while (i <= mid) tmp[k++] = arr[i++];
        while (j <= hi) tmp[k++] = arr[j++];
        for (int p = lo; p <= hi; p++) arr[p] = tmp[p];
    }

    /** Quick Sort: 평균 O(n log n), 최악 O(n^2). In-place */
    public static void quickSort(int[] arr) {
        quickSort(arr, 0, arr.length - 1);
    }

    private static void quickSort(int[] arr, int lo, int hi) {
        if (lo >= hi) return;
        int pivot = arr[lo + (hi - lo) / 2];
        int i = lo, j = hi;
        while (i <= j) {
            while (arr[i] < pivot) i++;
            while (arr[j] > pivot) j--;
            if (i <= j) {
                swap(arr, i, j);
                i++; j--;
            }
        }
        if (lo < j) quickSort(arr, lo, j);
        if (i < hi) quickSort(arr, i, hi);
    }

    /** Heap Sort: O(n log n), in-place, 불안정 */
    public static void heapSort(int[] arr) {
        // 최대 힙 구성
        for (int i = arr.length / 2 - 1; i >= 0; i--) {
            siftDown(arr, i, arr.length);
        }
        for (int end = arr.length - 1; end > 0; end--) {
            swap(arr, 0, end);
            siftDown(arr, 0, end);
        }
    }

    private static void siftDown(int[] arr, int idx, int size) {
        int cur = idx;
        while (true) {
            int left = cur * 2 + 1;
            int right = left + 1;
            if (left >= size) break;
            int larger = left;
            if (right < size && arr[right] > arr[left]) larger = right;
            if (arr[cur] >= arr[larger]) break;
            swap(arr, cur, larger);
            cur = larger;
        }
    }

    /** Counting Sort: O(n + k), k는 값 범위. 음수는 처리 안 함 */
    public static int[] countingSort(int[] arr, int maxValue) {
        int[] count = new int[maxValue + 1];
        for (int v : arr) count[v]++;
        int[] out = new int[arr.length];
        int idx = 0;
        for (int v = 0; v <= maxValue; v++) {
            while (count[v]-- > 0) out[idx++] = v;
        }
        return out;
    }

    private static void swap(int[] arr, int i, int j) {
        if (i == j) return;
        int t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
    }
}
