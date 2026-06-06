package com.tutor.library._2_clean_code.naming;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ============================================================
 * [2단계 - 클린 코드 원칙 1] 나쁜 네이밍 예시
 * ============================================================
 *
 * 좋은 코드의 첫 번째 조건: 이름만 봐도 무슨 뜻인지 알아야 한다.
 * 코드는 컴퓨터가 실행하지만, 사람이 읽는다.
 *
 * 나쁜 이름의 특징:
 * - 축약어 (a, b, c, tmp, d1, d2)
 * - 타입 정보를 이름에 포함 (strName, intCount, listData)
 * - 의미 없는 접두사 (the, a, an, my)
 * - 발음할 수 없는 이름 (genymdhms, cstmrId)
 * - 검색할 수 없는 단일 문자 (e, n, s)
 */
public class BadNamingExample {

    // 나쁜 예: 변수명이 한 글자
    // 이 변수가 뭘 의미하는지 전혀 알 수 없음
    private int d;
    private String s;
    private List<Object> list;

    // 나쁜 예: 축약어 + 타입 접두사
    // strUsrNm이 뭔지 알려면 다른 코드를 찾아봐야 함
    private String strUsrNm;
    private int intCnt;
    private boolean bFlg;

    // 나쁜 예: 발음할 수 없는 이름
    // 팀원과 코드 리뷰할 때 어떻게 읽지?
    private LocalDateTime genymdhms;  // generated year month day hour minute second
    private String cstmrId;            // customer id
    private int hp;                     // hit points? horsepower? helper?

    // 나쁜 예: 검색이 안 되는 단일 문자
    // 코드 검색(Ctrl+F)으로 'e'를 찾으면 온 코드가 다 나옴
    public void processData(List<Object> e, int n) {
        for (int i = 0; i < n; i++) {  // i, j, k는 반복문에서만 허용
            Object o = e.get(i);
            // o가 뭔지... 처리 로직이 뭔지...
        }
    }

    // 나쁜 예: 숫자로 구분하는 파라미터 이름
    // a1, a2가 각각 뭘 의미하는지 전혀 모름
    public void copyChars(char[] a1, char[] a2) {
        for (int i = 0; i < a1.length; i++) {
            a2[i] = a1[i];
        }
    }

    // 나쁜 예: 의미가 없는 noise word 포함
    // BookInfo와 BookData가 다른가? theBook과 aBook이 다른가?
    public void processBookInfo(Object theBook, Object bookData, Object bookInfo) {
        // 셋이 다 비슷한 이름인데 각각 뭘 의미하는지?
    }

    // 나쁜 예: 불린 변수에 부정어 사용
    // !isNotEnabled 를 읽을 때 뇌가 2번 부정을 처리해야 함
    private boolean isNotEnabled;
    private boolean wasNotDeleted;

    // 나쁜 예: 함수 이름이 동사 없이 명사만
    // manager()가 뭘 하는 건지?
    public Object manager() {
        return null;
    }

    // 나쁜 예: 너무 긴 이름도 문제
    // 이걸 매번 타이핑하면?
    public void theProcessOfRegisteringNewBookIntoTheLibrarySystem(Object bookRegistrationData) {
        // ...
    }
}
