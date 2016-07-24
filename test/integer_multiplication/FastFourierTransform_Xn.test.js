import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import {testAllSmallCases, testRandomCasesAgainstNative, testRandomLargeCasesAgainst} from "test/integer_multiplication/util.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import multiply_integer_FFT from "src/integer_multiplication/FastFourierTransform_Xn.js"

let suite = new Suite("integer_multiplication.FastFourierTransform_Xn");

//suite.test("auto", () => {
//    testAllSmallCases(multiply_integer_FFT);
//    testRandomCasesAgainstNative(multiply_integer_FFT, 10);
//    testRandomLargeCasesAgainst(multiply_integer_FFT, 100, multiply_integer_Karatsuba);
//    testRandomLargeCasesAgainst(multiply_integer_FFT, multiply_integer_Karatsuba, 200, 1);
//});
//
//suite.test("examples", () => {
//    assertThat(multiply_integer_FFT(12345, 67890)).isEqualTo(838102050);
//    assertThat(multiply_integer_FFT(123456789, 987654321)).isEqualTo(BigInt.parse("121932631112635269"));
//});
