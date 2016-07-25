import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import {testAllSmallCases, testRandomCasesAgainstNative, testRandomLargeCasesAgainst} from "test/integer_multiplication/util.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"

let suite = new Suite("integer_multiplication.Karatsuba");

suite.test("auto", () => {
    testAllSmallCases(multiply_integer_Karatsuba);
    testRandomCasesAgainstNative(multiply_integer_Karatsuba, 10);
});

suite.test("sizes", () => {
    for (let i = 10; i < 50; i++) {
        testRandomLargeCasesAgainst(multiply_integer_Karatsuba, multiply_integer_Schoolbook, i, 1);
    }
    testRandomLargeCasesAgainst(multiply_integer_Karatsuba, multiply_integer_Schoolbook, 100, 1);
});

suite.test("examples", () => {
    assertThat(multiply_integer_Karatsuba(12345, 67890)).isEqualTo(838102050);
    assertThat(multiply_integer_Karatsuba(123456789, 987654321)).isEqualTo(BigInt.parse("121932631112635269"));
});
