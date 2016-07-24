import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import {ceil_lg2, floor_lg2} from "src/util/util.js"

/**
 * Translates integer multiplication into multiplication modulo 2^(2^s), and returns the result.
 * @param {!int | !BigInt} a
 * @param {!int | !BigInt} b
 * @returns {!BigInt}
 */
function multiply_SchonhageStrassen(a, b) {
    a = BigInt.of(a);
    b = BigInt.of(b);
    if (a.isNegative()) {
        return multiply_SchonhageStrassen(a.negate(), b).negate();
    }
    if (b.isNegative()) {
        return multiply_SchonhageStrassen(a, b.negate()).negate();
    }
    let n = Math.max(a.size(), b.size()) * 2;
    let ring = new FermatRing(ceil_lg2(n), 1);
    return multiply_SchonhageStrassen_ring(a, b, ring);
}

/**
 * Multiplies two integers by using a number-theoretic transform to recurse into sqrt(N) multiplications of 2*sqrt(N)
 * size.
 * @param {!int | !BigInt} a
 * @param {!int | !BigInt} b
 * @param {!FermatRing} ring The ring to do the multiplication in. Defaults to the integers.
 * @returns {!BigInt} The product of a and b.
 * @complexity O(N lg(N) lg(lg(N)))
 */
function multiply_SchonhageStrassen_ring(a, b, ring) {
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
    let inner_ring = ring_for_size(ring.bit_capacity);
    let piece_count = inner_ring.principal_root_order;
    let bits_per_piece = ring.bit_capacity / piece_count;
    let piecesA = a.splitIntoNPiecesOfSize(piece_count, bits_per_piece);
    let piecesB = b.splitIntoNPiecesOfSize(piece_count, bits_per_piece);

    // Convolve pieces via fft.
    //let inner_multiply = (a, b) => multiply_SchonhageStrassen_ring(a, b, inner_ring);
    let inner_multiply = (a, b) => inner_ring.canonicalize(multiply_integer_Karatsuba(a, b));
    let piecesC = inner_ring.negacyclic_convolution(piecesA, piecesB, inner_multiply);

    // Perform carries.
    let combined = BigInt.shiftSum(piecesC, bits_per_piece);
    return ring.canonicalize(combined);
}

/**
 * @param {!int} bit_size
 * @returns {!FermatRing}
 * @complexity O(lg^2 n)
 */
function ring_for_size(bit_size) {
    let m = ceil_lg2(bit_size);
    let best = undefined;
    for (let s = m; s > 0; s--) {
        for (let p = Math.max(2, s); p <= 2*s; p++) {
            let r = new FermatRing(s, p - 1);
            let isSmaller = r.bit_capacity < bit_size;
            let hasRoom = r.bit_capacity >= Math.ceil(bit_size/r.principal_root_order)*2 + s + 1;
            if (isSmaller && hasRoom && (best === undefined || best.r.bit_capacity > r.bit_capacity)) {
                best = {p, s, r};
            }
        }
    }
    if (best === undefined) {
        throw new Error("Failed to find ring for size " + bit_size)
    }
    return best.r;
}

export {
    multiply_SchonhageStrassen,
    ring_for_size,
    multiply_SchonhageStrassen_ring
}
export default multiply_SchonhageStrassen;
