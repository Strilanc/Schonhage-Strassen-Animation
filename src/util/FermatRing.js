import BigInt from "src/util/BigInt.js"
import {repeat, splice_bit, swap_index_bit_orders, proper_mod, floor_lg2, ceil_lg2} from "src/util/util.js"

/**
 * The integers modulo 2^(m 2^k) + 1, where 2^m is a 2^k'th principal root of unity.
 */
class FermatRing {
    /**
     * @param {!int} principal_root_of_unity_exponent We want a root of unity with order 2^{this number}.
     *
     * @param {!int} padding_factor Some extra space made up of bits not contributing to the principal root order.
     *               Useful because it doesn't have to be a power of 2.
     */
    constructor(principal_root_of_unity_exponent, padding_factor=1) {
        /**
         * @type {!int}
         */
        this.principal_root_exponent = principal_root_of_unity_exponent;
        /**
         * The number of bits that you can store in a value of the ring (ignoring the -1 spot).
         * @type {!int}
         */
        this.bit_capacity = padding_factor * (1 << principal_root_of_unity_exponent);
        /**
         * This is the principal root that we'll be performing FFTs with.
         * @type {!BigInt}
         */
        this.principal_root = BigInt.ONE.shift(padding_factor);
        /**
         * The number of times you have to multiply by the principal root to get back to 1.
         * (The root is always a power of 2, and its order is also always a power of 2.)
         * @type {!int}
         */
        this.principal_root_order = 2 << principal_root_of_unity_exponent;
        /**
         * Some extra space made up of bits not contributing to the principal root order.
         * Only useful because it doesn't have to be a power of 2.
         * @type {!int}
         */
        this.bit_padding_factor = padding_factor;
        /**
         * We're working in the integers modulo this number.
         * @type {!BigInt}
         */
        this.divisor = BigInt.ONE.shift(this.bit_capacity).plus(1);
    }

    /**
     * @param {!int | !BigInt} val
     * @returns {!BigInt} smallest non-negative integer congruent to the given value in the receiving ring.
     * @complexity O(N+W) where N is the bit-size of the input and W is the bit-size of the ring.
     */
    canonicalize(val) {
        val = BigInt.of(val);

        // Use the fact that 2^W = -1 to split the input into W-bit pieces to be added/subtracted.
        let remainder = BigInt.ZERO;
        let pieceCount = Math.max(1, Math.ceil(val.size() / this.bit_capacity)) + 1;
        let pieces = val.splitIntoNPiecesOfSize(pieceCount, this.bit_capacity);
        for (let i = 0; i < pieces.length; i++) {
            if ((i & 1) === 0) {
                remainder = remainder.plus(pieces[i]);
            } else {
                remainder = remainder.minus(pieces[i]);
            }
        }

        // We're a lot closer now, but maybe not quite there.
        if (remainder.isNegative() || !remainder.minus(this.divisor).isNegative()) {
            return this.canonicalize(remainder);
        }

        return remainder;
    }

    /**
     * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} list1
     * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} list2
     * @param {!function(!BigInt, !BigInt) : !BigInt} item_multiplier
     * @returns {!Array.<!BigInt>} the cyclic convolution of two lists
     * @complexity O(W*N*lg(N) + N*M(W)) where N is the list length, W=N is the ring's bit-size, and M(W) is the
     * complexity of the given multiplication function when applied to items of size W.
     */
    cyclic_convolution(list1, list2, item_multiplier) {
        if (list1.length !== this.principal_root_order) {
            throw new Error(`bad length ${list1.length} !== ${this.principal_root_order}`)
        }
        if (list2.length !== this.principal_root_order) {
            throw new Error(`bad length ${list2.length} !== ${this.principal_root_order}`)
        }
        list1 = list1.map(BigInt.of);
        list2 = list2.map(BigInt.of);

        let c1 = this.fft(list1);
        let c2 = this.fft(list2);
        let c3 = [];
        for (let i = 0; i < c1.length; i++) {
            c3.push(this.canonicalize(item_multiplier(c1[i], c2[i])));
        }
        return this.inverse_fft(c3);
    }

    /**
     *
     * @param {!Array.<!BigInt>} list
     * @param {!number} factor Direction and strength of the gradient (half-integer or integer).
     * @returns {!Array.<!BigInt>}
     * @complexity O(N*F)
     */
    _phase_gradient(list, factor) {
        let result = [];
        let p = 0;
        for (let item of list) {
            result.push(this._times2RaisedTo(item, p));
            p += factor;
        }
        return result;
    }

