import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import FermatRing from "src/util/FermatRing.js"

let suite = new Suite("FermatRing");

suite.test("constructor", () => {
    let r0 = new FermatRing(0);
    assertThat(r0.divisor()).isEqualTo(3);
    assertThat(r0.principal_root).isEqualTo(2);
    assertThat(r0.principal_root_order).isEqualTo(2);
    assertThat(r0.bit_capacity).isEqualTo(1);
    assertThat(r0.principal_root_exponent).isEqualTo(0);
    assertThat(r0.bit_padding_factor).isEqualTo(1);

    let r1 = new FermatRing(1);
    assertThat(r1.divisor()).isEqualTo(5);
    assertThat(r1.principal_root).isEqualTo(2);
    assertThat(r1.principal_root_order).isEqualTo(4);
    assertThat(r1.bit_capacity).isEqualTo(2);
    assertThat(r1.principal_root_exponent).isEqualTo(1);
    assertThat(r1.bit_padding_factor).isEqualTo(1);

    let r2 = new FermatRing(2);
    assertThat(r2.divisor()).isEqualTo(17);
    assertThat(r2.principal_root).isEqualTo(2);
    assertThat(r2.principal_root_order).isEqualTo(8);
    assertThat(r2.bit_capacity).isEqualTo(4);
    assertThat(r2.principal_root_exponent).isEqualTo(2);
    assertThat(r2.bit_padding_factor).isEqualTo(1);

    let r3 = new FermatRing(3);
    assertThat(r3.divisor()).isEqualTo(257);
    assertThat(r3.principal_root).isEqualTo(2);
    assertThat(r3.principal_root_order).isEqualTo(16);
    assertThat(r3.bit_capacity).isEqualTo(8);
    assertThat(r3.principal_root_exponent).isEqualTo(3);
    assertThat(r3.bit_padding_factor).isEqualTo(1);

    let r9 = new FermatRing(9);
    assertThat(r9.divisor()).isEqualTo(BigInt.parse(
        "013407807929942597099574024998205846127479365820592393377723561443721764030073" +
        "546976801874298166903427690031858186486050853753882811946569946433649006084097"));
    assertThat(r9.principal_root).isEqualTo(2);
    assertThat(r9.principal_root_order).isEqualTo(1024);
    assertThat(r9.bit_capacity).isEqualTo(512);
    assertThat(r9.principal_root_exponent).isEqualTo(9);
    assertThat(r9.bit_padding_factor).isEqualTo(1);

    let r4p2 = new FermatRing(4, 2);
    assertThat(r4p2.divisor()).isEqualTo(4294967297);
    assertThat(r4p2.principal_root).isEqualTo(4);
    assertThat(r4p2.principal_root_order).isEqualTo(32);
    assertThat(r4p2.bit_capacity).isEqualTo(32);
    assertThat(r4p2.principal_root_exponent).isEqualTo(4);
    assertThat(r4p2.bit_padding_factor).isEqualTo(2);

    let r4p3 = new FermatRing(4, 3);
    assertThat(r4p3.divisor()).isEqualTo(281474976710657);
    assertThat(r4p3.principal_root).isEqualTo(8);
    assertThat(r4p3.principal_root_order).isEqualTo(32);
    assertThat(r4p3.bit_capacity).isEqualTo(48);
    assertThat(r4p3.principal_root_exponent).isEqualTo(4);
    assertThat(r4p3.bit_padding_factor).isEqualTo(3);
});

let comparisonMod = (i, d) => {
    i %= d;
    i += d;
    i %= d;
    if (i === d - 1) {
        i -= d;
    }
    return i;
};

