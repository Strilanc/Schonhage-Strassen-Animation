import { Suite, assertThat } from "test/testing/Test.js"
import {
    floor_lg2,
    ceil_lg2,
    reversed_list,
    swap_index_bit_orders,
    splice_bit,
    repeat,
    proper_mod,
    exact_lg2
} from "src/util/util.js"

let suite = new Suite("util");

suite.test("floor_lg2", () => {
    assertThat(floor_lg2(1)).isEqualTo(0);
    assertThat(floor_lg2(2)).isEqualTo(1);
    assertThat(floor_lg2(3)).isEqualTo(1);
    assertThat(floor_lg2(4)).isEqualTo(2);
    assertThat(floor_lg2(5)).isEqualTo(2);
    assertThat(floor_lg2(6)).isEqualTo(2);
    assertThat(floor_lg2(7)).isEqualTo(2);
    assertThat(floor_lg2(8)).isEqualTo(3);
    assertThat(floor_lg2(9)).isEqualTo(3);
});

suite.test("ceil_lg2", () => {
    assertThat(ceil_lg2(1)).isEqualTo(0);
    assertThat(ceil_lg2(2)).isEqualTo(1);
    assertThat(ceil_lg2(3)).isEqualTo(2);
    assertThat(ceil_lg2(4)).isEqualTo(2);
    assertThat(ceil_lg2(5)).isEqualTo(3);
    assertThat(ceil_lg2(6)).isEqualTo(3);
    assertThat(ceil_lg2(7)).isEqualTo(3);
    assertThat(ceil_lg2(8)).isEqualTo(3);
    assertThat(ceil_lg2(9)).isEqualTo(4);
});

suite.test("exact_lg2", () => {
    assertThat(exact_lg2("abc")).isEqualTo(undefined);
    assertThat(exact_lg2(1)).isEqualTo(0);
    assertThat(exact_lg2(2)).isEqualTo(1);
    assertThat(exact_lg2(3)).isEqualTo(undefined);
    assertThat(exact_lg2(4)).isEqualTo(2);
    assertThat(exact_lg2(5)).isEqualTo(undefined);
    assertThat(exact_lg2(6)).isEqualTo(undefined);
    assertThat(exact_lg2(7)).isEqualTo(undefined);
    assertThat(exact_lg2(8)).isEqualTo(3);
    assertThat(exact_lg2(9)).isEqualTo(undefined);
});

suite.test("swap_index_bit_orders", () => {
    assertThat(swap_index_bit_orders([0, 1, 2, 3, 4, 5, 6, 7])).isEqualTo([0, 4, 2, 6, 1, 5, 3, 7]);
});

suite.test("reversed_list", () => {
    assertThat(reversed_list([0, 1, 2, 3, 4, 5, 6, 7])).isEqualTo([7, 6, 5, 4, 3, 2, 1, 0]);
});

suite.test("splice_bit", () => {
    assertThat(splice_bit(0xFFFF, 4, false)).isEqualTo(0x1FFEF);
    assertThat(splice_bit(0xFFFF, 4, true)).isEqualTo(0x1FFFF);
    assertThat(splice_bit(0, 5, true)).isEqualTo(32);
    assertThat(splice_bit(0, 5, false)).isEqualTo(0);
});

suite.test("repeat", () => {
    assertThat(repeat("a", 0)).isEqualTo([]);
    assertThat(repeat("a", 1)).isEqualTo(["a"]);
    assertThat(repeat("a", 2)).isEqualTo(["a", "a"]);
});

suite.test("proper_mod", () => {
    assertThat(proper_mod(-10, 3)).isEqualTo(2);
    assertThat(proper_mod(-9, 3)).isEqualTo(0);
    assertThat(proper_mod(-2, 3)).isEqualTo(1);
    assertThat(proper_mod(-1, 3)).isEqualTo(2);
    assertThat(proper_mod(0, 3)).isEqualTo(0);
    assertThat(proper_mod(1, 3)).isEqualTo(1);
    assertThat(proper_mod(2, 3)).isEqualTo(2);
    assertThat(proper_mod(3, 3)).isEqualTo(0);
    assertThat(proper_mod(4, 3)).isEqualTo(1);

    assertThat(proper_mod(111, 11)).isEqualTo(1);
});