    /**
     * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} list1
     * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} list2
     * @param {!function(!BigInt, !BigInt) : !BigInt} item_multiplier
     * @returns {!Array.<!BigInt>} the negacyclic convolution of two lists
     * @complexity O(W*N*lg(N) + N*M(W)) where N is the list length, W=N is the ring's bit-size, and M(W) is the
     * complexity of the given multiplication function when applied to items of size W.
     */
    negacyclic_convolution(list1, list2, item_multiplier) {
        if (list1.length !== this.principal_root_order) {
            throw new Error(`bad length ${list1.length} !== ${this.principal_root_order}`)
        }
        if (list2.length !== this.principal_root_order) {
            throw new Error(`bad length ${list2.length} !== ${this.principal_root_order}`)
        }
        list1 = list1.map(BigInt.of);
        list2 = list2.map(BigInt.of);
        let r = this.bit_capacity / this.principal_root_order;

        list1 = this._phase_gradient(list1, r);
        list2 = this._phase_gradient(list2, r);
        let result = this.cyclic_convolution(list1, list2, item_multiplier);
        return this._phase_gradient(result, -r);
    }

    /**
     * Determines if the given value is congruent to negative one.
     * @param {!int | !BigInt} value
     * @returns {!boolean}
     * @complexity O(N + W)
     */
    isCongruentToNegativeOne(value) {
        return this.canonicalize(value).bit_capacity > this.bit_capacity;

    }

    /**
     * Returns a randomly sampled value of the ring.
     * @returns {!BigInt}
     */
    random() {
        return this.canonicalize(BigInt.random(this.bit_capacity + 3));
    }

    /**
     * Returns a vector with as many random items as the principal root order of the field.
     * @returns {!Array.<!BigInt>}
     */
    randomVector() {
        let result = [];
        while (result.length < this.principal_root_order) {
            result.push(this.random());
        }
        return result;
    }

    /**
     * @param {!Array.<!BigInt>} list A list of values of this ring. (Values should be canonicalized.)
     * @returns {!Array.<!BigInt>}
     * @complexity O(W*N*log(N+W)) where N is the number of list items, W is the ring's bit-size, and N=2*W.
     */
    fft(list) {
        if (list.length !== this.principal_root_order) {
            throw new Error(`bad length ${list.length} !== ${this.principal_root_order}`)
        }
        list = list.map(BigInt.of);

        // Iterative Cooley-Tukey FFT algorithm
        //   Based on this quantum-fourier-transform circuit:
        //
        //     ---#---#---#---#---#-H-x-----
        //     ---#---#---#---#-H-•---|-x---
        //     ---#---#---#-H-•-------|-|-x-
        //     ---#---#-H-•-----------|-|-x-
        //     ---#-H-•---------------|-x---
        //     -H-•-------------------x-----
        //                             etc
        //     Legend:
        //        H  = Hadamard [i.e. a,b -> a+b,a-b]
        //        •  = Control
        //       ### = Phase gradient
        //       x-x  = Swap

        for (let i = this.principal_root_exponent; i >= 0; i--) {
            list = this._fft_helper_hadamard(list, i);
            list = this._fft_helper_controlled_phase_gradient_below(list, i, +1);
        }
        return swap_index_bit_orders(list);
    }

    /**
     * @param {!Array.<!BigInt>} list A list of values of this ring. (Values should be canonicalized.)
     * @returns {!Array.<!BigInt>}
     * @complexity O(W*N*log(N+W)) where N is the number of list items, W is the ring's bit-size, and N=2*W.
     */
    inverse_fft(list) {
        if (list.length !== this.principal_root_order) {
            throw new Error(`bad length ${list.length} !== ${this.principal_root_order}`)
        }
        list = swap_index_bit_orders(list.map(BigInt.of));

        // Iterative Cooley-Tukey FFT algorithm (inverse of what's in fft).
        for (let i = 0; i <= this.principal_root_exponent; i++) {
            list = this._fft_helper_controlled_phase_gradient_below(list, i, -1);
            list = this._fft_helper_hadamard(list, i);
        }

        // Cancel the accumulated factors of 2 of all the Hadamard-ing.
        return list.map(e => this._times2RaisedTo(e, -this.principal_root_exponent-1));
    }

