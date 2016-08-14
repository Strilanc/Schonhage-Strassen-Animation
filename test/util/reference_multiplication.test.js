import { Suite, assertThat } from "test/testing/Test.js"
import { multiply_schoolbook } from "src/util/reference_multiplication.js"

let suite = new Suite("reference_multiplication");

suite.test("small", () => {
    assertThat(multiply_schoolbook([2, 3, 5, 7], [9, 4, 3])).isEqualTo([8,6,6,8,2,6,2]);
});