suite.test("canonicalize", () => {
    let r0 = new FermatRing(0);
    let r1 = new FermatRing(1);
    let r2 = new FermatRing(2);
    let r3 = new FermatRing(3);
    let r1p3 = new FermatRing(1, 3);

    assertThat(r1.canonicalize(-2)).isEqualTo(3);
    assertThat(r1.canonicalize(-1)).isEqualTo(-1);
    assertThat(r1.canonicalize(0)).isEqualTo(0);
    assertThat(r1.canonicalize(1)).isEqualTo(1);
    assertThat(r1.canonicalize(2)).isEqualTo(2);
    assertThat(r1.canonicalize(3)).isEqualTo(3);
    assertThat(r1.canonicalize(4)).isEqualTo(-1);
    assertThat(r1.canonicalize(5)).isEqualTo(0);

    for (let i = -100; i < 100; i++) {
        assertThat(r0.canonicalize(i)).withInfo({r0, i}).isEqualTo(comparisonMod(i, 3));
        assertThat(r1.canonicalize(i)).withInfo({r1, i}).isEqualTo(comparisonMod(i, 5));
        assertThat(r2.canonicalize(i)).withInfo({r2, i}).isEqualTo(comparisonMod(i, 17));
        assertThat(r3.canonicalize(i)).withInfo({r3, i}).isEqualTo(comparisonMod(i, 257));
        assertThat(r1p3.canonicalize(i)).withInfo({r1p3, i}).isEqualTo(comparisonMod(i, 65));
    }
});

suite.test("_times2RaisedTo", () => {
    let r0 = new FermatRing(0);
    let r1 = new FermatRing(1);
    let r2 = new FermatRing(2);
    let r3 = new FermatRing(3);
    let r1p3 = new FermatRing(1, 3);
    for (let i = 0; i < 10; i++) {
        for (let s = 0; s < 10; s++) {
            assertThat(r0._times2RaisedTo(i, s)).isEqualTo(comparisonMod(i<<s, 3));
            assertThat(r1._times2RaisedTo(i, s)).isEqualTo(comparisonMod(i<<s, 5));
            assertThat(r2._times2RaisedTo(i, s)).isEqualTo(comparisonMod(i<<s, 17));
            assertThat(r3._times2RaisedTo(i, s)).isEqualTo(comparisonMod(i<<s, 257));
            assertThat(r1p3._times2RaisedTo(i, s)).isEqualTo(comparisonMod(i<<s, 65));
        }
    }
    assertThat(r2._times2RaisedTo(1, -1)).isEqualTo(-8+17);

    let r7 = new FermatRing(5);
    assertThat(r7._times2RaisedTo(1, 31)).isEqualTo(2147483648);
    assertThat(r7._times2RaisedTo(1, 32)).isEqualTo(-1);
    assertThat(r7._times2RaisedTo(1, 33)).isEqualTo(4294967295);
    assertThat(r7._times2RaisedTo(1, 63)).isEqualTo(2147483649);
    assertThat(r7._times2RaisedTo(1, 64)).isEqualTo(1);
    assertThat(r7._times2RaisedTo(1, 65)).isEqualTo(2);
    assertThat(r7._times2RaisedTo(1, -33)).isEqualTo(2147483648);
    assertThat(r7._times2RaisedTo(1, -32)).isEqualTo(-1);
    assertThat(r7._times2RaisedTo(1, -31)).isEqualTo(4294967295);

    let r2p5 = new FermatRing(2, 5);
    assertThat(r2p5._times2RaisedTo(1, 0)).isEqualTo(1);
    assertThat(r2p5._times2RaisedTo(1, 1)).isEqualTo(2);
    assertThat(r2p5._times2RaisedTo(1, 5)).isEqualTo(32);
    assertThat(r2p5._times2RaisedTo(1, 10)).isEqualTo(1024);
    assertThat(r2p5._times2RaisedTo(1, 15)).isEqualTo(32768);
    assertThat(r2p5._times2RaisedTo(1, 20)).isEqualTo(-1);
    assertThat(r2p5._times2RaisedTo(1, 25)).isEqualTo(1048545);
    assertThat(r2p5._times2RaisedTo(1, 30)).isEqualTo(1047553);
    assertThat(r2p5._times2RaisedTo(1, 35)).isEqualTo(1015809);
    assertThat(r2p5._times2RaisedTo(1, 40)).isEqualTo(1);
    assertThat(r2p5._times2RaisedTo(1, 45)).isEqualTo(32);
    assertThat(r2p5._times2RaisedTo(1, 40*100 + 5)).isEqualTo(32);
    assertThat(r2p5._times2RaisedTo(1, 40*-100 + 15)).isEqualTo(32768);
    assertThat(r2p5._times2RaisedTo(3, 40*100 + 5)).isEqualTo(96);
    assertThat(r2p5._times2RaisedTo(3, 40*-100 + 15)).isEqualTo(98304);

    assertThrows(() => r0._times2RaisedTo(1, 0.5));
    assertThrows(() => r1._times2RaisedTo(1, 0.5));
    assertThat(r2._times2RaisedTo(r2._times2RaisedTo(1, 0.5), 0.5)).isEqualTo(2);
    assertThat(r2._times2RaisedTo(1, 0.5)).isEqualTo(11);
    assertThat(r3._times2RaisedTo(r3._times2RaisedTo(1, 0.5), 0.5)).isEqualTo(2);
    assertThat(r3._times2RaisedTo(1, 0.5)).isEqualTo(197);
    assertThrows(() => r1p3._times2RaisedTo(1, 0.5));
    assertThat(r2p5._times2RaisedTo(r2p5._times2RaisedTo(1, 0.5), 0.5)).isEqualTo(2);
    assertThat(r2p5._times2RaisedTo(1, 0.5)).isEqualTo(1015841);
    assertThat(r7._times2RaisedTo(r7._times2RaisedTo(1, 0.5), 0.5)).isEqualTo(2);
    assertThat(r7._times2RaisedTo(1, 0.5)).isEqualTo(4278190337);
});

