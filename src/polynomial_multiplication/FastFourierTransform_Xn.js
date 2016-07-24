import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"
import multiply_polynomial_Schoolbook from "src/polynomial_multiplication/Schoolbook.js"
import {ceil_lg2} from "src/util/util.js"

/**
 * Performs the multiplication via an FFT-based convolution using X as a 2N'th principal root of unity modulo X^N+1.
 * @param {!int | !BigInt | !Polynomial} a
 * @param {!int | !BigInt | !Polynomial} b
 * @param {Infinity|!int=Infinity} negativeDegreeExponent The k where X^(2^k) is congruent to -1, if any.
 * @returns {!Polynomial}
 * @complexity O(N lg(N) M(C + lg(N)))
 *     C is the size of coefficients
 *     N is the number of coefficients
 *     Base case has cost F(1, C) = M(C), where M is integer multiplication cost.
 *     Inductive case has cost F(N, C) = N lg(N) + sqrt(N) F(2 sqrt(N), C+lg(N)).
 *     Solves out to O(N lg(N) lg(lg(N)) + N lg(N) M(C+lg(N))).
 *       dominated by O(N lg(N) M(C+lg(N)))
 *
 *     So for N/lg(n) pieces of size lg(n) we have
 *       O(N M(lg(N)))
 */
function multiply_polynomial_FFT(a, b, negativeDegreeExponent=Infinity) {
    a = Polynomial.of(a);
    b = Polynomial.of(b);
    if (negativeDegreeExponent === Infinity) {
        negativeDegreeExponent = ceil_lg2(Math.max(a.degree(), b.degree()) + 1) + 1
    }
    if (Math.max(a.degree(), b.degree()) >= 1 << negativeDegreeExponent ) {
        throw new Error(`Coefficients past negative degree: (${a}) * (${b}) (mod X^(2^${negativeDegreeExponent}))+1`);
    }

    // Base case.
    if (negativeDegreeExponent < 4) {
        return multiply_polynomial_Schoolbook(a, b, multiply_integer_Schoolbook);
    }

    // Break into roughly sqrt(N) pieces, each with roughly sqrt(N) coefficients.
    let split = Math.ceil(negativeDegreeExponent/2);
    let pieceSize = 1 << split;
    let pieceCount = 1 << (negativeDegreeExponent - split);
    let piecesA = a.splitIntoNPiecesOfSize(pieceCount, pieceSize);
    let piecesB = b.splitIntoNPiecesOfSize(pieceCount, pieceSize);

    // Convolve the pieces.
    let innerNegativeExponent = split + 1;
    let innerMultiply = (p, q) => multiply_polynomial_FFT(p, q, innerNegativeExponent);
    let piecesC = Polynomial.negacyclic_convolution(piecesA, piecesB, innerNegativeExponent, innerMultiply);

    // Recombine.
    let c = Polynomial.shiftSum(piecesC, pieceSize);
    return c.modXnPlus1(1 << negativeDegreeExponent);
}

export default multiply_polynomial_FFT
export {multiply_polynomial_FFT}
