#include "mathx.h"

#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
    long a = (argc > 1) ? strtol(argv[1], NULL, 10) : 12;
    long b = (argc > 2) ? strtol(argv[2], NULL, 10) : 18;
    printf("gcd(%ld, %ld) = %ld\n", a, b, mathx_gcd(a, b));
    printf("lcm(%ld, %ld) = %ld\n", a, b, mathx_lcm(a, b));
    return 0;
}