suite.test("_fft_helper_controlled_phase_gradient_below", () => {
    let r3 = new FermatRing(3);
    let ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 0, +1)).
        isEqualTo([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 0, -1)).
        isEqualTo([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);

    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 1, +1)).
        isEqualTo([1, 1, 1, 16, 1, 1, 1, 16, 1, 1, 1, 16, 1, 1, 1, 16]);
    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 1, -1)).
        isEqualTo([1, 1, 1, 241, 1, 1, 1, 241, 1, 1, 1, 241, 1, 1, 1, 241]);

    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 2, +1)).
        isEqualTo([1, 1, 1, 1, 1, 4, 16, 64, 1, 1, 1, 1, 1, 4, 16, 64]);
    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 2, -1)).
        isEqualTo([1, 1, 1, 1, 1, 193, 241, 253, 1, 1, 1, 1, 1, 193, 241, 253]);

    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 3, +1)).
        isEqualTo([1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 4, 8, 16, 32, 64, 128]);
    assertThat(r3._fft_helper_controlled_phase_gradient_below(ones, 3, -1)).
        isEqualTo([1, 1, 1, 1, 1, 1, 1, 1, 1, 129, 193, 225, 241, 249, 253, 255]);

    assertThat(r3._fft_helper_controlled_phase_gradient_below([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], 3, +1)).
        isEqualTo([1, 2, 3, 4, 5, 6, 7, 8, 9, 20, 44, 96, 208, 191, 189, 249]);

    let r2p5 = new FermatRing(2, 5);
    assertThat(r2p5._fft_helper_controlled_phase_gradient_below(ones.slice(0, 8), 2, +1)).
        isEqualTo([1, 1, 1, 1,  1, 32, 1024, 32768]);
    assertThat(r2p5._fft_helper_controlled_phase_gradient_below(ones.slice(0, 8), 1, -1)).
        isEqualTo([1, 1, 1, 1047553, 1, 1, 1, 1047553]);

    let r3p5 = new FermatRing(3, 5);
    assertThat(r3p5._fft_helper_controlled_phase_gradient_below(ones, 3, +1)).
        isEqualTo([1, 1, 1, 1, 1, 1, 1, 1,  1, 32, 1024, 32768, 1048576, 33554432, 1073741824, 34359738368]);
});

