import BigInt from "src/util/BigInt.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"

/**
 * @param {!int | !BigInt | !Polynomial} a
 * @param {!int | !BigInt | !Polynomial} b
 * @param {!function(!BigInt, !BigInt) : !BigInt=} coefficient_multiplier
 * @returns {!Polynomial}
 * @complexity O(N^2)
 */
function multiply_polynomial_Schoolbook(a, b, coefficient_multiplier=multiply_integer_Schoolbook) {
    a = Polynomial.of(a);
    b = Polynomial.of(b);

    let coefs = new Array(a.degree() + b.degree() + 1).fill(BigInt.ZERO);
    for (let i = 0; i <= a.degree(); i++) {
        for (let j = 0; j <= b.degree(); j++) {
            let k = i + j;
            coefs[k] = coefs[k].plus(coefficient_multiplier(a.coefficient(i), b.coefficient(j)));
        }
    }

    return new Polynomial(coefs);
}

export default multiply_polynomial_Schoolbook;
export {multiply_polynomial_Schoolbook}
