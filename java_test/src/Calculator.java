//import java.math.BigDecimal;
//import java.util.*;
//
//public class Calculator {
//
//    static class Student {
//        private String name;
//        Student(String name) {
//            this.name = name;
//        }
//    }
//
//
//    class Solution {
//        public boolean containsDuplicate(int[] nums) {
//            String firstStr = "abc";
//            String secondStr = "cba";
//
//            String [] test = firstStr.split("");
//            String [] test2 = secondStr.split("");
//
//            List<String> listStrings = Arrays.stream(test).toList();
//
//
//            return false;
//        }
//    }
//
//    public static void main(String[] args) {
//        class Student {
//            private String name;
//
//            public Student(String name) {
//                this.name = name;
//            }
//
//            @Override
//            public boolean equals(Object obj) {
//                if (this == obj) return true;
//                if (obj == null || getClass() != obj.getClass()) return false;
//                Student that = (Student) obj;
//                return Objects.equals(name, that.name);
//            }
//
////            @Override
////            public int hashCode() {
////                return Objects.hash(name);
////            }
//        }
//
////        StringBuilder
//                StringBuffer
//
//
//        Set<Student> set = new HashSet<>();
//
//        Student student1 = new Student("Test");
//        Student student2 = new Student("Test");
//
//        set.add(student1);
//        set.add(student2);
//
//        // 결과 확인
//        System.out.println("Set의 크기는? " + set.size()); // 기대값: 1, 실제값: 2
//
//
////        Student student1 = new Student("Test");
////        Map<Student, String> gradeMap = new HashMap<>();
////        gradeMap.put(student1, "A");
////
////        Student student2 = new Student("Test");
////        System.out.println("GradeMap 조회 : " + gradeMap.get(student2)); // A 가 조회됨
////
////
////        System.identityHashCode("");
////        Student firstStudent = new Student("Test");
////        System.out.println("Object HashCode : " + firstStudent.hashCode());
////        System.out.println("System hashCode : " + System.identityHashCode(firstStudent));
////
////        Student secondStudent = new Student("Test");
////        Student thirdStudent = new Student("Test-1");
////
////        Set<Student> testSet = new HashSet<>();
////        testSet.add(firstStudent);
////        testSet.add(secondStudent);
////        System.out.println("Set Size : " + testSet.size());
////        System.out.println("Set Content : " + testSet);
////
////        System.out.println(firstStudent == secondStudent);
////        System.out.println(firstStudent.equals(secondStudent));
////
////        Map<Student, Student> map = new HashMap<>();
////        map.put(secondStudent, secondStudent);
////
////        System.out.println("Map Collection Get : " + map.get(firstStudent));
////        System.out.println(secondStudent.hashCode());
////        System.out.println(thirdStudent.hashCode());
////        class StudentTest {
////            private final String name;
////
////            StudentTest(String name) {
////                this.name = name;
////            }
////
////            @Override
////            public boolean equals(Object obj) {
////                if (this == obj) return true;
////                if (obj == null || getClass() != obj.getClass()) return false;
////                StudentTest that = (StudentTest) obj;
////                return Objects.equals(name, that.name);
////            }
////
////            @Override
////            public int hashCode() {
////                return Objects.hash(name);
////            }
////        }
////
////        StudentTest firstStudent = new StudentTest("Test");
////        Map<StudentTest, StudentTest> studentMap = new HashMap<>();
////        studentMap.put(firstStudent, firstStudent);
////
////        StudentTest secondStudent = new StudentTest("Test");
////        System.out.println("StudentMap Get Test : " + studentMap.get(secondStudent));
////        System.out.println("Contains Key Test : " + studentMap.containsKey(secondStudent));
////
////        StudentTest student1 = new StudentTest("Test");
////        StudentTest student2 = new StudentTest("Test");
////
////        Map<StudentTest, StudentTest> st1 = new HashMap<>();
////        st1.put(student1, student1);
////        st1.put(student2, student2);
////
////        System.out.println("st1 Hashcode : " + student1.hashCode());
////        System.out.println("st2 HashCode : " + student2.hashCode());
////        System.out.println("Map size : " + st1.size());
////        System.out.println("Map Content : " + st1.values());
////        System.out.println("Map Test Check : " + st1.toString());
////        System.out.println("== : " + (student1 == student2));
////        System.out.println("Equals : " + student1.equals(student2));
//
////        long testLong = (long) 3.12f;
////
////        float firstTest = (0.1f + 0.2f);
////        System.out.println("firstTest : " + firstTest);
////
////        double doubleTest = 0.1 + 0.2;
////        System.out.println("doubleTest : " + doubleTest);
////
////        int testA = 3 >> 1;   // 00000011  -> 0000 0001
////        System.out.println("testA : " + testA);
////
////        int testB = 3 >>> 1; // 00000011  -> 0000 0001
////        System.out.println("testB : " + testB);
////
////        int testC = 2 >> 1; // 00000010  -> 0000 0001
////        System.out.println("testC : " + testC);
////
////        int testD = 2 << 1; // 00000010  -> 0000 0100
////        System.out.println("testD : " + testD);
////
////        int testE = 3 << 1; // 00000011  -> 0000 0110
////        System.out.println("testE : " + testE);
////
////        int testF = 3 >> 2; // 00000011  -> 0000 0000
////        System.out.println("testF : " + testF);
////
////        int testZ = 3 << 2; // 00000011  -> 0000 1100
////        System.out.println("testZ : " + testZ);
////
////        int testK = 4 << 2; // 00000100  -> 0001 0000
////        System.out.println("testK : " + testK);
//
////        BigDecimal newBigDecimal = BigDecimal.valueOf((long) 0.1123123123123123123123312121111111111111123123123123123123123123, 120);
////        System.out.println("newBigDecimal : " + newBigDecimal);
//
////        // 1.1234568
////        float floatTest =1.123456789123456789f;
////        //  1.1234567891234568
////        double doubleTest = 1.123456789123456789123456789;
////
////        BigDecimal bigDecimalTest = new BigDecimal("1.123456789123456789123456789");
////
////        float firstFloat = 0.9f;
////        float secondFloat = 1.0f;
////        float resultFloat = secondFloat - firstFloat;
////
////        System.out.println("floatTest : " + floatTest);
////        System.out.println("doubleTest : " + doubleTest);
////        System.out.println("bigDecimalTest : " + bigDecimalTest);
////        System.out.println("resultFloat : " + resultFloat);
//
//
////        public class PrecisionTest {
////            public static void main(String[] args) {
////                // f 접미사 필요 (4바이트)
////                float f = 1.234567890123456789f;
////                // 접미사 생략 가능 (8바이트)
////                double d = 1.234567890123456789;
////
////                System.out.println("float precision  : " + f); // 약 7자리 정밀도
////                System.out.println("double precision : " + d); // 약 15~16자리 정밀도
////            }
////        }
//    }
//
//    public int add(int a, int b) throws ClassNotFoundException {
//        Class<?> clazz = Class.forName("java.lang.String");
//        clazz.getAnnotations();
//        clazz.getTypeParameters();
//
//
//        int[] numbers = {a, b};
////        int aaasd = null;
////        double testDouble = null;
//
//        return a + b;
//    }
//}