suite.test("_fft_helper_hadamard", () => {
    let r3 = new FermatRing(3);
    let ones = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    assertThat(r3._fft_helper_hadamard(ones, 0)).
        isEqualTo([2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0]);
    assertThat(r3._fft_helper_hadamard(ones, 1)).
        isEqualTo([2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0]);
    assertThat(r3._fft_helper_hadamard(ones, 2)).
        isEqualTo([2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0]);
    assertThat(r3._fft_helper_hadamard(ones, 3)).
        isEqualTo([2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0]);

    let r2p5 = new FermatRing(2, 5);
    assertThat(r2p5._fft_helper_hadamard(ones.slice(0, 8), 0)).
        isEqualTo([2, 0, 2, 0,  2, 0, 2, 0]);
    assertThat(r2p5._fft_helper_hadamard(ones.slice(0, 8), 2)).
        isEqualTo([2, 2, 2, 2,  0, 0, 0, 0]);
});

suite.test("random", () => {
    let r = new FermatRing(10);
    assertThat(r.random()).isNotEqualTo(r.random());
});

suite.test("randomVector", () => {
    let r = new FermatRing(2, 3);
    assertThat(r.randomVector()).isNotEqualTo(r.randomVector());
    assertThat(r.randomVector().length).isEqualTo(8);
});

suite.test("fft", () => {
    let r2 = new FermatRing(2);
    assertThat(r2.fft([1, 0, 0, 0, 0, 0, 0, 0])).isEqualTo([1, 1, 1, 1, 1, 1, 1, 1]);
    assertThat(r2.fft([0, 1, 0, 0, 0, 0, 0, 0])).isEqualTo([1, 2, 4, 8, -1, -2, -4, -8].map(e => r2.canonicalize(e)));
    assertThat(r2.fft([0, 1, 0, 0, 0, 0, 0, 0])).isEqualTo([1, 2, 4, 8, -1, 15, 13, 9]);
    assertThat(r2.fft([0, 0, 1, 0, 0, 0, 0, 0])).isEqualTo([1, 4, -1, 13, 1, 4, -1, 13]);
    assertThat(r2.fft([0, 0, 0, 1, 0, 0, 0, 0])).isEqualTo([1, 8, 13, 2, -1, 9, 4, 15]);
    assertThat(r2.fft([0, 0, 0, 0, 1, 0, 0, 0])).isEqualTo([1, -1, 1, -1, 1, -1, 1, -1]);
    assertThat(r2.fft([0, 0, 0, 0, 0, 1, 0, 0])).isEqualTo([1, 15, 4, 9, -1, 2, 13, 8]);
    assertThat(r2.fft([0, 0, 0, 0, 0, 0, 1, 0])).isEqualTo([1, 13, -1, 4, 1, 13, -1, 4]);
    assertThat(r2.fft([0, 0, 0, 0, 0, 0, 0, 1])).isEqualTo([1, 9, 13, 15, -1, 8, 4, 2]);

    assertThat(r2.fft([1, 1, 1, 1, 1, 1, 1, 1])).isEqualTo([8, 0, 0, 0, 0, 0, 0, 0]);
    assertThat(r2.fft([0, 0, 1, 0, 0, 0, 0, 1])).isEqualTo([2, 13, 12, 11, 0, 12, 3, 15]);

    let r1p3 = new FermatRing(1, 3);
    assertThat(r1p3.fft([1, 0, 0, 0])).isEqualTo([1, 1, 1, 1]);
    assertThat(r1p3.fft([0, 1, 0, 0])).isEqualTo([1, 8, -1, 57]);
    assertThat(r1p3.fft([0, 0, 1, 0])).isEqualTo([1, -1, 1, -1]);
    assertThat(r1p3.fft([0, 0, 0, 1])).isEqualTo([1, 57, -1, 8]);
});

