import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"
import multiply_polynomial_Schoolbook from "src/polynomial_multiplication/Schoolbook.js"
import multiply_polynomial_FFT from "src/polynomial_multiplication/FastFourierTransform_Xn.js"

let suite = new Suite("polynomial_multiplication.FastFourierTransform_Xn");

let testRandomLargeCasesAgainst = (algo, comparisonAlgo, degree, coefficientSize, repeatCount) => {
    for (let _ = 0; _ < repeatCount; _++) {
        let p = Polynomial.random(degree, coefficientSize);
        let q = Polynomial.random(degree, coefficientSize);
        assertThat(algo(p, q)).withInfo({p, q}).isEqualTo(comparisonAlgo(p, q));
    }
};

suite.test("examples", () => {
    assertThat(multiply_polynomial_FFT(
        Polynomial.ofCoefs(2, 3, 5),
        Polynomial.ofCoefs(7, 11, 13))).isEqualTo(Polynomial.ofCoefs(14, 43, 94, 94, 65));
});

suite.test("compare", () => {
    testRandomLargeCasesAgainst(multiply_polynomial_FFT, multiply_polynomial_Schoolbook, 10, 5, 2);

    testRandomLargeCasesAgainst(multiply_polynomial_FFT, multiply_polynomial_Schoolbook, 20, 5, 1);
});
