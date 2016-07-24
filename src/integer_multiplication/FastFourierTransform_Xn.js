import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_polynomial_FFT from "src/polynomial_multiplication/FastFourierTransform_Xn.js"
import {ceil_lg2} from "src/util/util.js"

/**
 * Multiplies two integers by turning them into polynomials with logarithmic-sized coefficients, applying an FFT-based
 * polynomial multiplication where X^n ? -1 so X is a 2n'th root of unity, and recombining the resulting polynomial
 * into the result.
 *
 * @param {!int | !BigInt} a
 * @param {!int | !BigInt} b
 * @returns {!BigInt} The product of a and b.
 * @complexity O(N lg^2(N))
 */
function multiply_integer_FFT(a, b) {
    a = BigInt.of(a);
    b = BigInt.of(b);

    let n = Math.max(a.size(), b.size());
    let pieceSize = ceil_lg2(n) + 1;
    let pieceCount = Math.ceil(n/pieceSize);
    let poly = e => new Polynomial(e.splitIntoNPiecesOfSize(pieceCount, pieceSize));

    let polyA = poly(a);
    let polyB = poly(b);
    let polyC = multiply_polynomial_FFT(polyA, polyB);
    return BigInt.shiftSum(polyC._coefficients, pieceSize);
}

export default multiply_integer_FFT;
export {multiply_integer_FFT}