suite.test("inverse_fft", () => {
    let r2 = new FermatRing(2);

    assertThat(r2.inverse_fft([1, 1, 1, 1, 1, 1, 1, 1])).isEqualTo([1, 0, 0, 0, 0, 0, 0, 0]);
    assertThat(r2.inverse_fft([1, 2, 4, 8, -1, 15, 13, 9])).isEqualTo([0, 1, 0, 0, 0, 0, 0, 0]);
    assertThat(r2.inverse_fft([1, 4, -1, 13, 1, 4, -1, 13])).isEqualTo([0, 0, 1, 0, 0, 0, 0, 0]);
    assertThat(r2.inverse_fft([1, 8, 13, 2, -1, 9, 4, 15])).isEqualTo([0, 0, 0, 1, 0, 0, 0, 0]);
    assertThat(r2.inverse_fft([1, -1, 1, -1, 1, -1, 1, -1])).isEqualTo([0, 0, 0, 0, 1, 0, 0, 0]);
    assertThat(r2.inverse_fft([1, 15, 4, 9, -1, 2, 13, 8])).isEqualTo([0, 0, 0, 0, 0, 1, 0, 0]);
    assertThat(r2.inverse_fft([1, 13, -1, 4, 1, 13, -1, 4])).isEqualTo([0, 0, 0, 0, 0, 0, 1, 0]);
    assertThat(r2.inverse_fft([1, 9, 13, 15, -1, 8, 4, 2])).isEqualTo([0, 0, 0, 0, 0, 0, 0, 1]);

    assertThat(r2.inverse_fft([8, 0, 0, 0, 0, 0, 0, 0])).isEqualTo([1, 1, 1, 1, 1, 1, 1, 1]);
    assertThat(r2.inverse_fft([0, 8, 0, 0, 0, 0, 0, 0])).isEqualTo([1, 9, 13, 15, -1, 8, 4, 2]);
    assertThat(r2.inverse_fft([0, 0, 8, 0, 0, 0, 0, 0])).isEqualTo([1, 13, -1, 4, 1, 13, -1, 4]);
    assertThat(r2.inverse_fft([0, 0, 0, 8, 0, 0, 0, 0])).isEqualTo([1, 15, 4, 9, -1, 2, 13, 8]);
    assertThat(r2.inverse_fft([0, 0, 0, 0, 8, 0, 0, 0])).isEqualTo([1, -1, 1, -1, 1, -1, 1, -1]);
    assertThat(r2.inverse_fft([0, 0, 0, 0, 0, 8, 0, 0])).isEqualTo([1, 8, 13, 2, -1, 9, 4, 15]);
    assertThat(r2.inverse_fft([0, 0, 0, 0, 0, 0, 8, 0])).isEqualTo([1, 4, -1, 13, 1, 4, -1, 13]);
    assertThat(r2.inverse_fft([0, 0, 0, 0, 0, 0, 0, 8])).isEqualTo([1, 2, 4, 8, -1, 15, 13, 9]);

    assertThat(r2.inverse_fft([1, 1, 1, 1, 1, 1, 1, 1])).isEqualTo([1, 0, 0, 0, 0, 0, 0, 0]);
    assertThat(r2.inverse_fft([2, 13, 12, 11, 0, 12, 3, 15])).isEqualTo([0, 0, 1, 0, 0, 0, 0, 1]);

    let r1p3 = new FermatRing(1, 3);
    assertThat(r1p3.inverse_fft([1, 1, 1, 1])).isEqualTo([1, 0, 0, 0]);
    assertThat(r1p3.inverse_fft([1, 8, 64, 57])).isEqualTo([0, 1, 0, 0]);
    assertThat(r1p3.inverse_fft([1, 64, 1, 64])).isEqualTo([0, 0, 1, 0]);
    assertThat(r1p3.inverse_fft([1, 57, 64, 8])).isEqualTo([0, 0, 0, 1]);
});

/**
 * @param {!FermatRing} ring
 * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} list
 */
function reference_fft(ring, list) {
    let result = [];
    for (let i = 0; i < ring.principal_root_order; i++) {
        let t = BigInt.ZERO;
        for (let a = 0; a < ring.principal_root_order; a++) {
            t = ring.canonicalize(t.plus(list[a].shift(a*i)));
        }
        result.push(t);
    }
    return result;
}

suite.test("[i]fft_vs_reference", () => {
    let r2 = new FermatRing(2);
    for (let _ = 0; _ < 10; _++) {
        let list = r2.randomVector();

        let expected = reference_fft(r2, list);
        let actual = r2.fft(list);
        assertThat(actual).withInfo({list, inverse: false}).isEqualTo(expected);
    }
});

