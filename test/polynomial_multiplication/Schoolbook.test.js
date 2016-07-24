import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"
import multiply_polynomial_Schoolbook from "src/polynomial_multiplication/Schoolbook.js"
import multiply_polynomial_FFT from "src/polynomial_multiplication/FastFourierTransform_Xn.js"

let suite = new Suite("polynomial_multiplication.Schoolbook");

suite.test("examples", () => {
    assertThat(multiply_polynomial_Schoolbook(
        Polynomial.ofCoefs(2, 3, 5),
        Polynomial.ofCoefs(7, 11, 13),
        multiply_integer_Schoolbook)).isEqualTo(Polynomial.ofCoefs(14, 43, 94, 94, 65));
});
