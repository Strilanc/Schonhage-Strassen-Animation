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
    let n = Math.max(a.size(), b.size());
    if (n <= 32) {
        return multiply_integer_Karatsuba(a, b);
    }
    let ring = ring_for_multiplying_integers_of_size(n);
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
    if (ring.bit_capacity <= 64) {
        // The sub-multiplications wouldn't be smaller. Have to use a different strategy.
        return ring.canonicalize(multiply_integer_Karatsuba(a, b));
    }
    // (Although -1 is a value in the ring, it takes more than the bit capacity to store. So handle it special.)
    if (ring.isCongruentToNegativeOne(a)) { return ring.canonicalize(b.negate()); }
    if (ring.isCongruentToNegativeOne(b)) { return ring.canonicalize(a.negate()); }

    // Split into pieces.
    let {inner_ring, piece_count_exponent} = sub_parameters_for_multiplying_values_in_ring(ring);
    let bits_per_piece = ring.bit_capacity >> piece_count_exponent;
    let piece_count = 1 << piece_count_exponent;
    let piecesA = a.splitIntoNPiecesOfSize(piece_count, bits_per_piece);
    let piecesB = b.splitIntoNPiecesOfSize(piece_count, bits_per_piece);

    let d = inner_ring.principal_root_exponent - piece_count_exponent + 1;
    let actual_inner_ring = new FermatRing(inner_ring.principal_root_exponent - d, inner_ring.bit_padding_factor << d);

    // Convolve pieces via fft.
    let inner_multiply = (a, b) => multiply_SchonhageStrassen_ring(a, b, inner_ring);
    //let inner_multiply = (a, b) => inner_ring.canonicalize(multiply_integer_Karatsuba(a, b));
    let piecesC = actual_inner_ring.negacyclic_convolution(piecesA, piecesB, inner_multiply);

    // Perform carries.
    let combined = BigInt.shiftSum(piecesC, bits_per_piece);
    return ring.canonicalize(combined);
}

/**
 * @param {!int} bit_size
 * @returns {!FermatRing}
 */
function ring_for_size(bit_size) {
    let s = ceil_lg2(bit_size);
    while (s >= 0) {
        let p = Math.ceil(bit_size / (1<<s));
        if (p >= 2 && s <= p && p <= 2*s) {
            let c = (p-1) * (1 << s);
            if (c < bit_size && c*(2<<s) >= bit_size + s + 1) {
                return new FermatRing(s, p - 1);
            }
        }
        s -= 1;
    }
    throw new Error("I can't even count that low." + bit_size)
}

/**
 * @param {!FermatRing} outer_ring
 * @return {!{piece_count_exponent: !int, inner_ring: !FermatRing}}
 */
function sub_parameters_for_multiplying_values_in_ring(outer_ring) {
    let s = outer_ring.principal_root_exponent;
    let p = outer_ring.bit_padding_factor + 1;
    if (s > p || p > 2*s) {
        throw Error("Bad starting ring.");
    }
    let s2 = Math.ceil(s/2) + 1;
    let p2 = Math.ceil(p/2) + 1;
    let piece_count_exponent = Math.floor(s/2) + 1;
    let inner_ring = new FermatRing(s2, p2 - 1);
    return {piece_count_exponent, inner_ring};
}

export {
    multiply_SchonhageStrassen,
    ring_for_size,
    multiply_SchonhageStrassen_ring,
    sub_parameters_for_multiplying_values_in_ring
}
export default multiply_SchonhageStrassen;
