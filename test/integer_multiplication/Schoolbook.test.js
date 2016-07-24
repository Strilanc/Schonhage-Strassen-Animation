import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import {testAllSmallCases, testRandomCasesAgainstNative, testRandomLargeCasesAgainst} from "test/integer_multiplication/util.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"

let suite = new Suite("integer_multiplication.Schoolbook");

suite.test("auto", () => {
    testAllSmallCases(multiply_integer_Schoolbook);
    testRandomCasesAgainstNative(multiply_integer_Schoolbook, 10);
});

suite.test("examples", () => {
    assertThat(multiply_integer_Schoolbook(12345, 67890)).isEqualTo(838102050);
    assertThat(multiply_integer_Schoolbook(123456789, 987654321)).isEqualTo(BigInt.parse("121932631112635269"));
});
