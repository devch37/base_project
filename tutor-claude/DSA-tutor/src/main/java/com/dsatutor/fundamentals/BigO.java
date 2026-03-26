package com.dsatutor.fundamentals;

import java.util.Arrays;

/**
 * Big-O 직관을 코드로 체감하기 위한 예시 모음.
 *
 * 중요한 포인트:
 * - Big-O는 "입력 크기 n이 커질 때" 성능이 어떻게 변하는지 보는 척도
 * - 상수항/저차항은 제거, 지배항(가장 큰 성장률)만 남긴다
 * - 동일한 Big-O라도 실제 성능은 상수/캐시/메모리 접근에 크게 좌우된다
 */
public final class BigO {
    private BigO() {}

    /** O(1): 입력 크기와 무관하게 일정 시간 */
    public static int constantAccess(int[] arr, int index) {
        return arr[index];
    }

    /** O(n): 단일 루프, 모든 원소를 한 번씩 */
    public static int linearSum(int[] arr) {
        int sum = 0;
        for (int v : arr) {
            sum += v;
        }
        return sum;
    }

    /** O(n^2): 이중 루프, 모든 쌍 검사 */
    public static int countPairsLessThan(int[] arr, int target) {
        int count = 0;
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[i] + arr[j] < target) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * O(n log n): 정렬 + 선형 스캔
     * 정렬이 지배적이며, 비교정렬의 하한은 Ω(n log n).
     */
    public static boolean hasDuplicate(int[] arr) {
        int[] copy = Arrays.copyOf(arr, arr.length);
        Arrays.sort(copy); // O(n log n)
        for (int i = 1; i < copy.length; i++) { // O(n)
            if (copy[i] == copy[i - 1]) return true;
        }
        return false;
    }

    /**
     * O(log n): 이진 탐색
     * 매 단계에서 탐색 공간을 절반으로 줄인다.
     */
    public static int binarySearch(int[] sorted, int target) {
        int lo = 0, hi = sorted.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (sorted[mid] == target) return mid;
            if (sorted[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}