    /**
     * @param {!Array.<!BigInt>} list
     * @param {!int} target_bit_index
     * @returns {!Array.<!BigInt>}
     * @complexity O(N*W) where N is the number of list items and W is the bit-size of the ring.
     */
    _fft_helper_hadamard(list, target_bit_index) {
        if (list.length !== this.principal_root_order) {
            throw new Error(`bad length ${list.length} !== ${this.principal_root_order}`)
        }
        list = list.map(BigInt.of);

        let result = repeat(undefined, this.principal_root_order);
        for (let other_bits = 0; other_bits < (this.principal_root_order>>1); other_bits++) {
            let a = splice_bit(other_bits, target_bit_index, false);
            let b = splice_bit(other_bits, target_bit_index, true);
            let [va, vb] = [list[a], list[b]];
            let [ha, hb] = [va.plus(vb), va.minus(vb)].map(e => this.canonicalize(e));
            [result[a], result[b]] = [ha, hb]
        }
        return result;
    }

    /**
     * @param {!Array.<!BigInt>} list
     * @param {!int} control_bit_index
     * @param {!int} sign The direction (+1 or -1) of the gradient.
     * @returns {!Array.<!BigInt>}
     * @complexity O(N*W) where N is the number of list items and W is the bit-size of the ring.
     */
    _fft_helper_controlled_phase_gradient_below(list, control_bit_index, sign) {
        let controlBitMask = 1 << control_bit_index;
        let lowMask = controlBitMask - 1;
        let gradientPower = this.principal_root_exponent - control_bit_index;
        let result = [];
        for (let i = 0; i < list.length; i++) {
            let low = i & lowMask;
            let control = (i & controlBitMask) !== 0;
            let localGradient = control ? low << gradientPower : 0;
            result.push(this._times2RaisedTo(list[i], localGradient * this.bit_padding_factor * sign));
        }
        return result;
    }

    /**
     * @param {!BigInt | !int} value A canonicalized value of the receiving ring.
     * @param {!number} exponent Half-integer or integer.
     * @returns {!BigInt}
     * @complexity O(W) where W is the bit-size of the ring
     */
    _times2RaisedTo(value, exponent) {
        // Square root of 2 trick.
        if (exponent % 1 !== 0) {
            if (proper_mod(exponent, 1) !== 0.5) {
                throw new Error(`bad exponent ${exponent}`);
            }
            if (this.bit_capacity % 4 !== 0) {
                throw new Error(`bad exponent ${exponent} (sqrt 2 trick won't work in ${this})`);
            }
            let q = this.bit_capacity / 4;
            let v = this._times2RaisedTo(value, q).plus(this._times2RaisedTo(value, -q));
            return this._times2RaisedTo(v, Math.floor(exponent));
        }

        value = BigInt.of(value);
        let equivalent_exponent = proper_mod(exponent, this.bit_capacity<<1);
        return this.canonicalize(value.shift(equivalent_exponent));
    }

    /**
     * @returns {!string}
     */
    toString() {
        return `Z mod 2^(${this.bit_padding_factor}*2^${this.principal_root_exponent}) + 1`
    }

    /**
     * @param {!int} input_size
     * @returns {!FermatRing} A ring that has large enough pieces and principal root order to convolve a broken up value
     * of the receiving ring.
     */
    static for_convolving_values_of_size(input_size) {
        throw new Error("NOT CORRECT YET");
        //let best = undefined;
        //for (let f of [1, 2, 4, 8, 16]) {
        //    let min_s = Math.max(0, Math.floor(floor_lg2(input_size / f)/2) - 1);
        //    let max_s = ceil_lg2(input_size / f);
        //    for (let s = min_s; s <= max_s; s++) {
        //        let cap = f*(1<<s);
        //        let count = 2<<s;
        //        let piece = Math.ceil(input_size/count);
        //        let used = piece*2 + s + 1;
        //        if (used <= cap && cap < input_size) {
        //            let efficiency = used / cap;
        //            if (best === undefined || efficiency > best.efficiency) {
        //                best = {efficiency, f, s};
        //                break;
        //            }
        //        }
        //    }
        //}
        //if (best === undefined) {
        //    throw new Error(`Failed to make progress on ${input_size}.`)
        //}
        //return new FermatRing(best.s, best.f);
    }
}

export default FermatRing;
export {FermatRing}
