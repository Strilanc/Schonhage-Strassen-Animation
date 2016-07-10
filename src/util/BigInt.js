import {reversed_list} from "src/util/util.js"

/**
 * An integer that can be arbitrarily large.
 *
 * Uses a little-endian 2s-complement format, where -1 is stored as 111111111...[implicitly goes on forever]. The
 * 'tail' boolean is the forever-repeated bit that comes after the booleans in the finite bits array.
 *
 * NOTE: doesn't define a multiplication method.
 */
class BigInt {
    /**
     * @param {!Array.<!boolean>} bits
     * @param {!boolean} tail
     * @complexity O(N) where N is the number of bits
     */
    constructor(bits, tail) {
        // Canonicalize bits.
        let n = bits.length;
        while (n > 0 && bits[n-1] === tail) {
            n--;
        }
        if (n < bits.length) {
            bits = bits.slice(0, n);
        }

        /**
         * @type {!Array.<!boolean>}
         * @private
         */
        this._bits = bits;
        /**
         * @type {!!boolean}
         * @private
         */
        this._tail = tail;
    }

    /**
     * Wraps the given value into a BigInt, or just returns it if it's already a BigInt.
     * @param {!int | !BigInt} number
     * @returns {!BigInt}
     * @complexity O(1) if already BigInt, O(N) if native number of N bits
     */
    static of(number) {
        if (number instanceof BigInt) {
            return number;
        }
        if (Number.isInteger(number)) {
            let bits = [];
            let isNeg = number < 0;
            number = Math.abs(number);
            while (number > 0) {
                bits.push((number & 1) !== 0);
                number /= 2;
            }
            let m = new BigInt(bits, false);
            return isNeg ? m.negate() : m;
        }
        throw Error(`Not a number: (${typeof number}) ${number}`);
    }

    /**
     * @returns {!int} the number of specified bits, not counting the tail
     * @complexity O(1), technically O(lg(n))
     */
    size() {
        return this._bits.length;
    }

    /**
     * @returns {!boolean} The bit repeated forever at the end of this number.
     * @complexity O(1))
     */
    tail() {
        return this._tail;
    }

    /**
     * @returns {!boolean}
     * @complexity O(1)
     */
    isNegative() {
        return this._tail;
    }

    /**
     * @returns {!boolean}
     * @complexity O(1)
     */
    isPositive() {
        return !this._tail && this._bits.length > 0;
    }

    /**
     * @returns {!boolean}
     * @complexity O(1)
     */
    isZero() {
        return !this._tail && this._bits.length === 0;
    }

    /**
     * @returns {!boolean}
     * @complexity O(1)
     */
    isOne() {
        return !this._tail && this._bits.length === 1;
    }

    /**
     * @returns {!boolean}
     * @complexity O(1)
     */
    isNegativeOne() {
        return this._tail && this._bits.length === 0;
    }

    /**
     * Breaks the receiving integer into little-endian words of base 2^(bitsPerPiece).
     * @param {undefined|!int} pieceCount
     * @param {!int} bitsPerPiece
     * @returns {!Array.<!BigInt>}
     * @complexity O(N + P*B) where N is the bit-size, P is the piece count, B is the bits per piece
     */
    splitIntoNPiecesOfSize(pieceCount, bitsPerPiece) {
        let pieces = [];
        let offset = 0;
        while (pieceCount === undefined ? offset < this._bits.length : pieces.length < pieceCount) {
            let pieceTail = this._tail && pieces.length === pieceCount-1;

            let bits = this._bits.slice(offset, offset+bitsPerPiece);
            if (pieceTail !== this._tail) {
                while (bits.length < bitsPerPiece) {
                    bits.push(this._tail);
                }
            }

            pieces.push(new BigInt(bits, pieceTail));
            offset += bitsPerPiece;
        }
        if (offset < this._bits.length) {
            throw new Error("pieceCount*bitsPerPiece < this.size()");
        }
        return pieces;
    }

    /**
     * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} pieces
     * @param {!int} shiftPerPiece
     * @returns {!BigInt} the sum of the pieces, after scaling each piece by 2^(its index * shiftPerPiece).
     * @complexity O(N*(P/S)) where N is the bit-size of the result, P is the bit-size of pieces, and S is the shift.
     */
    static shiftSum(pieces, shiftPerPiece) {
        let bits = [];
        let carry = BigInt.ZERO;
        for (let piece of pieces) {
            let combo = carry.plus(piece);
            // Low bits go into result.
            for (let j = 0; j < shiftPerPiece; j++) {
                bits.push(combo.bit(j));
            }
            // High bits get carried.
            carry = combo.shift(-shiftPerPiece);
        }
        bits.push(...carry._bits);
        return new BigInt(bits, carry._tail);
    }

    /**
     * @param {!int} i The bit's index (the power of 2 it corresponds to).
     * @returns {!boolean}
     * @complexity O(1)
     */
    bit(i) {
        return i < this._bits.length ? this._bits[i] : this._tail;
    }

    /**
     * @returns {!BigInt}
     * @complexity O(N) where N is the number's bit-size
     */
    negate() {
        return new BigInt(this._bits.map(e => !e), !this._tail).plus(BigInt.ONE);
    }

    /**
     * @returns {!BigInt}
     */
    abs() {
        return this.isNegative() ? this.negate() : this;
    }

    /**
     * @param {!int | !BigInt} other
     * @param {!function(!boolean, !boolean):!boolean} op
     * @param {!int=0} extend
     * @returns {!BigInt}
     * @complexity O(N+extend) where N is the maximum bit-size of either number
     * @private
     */
    _bitwiseOperation(other, op, extend=0) {
        other = BigInt.of(other);
        let bits = [];
        let n = Math.max(this._bits.length, other._bits.length);
        for (let i = 0; i < n + extend; i++) {
            bits.push(op(this.bit(i), other.bit(i)));
        }
        return new BigInt(bits, op(this._tail, other._tail));
    }

