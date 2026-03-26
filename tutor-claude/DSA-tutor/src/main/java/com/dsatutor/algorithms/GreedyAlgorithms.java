package com.dsatutor.algorithms;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 그리디 알고리즘 예시.
 */
public final class GreedyAlgorithms {
    private GreedyAlgorithms() {}

    /**
     * 활동 선택: 끝나는 시간이 빠른 순으로 선택 (최대 개수)
     * interval: [start, end]
     */
    public static List<int[]> activitySelection(List<int[]> intervals) {
        intervals.sort(Comparator.comparingInt(a -> a[1]));
        List<int[]> result = new ArrayList<>();
        int lastEnd = Integer.MIN_VALUE;
        for (int[] iv : intervals) {
            if (iv[0] >= lastEnd) {
                result.add(iv);
                lastEnd = iv[1];
            }
        }
        return result;
    }

    /**
     * 최소 회의실 개수: 스위프 라인 (그리디 + 정렬)
     */
    public static int minMeetingRooms(List<int[]> intervals) {
        int n = intervals.size();
        int[] starts = new int[n];
        int[] ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals.get(i)[0];
            ends[i] = intervals.get(i)[1];
        }
        java.util.Arrays.sort(starts);
        java.util.Arrays.sort(ends);
        int i = 0, j = 0, rooms = 0, maxRooms = 0;
        while (i < n) {
            if (starts[i] < ends[j]) {
                rooms++;
                maxRooms = Math.max(maxRooms, rooms);
                i++;
            } else {
                rooms--;
                j++;
            }
        }
        return maxRooms;
    }
}
