package com.dsatutor.problems;

import java.util.HashMap;
import java.util.Map;

/**
 * 선형 구조/배열 문제 모음.
 * 각 메서드는 문제 요약 + 핵심 아이디어 + 풀이를 포함.
 */
public final class ProblemSetLinear {
    private ProblemSetLinear() {}

    /**
     * Two Sum
     * - 배열에서 합이 target이 되는 두 인덱스 반환
     * - 해시맵으로 O(n) 해결
     */
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) {
                return new int[]{seen.get(need), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{-1, -1};
    }

    /**
     * 최대 부분 배열 합 (Kadane)
     * - 연속 부분 배열의 최대 합
     * - dp[i] = i에서 끝나는 최대 합
     */
    public static int maxSubarraySum(int[] nums) {
        int best = Integer.MIN_VALUE;
        int cur = 0;
        for (int x : nums) {
            cur = Math.max(x, cur + x);
            best = Math.max(best, cur);
        }
        return best;
    }

    /**
     * 고정 길이 슬라이딩 윈도우 최대 합
     * - 길이 k인 연속 부분 배열 합의 최댓값
     */
    public static int maxWindowSum(int[] nums, int k) {
        if (k <= 0 || k > nums.length) throw new IllegalArgumentException("bad k");
        int sum = 0;
        for (int i = 0; i < k; i++) sum += nums[i];
        int best = sum;
        for (int i = k; i < nums.length; i++) {
            sum += nums[i] - nums[i - k];
            if (sum > best) best = sum;
        }
        return best;
    }
}