    /**
     * @param {!int | !BigInt} other
     * @returns {!BigInt}
     * @complexity O(N) where N is the larger bit-size
     */
    bitwiseAnd(other) {
        return this._bitwiseOperation(other, (a, b) => a && b);
    }

    /**
     * @param {!int | !BigInt} other
     * @returns {!BigInt}
     * @complexity O(N) where N is the larger bit-size
     */
    bitwiseOr(other) {
        return this._bitwiseOperation(other, (a, b) => a || b);
    }

    /**
     * @param {!int | !BigInt} other
     * @returns {!BigInt}
     * @complexity O(N) where N is the larger bit-size
     */
    bitwiseXor(other) {
        return this._bitwiseOperation(other, (a, b) => a !== b);
    }

    /**
     * @param {!int | !BigInt} other
     * @returns {!BigInt}
     * @complexity O(N) where N is the larger bit-size
     */
    plus(other) {
        let c = false;
        return this._bitwiseOperation(other, (a, b) => {
            let s = (a?1:0) + (b?1:0) + (c?1:0);
            c = (s & 2) !== 0;
            return (s & 1) !== 0;
        }, +1);
    }

    /**
     * @param {!int | !BigInt} other
     * @returns {!BigInt}
     * @complexity O(N) where N is the larger bit-size
     */
    minus(other) {
        let c = false;
        return this._bitwiseOperation(other, (a, b) => {
            let s = (a?1:0) - (b?1:0) - (c?1:0);
            c = (s & 2) !== 0;
            return (s & 1) !== 0;
        }, +1);
    }

    /**
     * @param {!int} amount
     * @returns {!BigInt}
     * @complexity O(N+amount)
     */
    shift(amount) {
        let result = [];
        for (let i = 0; i < amount; i++) {
            result.push(false);
        }
        for (let i = Math.max(0, -amount); i < this._bits.length; i++) {
            result.push(this._bits[i]);
        }
        return new BigInt(result, this._tail);
    }

    /**
     * @returns {!BigInt}
     * @complexity O(N)
     * @private
     */
    _times10() {
        return this.shift(3).plus(this.shift(1));
    }

    /**
     * @param {!string} base10Text
     * @returns {!BigInt}
     * @complexity O(N^2) where N is the length of the string
     */
    static parse(base10Text) {
        if (base10Text.length === 0) {
            throw new Error("empty string");
        }
        let isNeg = base10Text.startsWith('-');
        if (isNeg) {
            base10Text = base10Text.slice(1);
        }
        let result = BigInt.ZERO;
        for (let i = 0; i < base10Text.length; i++) {
            let r = "0123456789".indexOf(base10Text[i]);
            if (r === -1) {
                throw new Error("bad string: " + base10Text);
            }
            result = result._times10().plus(r);
        }
        return isNeg ? result.negate() : result;
    }

    /**
     * Returns a value sampled randomly of the range [0, 2^bit_count).
     * @param {!int} bit_count
     * @returns {!BigInt}
     */
    static random(bit_count) {
        let bits = [];
        while (bits.length < bit_count) {
            bits.push(Math.random() < 0.5);
        }
        return new BigInt(bits, false);
    }

    /**
     * @returns {!number}
     * @complexity O(N) where N is the bit-size of the number
     */
    toJavascriptNumber(fail_on_lost_precision=true) {
        if (this.isNegative()) {
            return -this.negate().toJavascriptNumber();
        }
        let t = 0;
        for (let b of reversed_list(this._bits)) {
            t *= 2;
            t += b ? 1 : 0;
        }
        if (fail_on_lost_precision && !this.isEqualTo(t)) {
            throw new Error("lost precision")
        }
        return t;
    }

    /**
     * @returns {!string}
     * @complexity O(N)
     */
    toTwosComplementString() {
        if (this.isZero()) {
            return "0";
        }
        return (this._tail ? "[..11]" : "") + reversed_list(this._bits).map(e => e ? "1" : "0").join("");
    }

    /**
     * @returns {!string} A base-10 representation of the number.
     * @complexity O(N^2) where N is the bit-size of the number
     */
    toString() {
        if (this.isZero()) {
            return "0";
        }
        if (this.isNegative()) {
            return "-" + this.negate().toString();
        }

        // find high enough power
        let powers = [];
        for (let p = BigInt.ONE; !p.minus(this).isPositive(); p = p._times10()) {
            powers.push(p);
        }

        // long division
        let result = [];
        let v = this;
        for (let p of reversed_list(powers)) {
            let k = 0;
            while (!v.minus(p).isNegative()) {
                v = v.minus(p);
                k++;
            }
            result.push(k);
        }

        return result.join('');
    }

    /**
     * @param {!BigInt|!int|*} other
     * @returns {!boolean}
     * @complexity O(N)
     */
    isEqualTo(other) {
        if (Number.isInteger(other)) {
            other = BigInt.of(other);
        }

        if (!(other instanceof BigInt)) {
            //noinspection JSUnresolvedVariable,JSUnresolvedFunction
            return other.isEqualTo_BigInt !== undefined && other.isEqualTo_BigInt(this);
        }

        if (this._tail !== other._tail || this._bits.length !== other._bits.length) {
            return false;
        }
        for (let i = 0; i < this._bits.length; i++) {
            if (this._bits[i] !== other._bits[i]) {
                return false;
            }
        }
        return true;
    }
}

BigInt.ONE = new BigInt([true], false);
BigInt.ZERO = new BigInt([], false);
BigInt.MINUS_ONE = new BigInt([], true);

export default BigInt;
export { BigInt }
