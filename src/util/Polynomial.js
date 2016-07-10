import BigInt from "src/util/BigInt.js"
import {reversed_list, exact_lg2, swap_index_bit_orders, splice_bit, repeat} from "src/util/util.js"

class Polynomial {
    /**
     * @param {!Array.<!BigInt> | !Array.<!int> | !Array.<!BigInt | !int>} coefficients
     */
    constructor(coefficients) {
        if (!Array.isArray(coefficients) || !coefficients.every(e => Number.isInteger(e) || e instanceof BigInt)) {
            throw new Error("Invalid coefficients");
        }
        coefficients = coefficients.map(BigInt.of);

        let n = coefficients.length;
        while (n > 0 && coefficients[n-1].isZero()) {
            n--;
        }
        coefficients.splice(n, coefficients.length - n);

        /**
         * @type {!Array.<!BigInt>}
         */
        this._coefficients = coefficients.map(BigInt.of);
    }

    /**
     * @returns {!int}
     */
    degree() {
        return this._coefficients.length - 1;
    }

    /**
     * @param {!Polynomial|!int|!BigInt|*} other
     * @returns {!boolean}
     * @complexity O(N)
     */
    isEqualTo(other) {
        if (other instanceof BigInt || Number.isInteger(other)) {
            return this._coefficients.length <= 1 && this.coefficient(0).isEqualTo(other);
        }

        if (!(other instanceof Polynomial)) {
            //noinspection JSUnresolvedVariable,JSUnresolvedFunction
            return other.isEqualTo_Polynomial !== undefined && other.isEqualTo_Polynomial(this);
        }

        if (this._coefficients.length !== other._coefficients.length) {
            return false;
        }
        for (let i = 0; i < this._coefficients.length; i++) {
            if (!this._coefficients[i].isEqualTo(other._coefficients[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * @param {!BigInt} other
     * @returns {!boolean}
     */
    isEqualTo_BigInt(other) {
        return this.isEqualTo(other);
    }

    /**
     * @returns {!string}
     */
    toString() {
        if (this._coefficients.length === 0) {
            return "0";
        }
        let r = [];
        for (let i = 0; i < this._coefficients.length; i++) {
            let c = this._coefficients[i];
            if (c.isZero()) {
                continue;
            }
            let suffix = i === 0 ? "" :
                i === 1 ? "X" :
                "X^"+i;
            let prefix = suffix === "" ? c.toString() :
                c.isOne() ? "" :
                c.isNegativeOne() ? "-" :
                c.toString() + "*";
            r.push(prefix + suffix);
        }
        return reversed_list(r).join(" + ").split(" + -").join(" - ");
    }

    /**
     * @param {!int | !BigInt | !Polynomial} value
     * @returns {!Polynomial} The given value as a polynomial.
     */
    static of(value) {
        return value instanceof Polynomial ? value : new Polynomial([value]);
    }

    /**
     * @param {!int | !BigInt} bigEndianCoefficients Coefficients in largest-degree-first order.
     * @returns {!Polynomial}
     */
    static ofCoefs(...bigEndianCoefficients) {
        return new Polynomial(reversed_list(bigEndianCoefficients));
    }

    /**
     * @param {!int} power
     * @returns {!Polynomial}
     */
    static XToThe(power) {
        let coefs = repeat(0, power);
        coefs.push(1);
        return new Polynomial(coefs);
    }

    /**
     * Breaks the receiving integer into little-endian words of base 2^(coefsPerPiece).
     * @param {undefined|!int} pieceCount
     * @param {!int} coefsPerPiece
     * @returns {!Array.<!Polynomial>}
     * @complexity O(N + P*B) where N is the bit-size, P is the piece count, B is the bits per piece
     */
    splitIntoNPiecesOfSize(pieceCount, coefsPerPiece) {
        let pieces = [];
        let offset = 0;
        while (pieceCount === undefined ? offset < this._coefficients.length : pieces.length < pieceCount) {
            let coefs = this._coefficients.slice(offset, offset+coefsPerPiece);
            pieces.push(new Polynomial(coefs));
            offset += coefsPerPiece;
        }
        if (offset < this._coefficients.length) {
            throw new Error("pieceCount*coefsPerPiece < this.size()");
        }
        return pieces;
    }

    /**
     * @param {!int | !BigInt | !Polynomial} other
     * @param {!function(!BigInt, !BigInt):!BigInt} op
     * @returns {!Polynomial}
     * @private
     */
    _perCoefficientOperation(other, op) {
        other = Polynomial.of(other);
        let coefs = [];
        let n = Math.max(this._coefficients.length, other._coefficients.length);
        for (let i = 0; i < n; i++) {
            coefs.push(op(this.coefficient(i), other.coefficient(i)));
        }
        return new Polynomial(coefs);
    }

    /**
     * @param {!int} i
     * @returns {!BigInt}
     * @complexity O(1)
     */
    coefficient(i) {
        return i < this._coefficients.length ? this._coefficients[i] : BigInt.ZERO;
    }

    /**
     * @param {!int | !BigInt | !Polynomial} other
     * @returns {!Polynomial}
     */
    plus(other) {
        return this._perCoefficientOperation(other, (a, b) => a.plus(b));
    }

    /**
     * @param {!int | !BigInt | !Polynomial} other
     * @returns {!Polynomial}
     */
    minus(other) {
        return this._perCoefficientOperation(other, (a, b) => a.minus(b));
    }

    /**
     * @param {!int} negativeDegree The degree where x^k is congruent to -1.
     * @returns {*}
     */
    modXnPlus1(negativeDegree) {
        let pieces = this.splitIntoNPiecesOfSize(undefined, negativeDegree);
        let total = Polynomial.ZERO;
        for (let i = 0; i < pieces.length; i++) {
            let p = pieces[i];
            if ((i & 1) === 0) {
                total = total.plus(p)
            } else {
                total = total.minus(p);
            }
        }
        return total;
    }

    /**
     * @param {!int} shiftAmount
     * @param {!int} negativeDegree
     * @returns {!Polynomial}
     */
    shiftModXnPlus1(shiftAmount, negativeDegree) {
        shiftAmount %= 2*negativeDegree;
        if (shiftAmount < 0) {
            shiftAmount += 2*negativeDegree;
        }
        let result = repeat(BigInt.ZERO, shiftAmount);
        result.push(...this._coefficients);
        return new Polynomial(result).modXnPlus1(negativeDegree);
    }

    /**
     * @param {!Array.<!int | !BigInt | !Polynomial>} polys
     * @param {!int} negativeDegreeExponent The k for which x^(2^k) is congruent to -1.
     * @returns {!Array.<!Polynomial>} Fourier transform of the given list of polynomials, using a power of X as the
     * principal root of unity.
     */
    static fft(polys, negativeDegreeExponent) {
        polys = polys.map(Polynomial.of);
        let rootOrder = polys.length;
        let rootExponent = exact_lg2(rootOrder);
        if (rootExponent === undefined) {
            throw new Error("Need a list with power of 2 length.");
        }
        if (rootExponent > negativeDegreeExponent+1) {
            throw new Error("Need list length < 2*2^negativeDegreeExponent.");
        }

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

        for (let i = rootExponent-1; i >= 0; i--) {
            polys = Polynomial._fft_helper_hadamard(polys, i);
            polys = Polynomial._fft_helper_controlled_phase_gradient_below(polys, i, +1, negativeDegreeExponent);
        }
        return swap_index_bit_orders(polys);
    }

    /**
     * @param {!Array.<!int | !BigInt | !Polynomial>} polys
     * @param {!int} negativeDegreeExponent The k for which x^(2^k) is congruent to -1.
     * @returns {!Array.<!Polynomial>} Inverse fourier transform of the given list of polynomials, using a power of X
     * as the principal root of unity.
     */
    static inverse_fft(polys, negativeDegreeExponent) {
        polys = polys.map(Polynomial.of);
        let rootOrder = polys.length;
        let rootExponent = exact_lg2(rootOrder);
        if (rootExponent === undefined) {
            throw new Error("Need a list with power of 2 length.");
        }
        if (rootExponent > negativeDegreeExponent+1) {
            throw new Error("Need list length < 2*2^negativeDegreeExponent.");
        }
        polys = swap_index_bit_orders(polys);
        for (let i = 0; i < rootExponent; i++) {
            polys = Polynomial._fft_helper_controlled_phase_gradient_below(polys, i, -1, negativeDegreeExponent);
            polys = Polynomial._fft_helper_hadamard(polys, i);
        }
        return polys.map(p => new Polynomial(p._coefficients.map(c => {
            let d = c.shift(-rootExponent);
            if (!d.shift(rootExponent).isEqualTo(c)) {
                throw new Error("Bad multiple in inverse_fft. Input wasn't scaled by n.");
            }
            return d;
        })));
    }

    /**
     * @param {!Array.<!Polynomial>} list
     * @param {!int} target_bit_index
     * @returns {!Array.<!Polynomial>}
     */
    static _fft_helper_hadamard(list, target_bit_index) {
        let p = exact_lg2(list.length);
        if (p === undefined || p <= target_bit_index) {
            throw new Error(`bad length ${list.length} vs bit index ${target_bit_index}`)
        }

        let result = repeat(undefined, list.length);
        for (let other_bits = 0; other_bits < list.length >> 1; other_bits++) {
            let i = splice_bit(other_bits, target_bit_index, false);
            let j = splice_bit(other_bits, target_bit_index, true);
            let [vi, vj] = [list[i], list[j]];
            let [hi, hj] = [vi.plus(vj), vi.minus(vj)];
            [result[i], result[j]] = [hi, hj]
        }
        return result;
    }

    /**
     * @param {!Array.<!int | !BigInt | !Polynomial>} list
     * @param {!int} power
     * @param {!int} negativeDegreeExponent
     * @returns {!Array.<!Polynomial>}
     */
    static _phase_gradient(list, power, negativeDegreeExponent) {
        let negativeDegree = 1 << negativeDegreeExponent;
        let result = [];
        let p = 0;
        for (let item of list) {
            result.push(Polynomial.of(item).shiftModXnPlus1(p, negativeDegree));
            p += power;
        }
        return result;
    }

    /**
     * @param {!Array.<!Polynomial>} list
     * @param {!int} control_bit_index
     * @param {!int} sign The direction (+1 or -1) of the gradient.
     * @param {!int} negativeDegreeExponent
     * @returns {!Array.<!Polynomial>}
     */
    static _fft_helper_controlled_phase_gradient_below(list, control_bit_index, sign, negativeDegreeExponent) {
        let negativeDegree = 1 << negativeDegreeExponent;
        let controlBitMask = 1 << control_bit_index;
        let lowMask = controlBitMask - 1;
        let gradientPower = negativeDegreeExponent - control_bit_index;
        let result = [];
        for (let i = 0; i < list.length; i++) {
            let low = i & lowMask;
            let control = (i & controlBitMask) !== 0;
            let localGradient = control ? low << gradientPower : 0;
            result.push(list[i].shiftModXnPlus1(localGradient * sign, negativeDegree));
        }
        return result;
    }

    /**
     * @param {!Array.<!int | !BigInt | !Polynomial>} polys1
     * @param {!Array.<!int | !BigInt | !Polynomial>} polys2
     * @param {!int} negativeDegreeExponent The k for which x^(2^k) is congruent to -1.
     * @param {!function(!Polynomial, !Polynomial): !Polynomial} itemMultiplier
     * @returns {!Array.<!Polynomial>} Cyclic convolution of the two lists of polynomials.
     */
    static cyclic_convolution(polys1, polys2, negativeDegreeExponent, itemMultiplier) {
        if (polys1.length !== polys2.length) {
            throw new Error("lists should have same length");
        }
        let a = Polynomial.fft(polys1, negativeDegreeExponent);
        let b = Polynomial.fft(polys2, negativeDegreeExponent);

        let c = [];
        for (let i = 0; i < a.length; i++) {
            c.push(itemMultiplier(a[i], b[i]));
        }

        return Polynomial.inverse_fft(c, negativeDegreeExponent);
    }

    /**
     * @param {!Array.<!int | !BigInt | !Polynomial>} polys1
     * @param {!Array.<!int | !BigInt | !Polynomial>} polys2
     * @param {!int} negativeDegreeExponent The k for which x^(2^k) is congruent to -1.
     * @param {!function(!Polynomial, !Polynomial): !Polynomial} itemMultiplier
     * @returns {!Array.<!Polynomial>} Negacyclic convolution of the two lists of polynomials.
     */
    static negacyclic_convolution(polys1, polys2, negativeDegreeExponent, itemMultiplier) {
        if (polys1.length !== polys2.length) {
            throw new Error("lists should have same length");
        }
        let rootOrder = polys1.length;
        let rootExponent = exact_lg2(rootOrder);
        if (rootExponent === undefined) {
            throw new Error("Need lists with power of 2 length.");
        }
        if (rootExponent > negativeDegreeExponent) {
            throw new Error("Need list length < 2^negativeDegreeExponent.");
        }

        let power = 1 << (negativeDegreeExponent - rootExponent);
        let a = Polynomial._phase_gradient(polys1, power, negativeDegreeExponent);
        let b = Polynomial._phase_gradient(polys2, power, negativeDegreeExponent);
        let c = Polynomial.cyclic_convolution(a, b, negativeDegreeExponent, itemMultiplier);
        return Polynomial._phase_gradient(c, -power, negativeDegreeExponent);
    }


    /**
     * @param {!Array.<!int | !BigInt | !Polynomial>} pieces
     * @param {!int} shiftPerPiece
     * @returns {!Polynomial}
     */
    static shiftSum(pieces, shiftPerPiece) {
        let coefs = [];
        let carry = Polynomial.ZERO;
        for (let piece of pieces) {
            let combo = carry.plus(piece);
            // Low coefficients go into result.
            for (let j = 0; j < shiftPerPiece; j++) {
                coefs.push(combo.coefficient(j));
            }
            // High coefficients get carried.
            carry = new Polynomial(combo._coefficients.slice(shiftPerPiece));
        }
        coefs.push(...carry._coefficients);
        return new Polynomial(coefs);
    }
}

Polynomial.ZERO = new Polynomial([]);
Polynomial.ONE = new Polynomial([1]);
Polynomial.X = new Polynomial([0, 1]);
Polynomial.MINUS_ONE = new Polynomial([-1]);

export default Polynomial;
export { Polynomial }
