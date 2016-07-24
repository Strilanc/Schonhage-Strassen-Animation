import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"
import {testAllSmallCases, testRandomCasesAgainstNative, testRandomLargeCasesAgainst} from "test/integer_multiplication/util.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import {
    multiply_SchonhageStrassen,
    ring_for_size,
    multiply_SchonhageStrassen_ring,
    sub_parameters_for_multiplying_values_in_ring
} from "src/integer_multiplication/SchonhageStrassen.js"

let suite = new Suite("integer_multiplication.SchönhageStrassen");

suite.test("auto", () => {
    testAllSmallCases(multiply_SchonhageStrassen);
    testRandomCasesAgainstNative(multiply_SchonhageStrassen, 10);
    testRandomLargeCasesAgainst(multiply_SchonhageStrassen, 100, multiply_integer_Karatsuba);
    testRandomLargeCasesAgainst(multiply_SchonhageStrassen, multiply_integer_Karatsuba, 200, 1);
    testRandomLargeCasesAgainst(multiply_SchonhageStrassen, multiply_integer_Karatsuba, 1000, 1);
});

suite.test("examples", () => {
    assertThat(multiply_SchonhageStrassen(12345, 67890)).isEqualTo(838102050);
    assertThat(multiply_SchonhageStrassen(123456789, 987654321)).isEqualTo(BigInt.parse("121932631112635269"));
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

    // Note: these aren't really *required results* so much as noting down how it behaves for various sizes.

    assertThat(ring_for_size(9)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(10)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(11)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(12)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(13)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(14)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(15)).isEqualTo(new FermatRing(2, 2));
    assertThat(ring_for_size(16)).isEqualTo(new FermatRing(2, 2));

    assertThat(ring_for_size(17)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(18)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(19)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(20)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(21)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(22)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(23)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(24)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(25)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(26)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(27)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(28)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(29)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(30)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(31)).isEqualTo(new FermatRing(2, 3));
    assertThat(ring_for_size(32)).isEqualTo(new FermatRing(2, 3));

    assertThat(ring_for_size(33)).isEqualTo(new FermatRing(3, 2));
    assertThat(ring_for_size(34)).isEqualTo(new FermatRing(3, 2));
    assertThat(ring_for_size(35)).isEqualTo(new FermatRing(3, 2));

    assertThat(ring_for_size(100)).isEqualTo(new FermatRing(3, 3));
    assertThat(ring_for_size(1000)).isEqualTo(new FermatRing(4, 5));
    assertThat(ring_for_size(10000)).isEqualTo(new FermatRing(6, 5));
    assertThat(ring_for_size(100000)).isEqualTo(new FermatRing(7, 7));
    assertThat(ring_for_size(1000000)).isEqualTo(new FermatRing(9, 8));
    assertThat(ring_for_size(10000000)).isEqualTo(new FermatRing(10, 10));
    assertThat(ring_for_size(100000000)).isEqualTo(new FermatRing(12, 11));
    assertThat(ring_for_size(1000000000)).isEqualTo(new FermatRing(13, 15));
    assertThat(ring_for_size(10000000000)).isEqualTo(new FermatRing(15, 14));
    assertThat(ring_for_size(100000000000)).isEqualTo(new FermatRing(16, 24));
    assertThat(ring_for_size(1000000000000)).isEqualTo(new FermatRing(18, 17));
    assertThat(ring_for_size(10000000000000)).isEqualTo(new FermatRing(19, 37));
});
