import BigInt from "src/util/BigInt.js"

/**
 * Multiplies two integers by recursing into three half-sized multiplications.
 * @param {!int | !BigInt} a
 * @param {!int | !BigInt} b
 * @returns {!BigInt} The product of a and b.
 * @complexity O(N^1.585)
 */
function multiply_integer_Karatsuba(a, b) {
    a = BigInt.of(a);
    b = BigInt.of(b);

    // Base cases.
    if (a.isZero()) { return BigInt.ZERO; }
    if (a.isOne()) { return b; }
    if (a.isNegativeOne()) { return b.negate(); }

    // Split each into two halves.
    let n = Math.max(a.size(), b.size());
    let h = (n+1)>>1;
    let [a1, a2] = a.splitIntoNPiecesOfSize(2, h);
    let [b1, b2] = b.splitIntoNPiecesOfSize(2, h);

    // a*b = (a2<<h + a1)*(b2<<h + b1) = (a2*b2)<<2h + (a1*b2 + b2*a1)<<h + (a1*b1)
    // Multiplying the sums of the halves cuts the cost of getting a1*b2 + b2*a1 of two half-multiplications to one.
    // That changes the cost function of F(N) = 4F(N/2) + N to F(N) = 3F(N/2) + N, which is much better.

    // Recurse.
    let full = multiply_integer_Karatsuba(a1.plus(a2), b1.plus(b2));
    let a1b1 = multiply_integer_Karatsuba(a1, b1);
    let a2b2 = multiply_integer_Karatsuba(a2, b2);
    let a1b2_a2b1 = full.minus(a1b1).minus(a2b2);

    // Recombine.
    return a2b2.shift(h+h).
        plus(a1b2_a2b1.shift(h)).
        plus(a1b1);
}

export {multiply_integer_Karatsuba}
export default multiply_integer_Karatsuba;
