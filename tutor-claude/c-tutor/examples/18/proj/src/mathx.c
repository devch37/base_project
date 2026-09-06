#include "mathx.h"

long mathx_gcd(long a, long b) {
    if (a < 0) a = -a;
    if (b < 0) b = -b;
    while (b) {
        long t = b;
        b = a % b;
        a = t;
    }
    return a;
}

long mathx_lcm(long a, long b) {
    long g = mathx_gcd(a, b);
    return g ? (a / g) * b : 0;
}
