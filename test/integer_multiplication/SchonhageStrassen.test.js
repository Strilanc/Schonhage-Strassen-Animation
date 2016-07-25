import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"
import {testAllSmallCases, testRandomCasesAgainstNative, testRandomLargeCasesAgainst} from "test/integer_multiplication/util.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import {
    multiply_integer_SchonhageStrassen,
    ring_for_size,
    multiply_integer_SchonhageStrassen_ring
} from "src/integer_multiplication/SchonhageStrassen.js"

let suite = new Suite("integer_multiplication.SchönhageStrassen");

suite.test("examples_ring", () => {
    let karatsuba_ring = (a, b, r) => r.canonicalize(multiply_integer_Karatsuba(a, b));
    let ring = new FermatRing(3, 2);
    assertThat(multiply_integer_SchonhageStrassen_ring(1569, 4698, ring)).isEqualTo(karatsuba_ring(1569, 4698, ring));
});

suite.test("auto", () => {
    testAllSmallCases(multiply_integer_SchonhageStrassen);
    testRandomCasesAgainstNative(multiply_integer_SchonhageStrassen, 10);
    testRandomLargeCasesAgainst(multiply_integer_SchonhageStrassen, 100, multiply_integer_Karatsuba);
    testRandomLargeCasesAgainst(multiply_integer_SchonhageStrassen, multiply_integer_Karatsuba, 200, 1);
});

suite.test("big", () => {
    testRandomLargeCasesAgainst(multiply_integer_SchonhageStrassen, multiply_integer_Karatsuba, 1000, 1);
});

suite.test("sizes", () => {
    for (let i = 1; i < 50; i++) {
        testRandomLargeCasesAgainst(multiply_integer_SchonhageStrassen, multiply_integer_Karatsuba, i, 1);
    }
});

suite.test("random sizes", () => {
    for (let repeat = 0; repeat < 3; repeat++) {
        let k = Math.floor(Math.random()*250+10);
        testRandomLargeCasesAgainst(multiply_integer_SchonhageStrassen, multiply_integer_Karatsuba, k, 1);
    }
});

suite.test("examples", () => {
    assertThat(multiply_integer_SchonhageStrassen(107, 389)).isEqualTo(41623);
    assertThat(multiply_integer_SchonhageStrassen(12345, 67890)).isEqualTo(838102050);
    assertThat(multiply_integer_SchonhageStrassen(123456789, 987654321)).isEqualTo(BigInt.parse("121932631112635269"));
});

suite.test("ring_for_size", () => {
    assertThrows(() => ring_for_size(0));
    assertThrows(() => ring_for_size(1));
    assertThrows(() => ring_for_size(2));
    assertThrows(() => ring_for_size(3));
    assertThrows(() => ring_for_size(4));
    assertThrows(() => ring_for_size(5));
    assertThrows(() => ring_for_size(6));
    assertThrows(() => ring_for_size(7));
    assertThrows(() => ring_for_size(8));
    assertThrows(() => ring_for_size(12));

    // Note: these aren't really *required results* so much as noting down how it behaves for various sizes.

    assertThat(ring_for_size(16)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(32)).isEqualTo(new FermatRing(2, 3));

    assertThat(ring_for_size((1<<9) + (1<<8))).isEqualTo(new FermatRing(4, 4));
    assertThat(ring_for_size(1<<10)).isEqualTo(new FermatRing(4, 5));
    assertThat(ring_for_size(1<<11)).isEqualTo(new FermatRing(5, 4));
    assertThat(ring_for_size(1<<12)).isEqualTo(new FermatRing(5, 5));
    assertThat(ring_for_size(1<<20)).isEqualTo(new FermatRing(9, 8));
    assertThat(ring_for_size((1<<20) + (1<<10))).isEqualTo(new FermatRing(8, 17));
});
