import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"
import {testAllSmallCases, testRandomCasesAgainstNative, testRandomLargeCasesAgainst} from "test/integer_multiplication/util.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import multiply_SchonhageStrassen from "src/integer_multiplication/SchonhageStrassen.js"

let suite = new Suite("integer_multiplication.SchönhageStrassen");

//suite.test("auto", () => {
//    testAllSmallCases(multiply_SchonhageStrassen);
//    testRandomCasesAgainstNative(multiply_SchonhageStrassen, 10);
//    testRandomLargeCasesAgainst(multiply_SchonhageStrassen, 100, multiply_integer_Karatsuba);
//    testRandomLargeCasesAgainst(multiply_SchonhageStrassen, multiply_integer_Karatsuba, 200, 1);
//});
//
//suite.test("examples", () => {
//    assertThat(multiply_SchonhageStrassen(12345, 67890)).isEqualTo(838102050);
//    assertThat(multiply_SchonhageStrassen(123456789, 987654321)).isEqualTo(BigInt.parse("121932631112635269"));
//});

//suite.test("SchönhageStrassen_inFermatRing", () => {
//    assertThat(multiply_SchonhageStrassen(16, 16, new FermatRing(3))).isEqualTo((16*16) % 257);
//    assertThat(multiply_SchonhageStrassen(37, 186, new FermatRing(3))).isEqualTo((37*186) % 257);
//    assertThat(multiply_SchonhageStrassen(53476, 15792, new FermatRing(4))).isEqualTo((53476*15792) % ((1<<16) + 1));
//
//    let ring = new FermatRing(4);
//    let inRing_Karatsuba = (a, b) => ring.canonicalize(multiply_integer_Karatsuba(a, b));
//    let inRing_SchonhageStrassen = (a, b) => multiply_SchonhageStrassen(a, b, ring);
//    testRandomLargeCasesAgainst(inRing_SchonhageStrassen, inRing_Karatsuba, 1<<4, 2);
//});

//suite.test("SchönhageStrassen_inTheIntegers", () => {
//    testAllSmallCases(multiply_SchonhageStrassen);
//    testRandomCasesAgainstNative(multiply_SchonhageStrassen, 5);
//    testRandomLargeCasesAgainst(multiply_SchonhageStrassen, multiply_integer_Karatsuba, 100, 2);
//    testRandomLargeCasesAgainst(multiply_SchonhageStrassen, multiply_integer_Karatsuba, 200, 1);
//});