suite.test("fft_vs_inverse_fft", () => {
    let r3p3 = new FermatRing(3, 3);
    for (let _ = 0; _ < 10; _++) {
        let list = r3p3.randomVector();

        let back_and_forth = r3p3.inverse_fft(r3p3.fft(list));
        let forth_and_back = r3p3.fft(r3p3.inverse_fft(list));

        assertThat(back_and_forth).isEqualTo(list);
        assertThat(forth_and_back).isEqualTo(list);
    }
});

suite.test("cyclic_convolution", () => {
    let native_multiply = (a, b) => BigInt.of(a.toJavascriptNumber()*b.toJavascriptNumber());
    let c1 = (e1, e2) => new FermatRing(1).cyclic_convolution(e1, e2, native_multiply);
    let c2 = (e1, e2) => new FermatRing(2).cyclic_convolution(e1, e2, native_multiply);
    let c1p3 = (e1, e2) => new FermatRing(1, 3).cyclic_convolution(e1, e2, native_multiply);
    let c2p5 = (e1, e2) => new FermatRing(2, 5).cyclic_convolution(e1, e2, native_multiply);
    let _ = 0;

    assertThat(c1([1, _, _, _], [1, _, _, _])).isEqualTo([1, _, _, _]);
    assertThat(c1([1, _, _, _], [_, 1, _, _])).isEqualTo([_, 1, _, _]);
    assertThat(c1([1, _, _, _], [_, _, 1, _])).isEqualTo([_, _, 1, _]);
    assertThat(c1([1, _, _, _], [_, _, _, 1])).isEqualTo([_, _, _, 1]);

    assertThat(c1([_, 1, _, _], [1, _, _, _])).isEqualTo([_, 1, _, _]);
    assertThat(c1([_, 1, _, _], [_, 1, _, _])).isEqualTo([_, _, 1, _]);
    assertThat(c1([_, 1, _, _], [_, _, 1, _])).isEqualTo([_, _, _, 1]);
    assertThat(c1([_, 1, _, _], [_, _, _, 1])).isEqualTo([1, _, _, _]);

    assertThat(c1([_, _, 1, _], [1, _, _, _])).isEqualTo([_, _, 1, _]);
    assertThat(c1([_, _, 1, _], [_, 1, _, _])).isEqualTo([_, _, _, 1]);
    assertThat(c1([_, _, 1, _], [_, _, 1, _])).isEqualTo([1, _, _, _]);
    assertThat(c1([_, _, 1, _], [_, _, _, 1])).isEqualTo([_, 1, _, _]);

    assertThat(c1([_, _, _, 1], [1, _, _, _])).isEqualTo([_, _, _, 1]);
    assertThat(c1([_, _, _, 1], [_, 1, _, _])).isEqualTo([1, _, _, _]);
    assertThat(c1([_, _, _, 1], [_, _, 1, _])).isEqualTo([_, 1, _, _]);
    assertThat(c1([_, _, _, 1], [_, _, _, 1])).isEqualTo([_, _, 1, _]);

    assertThat(c1([1, 2, 3, 4], [1, _, _, _])).isEqualTo([1, 2, 3, -1]);
    assertThat(c1([1, 2, 3, 4], [_, 2, _, _])).isEqualTo([3, 2, -1, 1]);
    assertThat(c1([1, 2, 3, 4], [_, _, 3, _])).isEqualTo([-1, 2, 3, 1]);
    assertThat(c1([1, 2, 3, 4], [_, _, _, 4])).isEqualTo([3, 2, 1, -1]);
    assertThat(c1([1, 2, 3, 4], [1, 2, _, _])).isEqualTo([-1, -1, 2, 0]);
    assertThat(c1([1, 2, 3, 4], [1, 2, 3, _])).isEqualTo([3, 1, 0, 1]);
    assertThat(c1([1, 2, 3, 4], [1, 2, 3, 4])).isEqualTo([1, 3, 1, 0]);
    assertThat(c1p3([1, 2, 3, 4], [1, 2, 3, 4])).isEqualTo([26, 28, 26, 20]);

    assertThat(c2([1, 2, 3, 4, 5, 6, 7, 8], [2, _, _, _, _, _, _, _])).isEqualTo([2, 4, 6, 8, 10, 12, 14, -1]);
    assertThat(c2([1, 2, 3, 4, 5, 6, 7, 8], [_, 3, _, _, _, _, _, _])).isEqualTo([7, 3, 6, 9, 12, 15, 1, 4]);
    assertThat(c2([1, 2, 3, 4, 5, 6, 7, 8], [2, 3, _, _, _, _, _, _])).isEqualTo([9, 7, 12, 0, 5, 10, 15, 3]);

    assertThat(c2p5([1, 2, 3, 4, 5, 6, 7, 8], [2, _, _, _, _, _, _, _])).isEqualTo([2, 4, 6, 8, 10, 12, 14, 16]);
    assertThat(c2p5([1, 2, 3, 4, 5, 6, 7, 8], [_, 3, _, _, _, _, _, _])).isEqualTo([24, 3, 6, 9, 12, 15, 18, 21]);
    assertThat(c2p5([1, 2, 3, 4, 5, 6, 7, 8], [2, 3, _, _, _, _, _, _])).isEqualTo([26, 7, 12, 17, 22, 27, 32, 37]);
});

