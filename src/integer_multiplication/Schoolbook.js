import BigInt from "src/util/BigInt.js"

/**
 * Multiplies two integers using the algorithm that kids learn in school.
 * @param {!int | !BigInt} a
 * @param {!int | !BigInt} b
 * @returns {!BigInt} The product of a and b.
 * @complexity O(N^2)
 */
function multiply_integer_Schoolbook(a, b) {
    a = BigInt.of(a);
    b = BigInt.of(b);

    let total = BigInt.ZERO;
    for (let i = 0; i < a.size(); i++) {
        if (a.bit(i)) {
            total = total.plus(b.shift(i));
        }
    }
    if (a.tail()) {
        total = total.minus(b.shift(a.size()));
    }

    return total;
}

export default multiply_integer_Schoolbook;
export {multiply_integer_Schoolbook}
