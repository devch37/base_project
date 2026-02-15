package game;


import java.util.ArrayList;
import java.util.List;

/*
*           0,1,2 4,5,6
*           0,1     5,6
*           0         6
*           all
*                 *
*                ***
*               *****
*              *******
* */

public class AnnotationTestJava {

    public String test() { return ""; }
    private int test(int a) { return 0; }

    public static void main(String[] args) {
        for(int i = 0; i < 4; i++) {
            for (int j = 0; j < 7; j++) {
                int startIndex = 6 / 2;
                if (j >= startIndex - i && j <= startIndex + i) {
                    System.out.print("*");
                } else {
                    System.out.print(" ");
                }
            }
            System.out.println();
        }
    }
}
