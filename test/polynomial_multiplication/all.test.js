import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"
import multiply_polynomial_Schoolbook from "src/polynomial_multiplication/Schoolbook.js"
import multiply_polynomial_FFT from "src/polynomial_multiplication/FFT.js"

let suite = new Suite("polynomial_multiplication");

suite.test("schoolbook_polynomial", () => {
    assertThat(multiply_polynomial_Schoolbook(
        Polynomial.ofCoefs(2, 3, 5),
        Polynomial.ofCoefs(7, 11, 13),
        multiply_integer_Schoolbook)).isEqualTo(Polynomial.ofCoefs(14, 43, 94, 94, 65));
});

suite.test("multiply_polynomial_FFT", () => {
    assertThat(multiply_polynomial_FFT(
        Polynomial.ofCoefs(2, 3, 5),
        Polynomial.ofCoefs(7, 11, 13))).isEqualTo(Polynomial.ofCoefs(14, 43, 94, 94, 65));
});