suite.test("negacyclic_convolution", () => {
    let native_multiply = (a, b) => BigInt.of(a.toJavascriptNumber()*b.toJavascriptNumber());
    let n1p2 = (e1, e2) => new FermatRing(1, 2).negacyclic_convolution(e1, e2, native_multiply);
    let n2p2 = (e1, e2) => new FermatRing(2, 2).negacyclic_convolution(e1, e2, native_multiply);
    let n2p4 = (e1, e2) => new FermatRing(2, 4).negacyclic_convolution(e1, e2, native_multiply);
    let _ = 0;

    assertThat(n1p2([1, _, _, _], [1, _, _, _])).isEqualTo([1, _, _, _]);
    assertThat(n1p2([1, _, _, _], [_, 1, _, _])).isEqualTo([_, 1, _, _]);
    assertThat(n1p2([1, _, _, _], [_, _, 1, _])).isEqualTo([_, _, 1, _]);
    assertThat(n1p2([1, _, _, _], [_, _, _, 1])).isEqualTo([_, _, _, 1]);

    assertThat(n1p2([_, 1, _, _], [1, _, _, _])).isEqualTo([_, 1, _, _]);
    assertThat(n1p2([_, 1, _, _], [_, 1, _, _])).isEqualTo([_, _, 1, _]);
    assertThat(n1p2([_, 1, _, _], [_, _, 1, _])).isEqualTo([_, _, _, 1]);
    assertThat(n1p2([_, 1, _, _], [_, _, _, 1])).isEqualTo([-1, _, _, _]);

    assertThat(n1p2([_, _, 1, _], [1, _, _, _])).isEqualTo([_, _, 1, _]);
    assertThat(n1p2([_, _, 1, _], [_, 1, _, _])).isEqualTo([_, _, _, 1]);
    assertThat(n1p2([_, _, 1, _], [_, _, 1, _])).isEqualTo([-1, _, _, _]);
    assertThat(n1p2([_, _, 1, _], [_, _, _, 1])).isEqualTo([_, -1, _, _]);

    assertThat(n1p2([_, _, _, 1], [1, _, _, _])).isEqualTo([_, _, _, 1]);
    assertThat(n1p2([_, _, _, 1], [_, 1, _, _])).isEqualTo([-1, _, _, _]);
    assertThat(n1p2([_, _, _, 1], [_, _, 1, _])).isEqualTo([_, -1, _, _]);
    assertThat(n1p2([_, _, _, 1], [_, _, _, 1])).isEqualTo([_, _, -1, _]);

    assertThat(n1p2([1, 2, 3, 4], [1, _, _, _])).isEqualTo([1, 2, 3, 4]);
    assertThat(n1p2([1, 2, 3, 4], [_, 2, _, _])).isEqualTo([17-8, 2, 4, 6]);
    assertThat(n1p2([1, 2, 3, 4], [1, 2, _, _])).isEqualTo([10, 4, 7, 10]);
    assertThat(n1p2([1, 2, 3, 4], [_, _, 3, _])).isEqualTo([8, 5, 3, 6]);
    assertThat(n1p2([1, 2, 3, 4], [1, 2, 3, _])).isEqualTo([1, 9, 10, -1]);
    assertThat(n1p2([1, 2, 3, 4], [_, _, _, 4])).isEqualTo([9, 5, 1, 4]);
    assertThat(n1p2([1, 2, 3, 4], [1, 2, 3, 4])).isEqualTo([10, 14, 11, 3]);

    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [1, _, _, _, _, _, _, _])).isEqualTo([1, 2, 3, 4, 5, 6, 7, 8]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, 1, _, _, _, _, _, _])).isEqualTo([249, 1, 2, 3, 4, 5, 6, 7]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, _, 1, _, _, _, _, _])).isEqualTo([250, 249, 1, 2, 3, 4, 5, 6]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, _, _, 1, _, _, _, _])).isEqualTo([251, 250, 249, 1, 2, 3, 4, 5]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, _, _, _, 1, _, _, _])).isEqualTo([252, 251, 250, 249, 1, 2, 3, 4]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, _, _, _, _, 1, _, _])).isEqualTo([253, 252, 251, 250, 249, 1, 2, 3]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, _, _, _, _, _, 1, _])).isEqualTo([254, 253, 252, 251, 250, 249, 1,2]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, _, _, _, _, _, _, 1])).isEqualTo([255, 254, 253, 252, 251,250,249,1]);

    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [2, _, _, _, _, _, _, _])).isEqualTo([2, 4, 6, 8, 10, 12, 14, 16]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [_, 3, _, _, _, _, _, _])).isEqualTo([233, 3, 6, 9, 12, 15, 18, 21]);
    assertThat(n2p2([1, 2, 3, 4, 5, 6, 7, 8], [2, 3, _, _, _, _, _, _])).isEqualTo([235, 7, 12, 17, 22, 27, 32, 37]);

    assertThat(n2p4([1, 2, 3, 4, 5, 6, 7, 8], [2, _, _, _, _, _, _, _])).isEqualTo([2, 4, 6, 8, 10, 12, 14, 16]);
    assertThat(n2p4([1, 2, 3, 4, 5, 6, 7, 8], [_, 3, _, _, _, _, _, _])).isEqualTo([65513, 3, 6, 9, 12, 15, 18, 21]);
    assertThat(n2p4([1, 2, 3, 4, 5, 6, 7, 8], [2, 3, _, _, _, _, _, _])).isEqualTo([65515, 7, 12, 17, 22, 27, 32, 37]);
});

