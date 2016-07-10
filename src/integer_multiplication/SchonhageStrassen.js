import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import {ceil_lg2} from "src/util/util.js"

/**
 * Multiplies two integers by using a number-theoretic transform to recurse into sqrt(N) multiplications of 2*sqrt(N)
 * size.
 * @param {!int | !BigInt} a
 * @param {!int | !BigInt} b
 * @param {undefined|!FermatRing=undefined} ring The ring to do the multiplication in. Defaults to the integers.
 * @returns {!BigInt} The product of a and b.
 * @complexity O(N lg(N) lg(lg(N)))
 */
function multiply_SchonhageStrassen(a, b, ring=undefined) {
    if (ring === undefined) {
        // Translate the integer multiplication into a ring multiplication.
        return multiply_SchonhageStrassen_integer(a, b);
    }
    a = ring.canonicalize(a);
    b = ring.canonicalize(b);

    // Base cases.
    if (ring.bit_capacity <= 8) {
        // The sub-multiplications wouldn't be smaller. Have to use a different strategy.
        return ring.canonicalize(multiply_integer_Karatsuba(a, b));
    }
    // (Although -1 is a value in the ring, it takes more than the bit capacity to store. So handle it special.)
    if (ring.isCongruentToNegativeOne(a)) { return ring.canonicalize(b.negate()); }
    if (ring.isCongruentToNegativeOne(b)) { return ring.canonicalize(a.negate()); }

    // Split into pieces.
    let inner_ring = FermatRing.for_convolving_values_of_size(ring.bit_capacity);
    let bits_per_piece = Math.ceil(ring.bit_capacity / inner_ring.principal_root_order);
    let piecesA = a.splitIntoNPiecesOfSize(inner_ring.principal_root_order, bits_per_piece);
    let piecesB = b.splitIntoNPiecesOfSize(inner_ring.principal_root_order, bits_per_piece);

    // Convolve pieces via fft.
    let inner_multiply = (a, b) => multiply_SchonhageStrassen(a, b, inner_ring);
    let piecesC = inner_ring.negacyclic_convolution(piecesA, piecesB, inner_multiply);

    // Perform carries.
    let combined = BigInt.shiftSum(piecesC, bits_per_piece);
    return ring.canonicalize(combined);
}

/**
 * Translates integer multiplication into multiplication modulo 2^(2^s), and returns the result.
 * @param {!int | !BigInt} a
 * @param {!int | !BigInt} b
 * @returns {!BigInt}
 */
function multiply_SchonhageStrassen_integer(a, b) {
    a = BigInt.of(a);
    b = BigInt.of(b);

    // Negative cases.
    if (a.isNegative()) { return multiply_SchonhageStrassen(a.negate(), b).negate(); }
    if (b.isNegative()) { return multiply_SchonhageStrassen(a, b.negate()).negate(); }

    // Pick a ring big enough that the multiplication won't wrap.
    let n = Math.max(a.size(), b.size());
    let s = ceil_lg2(n) + 2;
    let ring = new FermatRing(s);

    return multiply_SchonhageStrassen(a, b, ring);
}

export {multiply_SchonhageStrassen}
export default multiply_SchonhageStrassen;
