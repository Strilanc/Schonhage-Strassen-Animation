import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import Polynomial from "src/util/Polynomial.js"
import FermatRing from "src/util/FermatRing.js"
import multiply_integer_Schoolbook from "src/integer_multiplication/Schoolbook.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import multiply_integer_FFT from "src/integer_multiplication/FFT.js"
import multiply_SchonhageStrassen from "src/integer_multiplication/SchonhageStrassen.js"

let suite = new Suite("integer_multiplication");

let testAllSmallCases = algo => {
    for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
            assertThat(algo(i, j)).withInfo({i, j}).isEqualTo(i*j);
        }
    }
};

let testRandomCasesAgainstNative = (algo, repeatCount) => {
    for (let _ = 0; _ < repeatCount; _++) {
        let i = Math.floor(Math.random()*Math.pow(2, 25));
        let j = Math.floor(Math.random()*Math.pow(2, 25));
        assertThat(algo(i, j)).withInfo({i, j}).isEqualTo(i*j);
    }
};

let testRandomLargeCasesAgainst = (algo, comparisonAlgo, numberSize, repeatCount) => {
    for (let _ = 0; _ < repeatCount; _++) {
        let i = BigInt.random(numberSize);
        let j = BigInt.random(numberSize);
        assertThat(algo(i, j)).withInfo({i, j}).isEqualTo(comparisonAlgo(i, j));
    }
};

suite.test("schoolbook", () => {
    testAllSmallCases(multiply_integer_Schoolbook);
    testRandomCasesAgainstNative(multiply_integer_Schoolbook, 10);
});

suite.test("Karatsuba", () => {
    testAllSmallCases(multiply_integer_Karatsuba);
    testRandomCasesAgainstNative(multiply_integer_Karatsuba, 10);
    testRandomLargeCasesAgainst(multiply_integer_Karatsuba, 100, multiply_integer_Schoolbook);
});

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