/**
 * @param {!FermatRing} ring
 * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} list1
 * @param {!Array.<!int> | !Array.<!BigInt> | !Array.<!int | !BigInt>} list2
 * @param {!function(!BigInt, !BigInt) : !BigInt} item_multiplier
 * @returns {!Array.<!BigInt>} the negacyclic convolution of two lists
 * @complexity O(W*N^2)
 */
function reference_negacyclic_convolution(ring, list1, list2, item_multiplier) {
    let result = [];
    for (let i = 0; i < ring.principal_root_order; i++) {
        let t = BigInt.ZERO;
        for (let a = 0; a < ring.principal_root_order; a++) {
            let k = (i - a) & (ring.principal_root_order - 1);
            let p = item_multiplier(list1[a], list2[k]);
            t = ring.canonicalize(a > i ? t.minus(p) : t.plus(p));
        }
        result.push(t);
    }
    return result;
}

suite.test("negacyclic_convolution_vs_naive", () => {
    let native_multiply = (a, b) => BigInt.of(a.toJavascriptNumber()*b.toJavascriptNumber());
    let r3p2 = new FermatRing(3, 2);
    for (let _ = 0; _ < 3; _++) {
        let list1 = r3p2.randomVector();
        let list2 = r3p2.randomVector();
        let actual = r3p2.negacyclic_convolution(list1, list2, native_multiply);
        let expected = reference_negacyclic_convolution(r3p2, list1, list2, native_multiply);
        assertThat(actual).isEqualTo(expected);
    }
});

suite.test("toString", () => {
    assertThat(new FermatRing(5, 2).toString()).isNotEqualTo(undefined);
});
