# DSA-tutor (Java)

시니어 개발자 기준으로 DSA(자료구조/알고리즘) 기본기와 수학적 배경을 함께 정리한 학습용 프로젝트입니다.
코드마다 **왜 그렇게 동작하는지**와 **어떤 상황에서 쓰는지**를 주석으로 설명합니다.

## 목표
- 기본기 탄탄: Big-O, 수학적 직관, 자료구조 원리, 알고리즘 패턴
- 실무 연결: 트레이드오프, 복잡도, 성능/메모리 고려
- 면접/코딩테스트: 대표 문제 풀이 패턴과 구현 능력

## 구조
- `com.dsatutor.fundamentals` : Big-O, 수학/확률, 불변식, 증명 스케치
- `com.dsatutor.structures` : 배열/리스트/스택/큐/해시/트리/힙/트라이/그래프/유니온파인드/AVL/Red-Black/Segment/Fenwick
- `com.dsatutor.algorithms` : 정렬/검색/그래프/DP/그리디/백트래킹/문자열/수학 알고리즘
- `com.dsatutor.problems` : 챕터별 실전 문제 + 해설 포함
- `com.dsatutor.benchmarks` : 간단 성능 비교 벤치마크
- `com.dsatutor.playground` : 간단한 데모 실행

## 실행
Gradle이 설치되어 있다면:
```bash
gradle run
```

Gradle 없이 실행:
```bash
javac -d out $(find src/main/java -name "*.java")
java -cp out com.dsatutor.playground.Main
```

## 벤치마크 실행
```bash
javac -d out $(find src/main/java -name "*.java")
java -cp out com.dsatutor.benchmarks.BenchmarkRunner
```

## 추천 학습 순서
1. Big-O & 수학 기초 (`fundamentals`)
2. 선형 구조 (`structures`)
3. 정렬/검색 (`algorithms.sorting`, `algorithms.searching`)
4. 트리/힙/해시 (`structures.tree`, `structures.heap`, `structures.hash`)
5. 그래프 (`structures.graph`, `algorithms.graph`)
6. DP/그리디/백트래킹
7. 문자열/수학 알고리즘

## 참고
- 코드 주석을 먼저 읽고, 직접 손으로 작은 입력을 따라가 보세요.
- 각 알고리즘에 대해 `시간복잡도/공간복잡도/트레이드오프`를 메모하세요.
