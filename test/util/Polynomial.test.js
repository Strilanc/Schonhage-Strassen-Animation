import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"
import Polynomial from "src/util/Polynomial.js"
import multiply_integer_Karatsuba from "src/integer_multiplication/Karatsuba.js"
import multiply_polynomial_Schoolbook from "src/polynomial_multiplication/Schoolbook.js"

let suite = new Suite("Polynomial");

suite.test("constructor", () => {
    //noinspection JSAccessibilityCheck
    assertThat(new Polynomial([])._coefficients).isEqualTo([]);
    //noinspection JSAccessibilityCheck
    assertThat(new Polynomial([0])._coefficients).isEqualTo([]);
    //noinspection JSAccessibilityCheck
    assertThat(new Polynomial([BigInt.ZERO])._coefficients).isEqualTo([]);
    //noinspection JSAccessibilityCheck
    assertThat(new Polynomial([1])._coefficients).isEqualTo([1]);
    //noinspection JSAccessibilityCheck
    assertThat(new Polynomial([1, 2, BigInt.ZERO, BigInt.ONE, BigInt.ZERO, 0])._coefficients).isEqualTo([1, 2, 0, 1]);
    //noinspection JSAccessibilityCheck
    assertThat(new Polynomial([1])._coefficients[0] instanceof BigInt).isEqualTo(true);
});

suite.test("isEqualTo", () => {
    assertThat([
        [""],
        [0, BigInt.ZERO, Polynomial.ZERO, new Polynomial([]), new Polynomial([0]), new Polynomial([BigInt.ZERO])],
        [1, Polynomial.ONE, new Polynomial([1]), new Polynomial([BigInt.ONE])],
        [-1, Polynomial.MINUS_ONE, new Polynomial([-1, 0])],
        [Polynomial.X, new Polynomial([0, 1])],
        [new Polynomial([1, 1])],
        [new Polynomial([1, 2])]
    ]).isMadeUpOfEquivalenceGroups();

    assertThat(new Polynomial([1, 2, 3])).isEqualTo(new Polynomial([1, 2, 3]));
    assertThat(new Polynomial([1, 2, 3])).isNotEqualTo(new Polynomial([1, 2, 4]));
    assertThat(new Polynomial([1]).isEqualTo_BigInt(BigInt.ONE)).isEqualTo(true);
});

suite.test("toString", () => {
    assertThat(Polynomial.ZERO.toString()).isEqualTo("0");
    assertThat(Polynomial.ONE.toString()).isEqualTo("1");
    assertThat(Polynomial.MINUS_ONE.toString()).isEqualTo("-1");
    assertThat(new Polynomial([1, 9, 2, -3, 0, 4, 5]).toString()).isEqualTo("5*X^6 + 4*X^5 - 3*X^3 + 2*X^2 + 9*X + 1");
    assertThat(new Polynomial([-2, -2, -2, -2]).toString()).isEqualTo("-2*X^3 - 2*X^2 - 2*X - 2");
    assertThat(new Polynomial([-1, -1, -1, -1]).toString()).isEqualTo("-X^3 - X^2 - X - 1");
    assertThat(new Polynomial([1, 1, 1, 1]).toString()).isEqualTo("X^3 + X^2 + X + 1");
});

suite.test("of", () => {
    assertThat(Polynomial.ofCoefs()).isEqualTo(0);
    assertThat(Polynomial.ofCoefs(1)).isEqualTo(1);
    assertThat(Polynomial.ofCoefs(2)).isEqualTo(2);
    assertThat(Polynomial.ofCoefs(3, 4, 5)).isEqualTo(new Polynomial([5, 4, 3]));
    assertThat(Polynomial.ofCoefs(0, 0, 3, 4, 5, 0, 0, 0)).isEqualTo(new Polynomial([0, 0, 0, 5, 4, 3]));
});

suite.test("splitIntoNPiecesOfSize", () => {
    assertThat(Polynomial.ofCoefs(1, 2, 3, 4, 5, 6, 7, 8).splitIntoNPiecesOfSize(2, 4)).isEqualTo([
        Polynomial.ofCoefs(5, 6, 7, 8),
        Polynomial.ofCoefs(1, 2, 3, 4)
    ]);
    assertThat(Polynomial.ofCoefs(1, 2, 3, 4, 5, 6, 7, 8).splitIntoNPiecesOfSize(4, 3)).isEqualTo([
        Polynomial.ofCoefs(6, 7, 8),
        Polynomial.ofCoefs(3, 4, 5),
        Polynomial.ofCoefs(0, 1, 2),
        Polynomial.ofCoefs(0, 0, 0)
    ]);
    assertThat(Polynomial.ofCoefs(1, 2, 3, 4, 5, 6, 7, 8).splitIntoNPiecesOfSize(undefined, 3)).isEqualTo([
        Polynomial.ofCoefs(6, 7, 8),
        Polynomial.ofCoefs(3, 4, 5),
        Polynomial.ofCoefs(0, 1, 2)
    ]);
});

suite.test("coefficient", () => {
    assertThat(Polynomial.ofCoefs(1, 2, 3, 4, 5, 6, 7, 8).coefficient(0)).isEqualTo(8);
    assertThat(Polynomial.ofCoefs(1, 2, 3, 4, 5, 6, 7, 8).coefficient(2)).isEqualTo(6);
    assertThat(Polynomial.ofCoefs(1, 2, 3, 4, 5, 6, 7, 8).coefficient(203)).isEqualTo(0);
    assertThat(Polynomial.ofCoefs().coefficient(0)).isEqualTo(0);
});

suite.test("plus", () => {
    assertThat(Polynomial.ofCoefs().plus(Polynomial.ofCoefs(1))).isEqualTo(1);
    assertThat(Polynomial.ofCoefs(2).plus(Polynomial.ofCoefs(3))).isEqualTo(5);
    assertThat(Polynomial.ofCoefs(6).plus(Polynomial.ofCoefs(-9))).isEqualTo(-3);
    assertThat(Polynomial.ofCoefs(1, 2, 3).plus(Polynomial.ofCoefs(2, 3, 5, 7))).
        isEqualTo(Polynomial.ofCoefs(2, 4, 7, 10));
});

suite.test("minus", () => {
    assertThat(Polynomial.ofCoefs().minus(Polynomial.ofCoefs(1))).isEqualTo(-1);
    assertThat(Polynomial.ofCoefs(2).minus(Polynomial.ofCoefs(3))).isEqualTo(-1);
    assertThat(Polynomial.ofCoefs(6).minus(Polynomial.ofCoefs(-9))).isEqualTo(15);
    assertThat(Polynomial.ofCoefs(1, 2, 3).minus(Polynomial.ofCoefs(2, 3, 5, 7))).
        isEqualTo(Polynomial.ofCoefs(-2, -2, -3, -4));
});

suite.test("modXnPlus1", () => {
    assertThat(Polynomial.ofCoefs(
        1000, 2000, 3000, 40000,
        100, 200, 300, 400,
        10, 20, 30, 40,
        1, 2, 3, 4
    ).modXnPlus1(4)).isEqualTo(Polynomial.ofCoefs(1-10+100-1000, 2-20+200-2000, 3-30+300-3000, 4-40+400-40000));

    assertThat(Polynomial.ofCoefs(
        1000, 2000, 3000, 40000,
        100, 200, 300, 400,
        10, 20, 30, 40,
        1, 2, 3, 4
    ).modXnPlus1(8)).isEqualTo(Polynomial.ofCoefs(10-1000, 20-2000, 30-3000, 40-40000, 1-100, 2-200, 3-300, 4-400));
});

suite.test("shiftModXnPlus1", () => {
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(0, 3)).isEqualTo(Polynomial.ofCoefs(1, 2, 3));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(1, 3)).isEqualTo(Polynomial.ofCoefs(2, 3, -1));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(2, 3)).isEqualTo(Polynomial.ofCoefs(3, -1, -2));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(3, 3)).isEqualTo(Polynomial.ofCoefs(-1, -2, -3));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(4, 3)).isEqualTo(Polynomial.ofCoefs(-2, -3, 1));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(5, 3)).isEqualTo(Polynomial.ofCoefs(-3, 1, 2));

    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(6, 3)).isEqualTo(Polynomial.ofCoefs(1, 2, 3));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(7, 3)).isEqualTo(Polynomial.ofCoefs(2, 3, -1));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(8, 3)).isEqualTo(Polynomial.ofCoefs(3, -1, -2));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(6*100+3, 3)).isEqualTo(Polynomial.ofCoefs(-1, -2, -3));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(6*-97+4, 3)).isEqualTo(Polynomial.ofCoefs(-2, -3, 1));

    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(0, 4)).isEqualTo(Polynomial.ofCoefs(1, 2, 3));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(1, 4)).isEqualTo(Polynomial.ofCoefs(1, 2, 3, 0));
    assertThat(Polynomial.ofCoefs(1, 2, 3).shiftModXnPlus1(2, 4)).isEqualTo(Polynomial.ofCoefs(2, 3, 0, -1));
});

suite.test("fft", () => {
    let _ = Polynomial.ZERO;
    let X = Polynomial.X;
    let X2 = Polynomial.XToThe(2);
    let X3 = Polynomial.XToThe(3);
    let X4 = Polynomial.XToThe(4);
    let nX = _.minus(X);
    let nX2 = _.minus(X2);
    let nX3 = _.minus(X3);
    let nX4 = _.minus(X4);

    // Raw frequencies.
    assertThat(Polynomial.fft([1, _, _, _], 1)).isEqualTo([1,  1,  1,  1]);
    assertThat(Polynomial.fft([_, 1, _, _], 1)).isEqualTo([1,  X, -1, nX]);
    assertThat(Polynomial.fft([_, _, 1, _], 1)).isEqualTo([1, -1,  1, -1]);
    assertThat(Polynomial.fft([_, _, _, 1], 1)).isEqualTo([1, nX, -1,  X]);

    // Anti frequencies.
    assertThat(Polynomial.fft([1,  1,  1,  1], 1)).isEqualTo([4, _, _, _]);
    assertThat(Polynomial.fft([1,  X, -1, nX], 1)).isEqualTo([_, _, _, 4]);
    assertThat(Polynomial.fft([1, -1,  1, -1], 1)).isEqualTo([_, _, 4, _]);
    assertThat(Polynomial.fft([1, nX, -1,  X], 1)).isEqualTo([_, 4, _, _]);

    // Scaling.
    let R = Polynomial.ofCoefs(2, 3, 5, 7);
    assertThat(Polynomial.fft([R, _, _, _], 2)).isEqualTo([R, R, R, R]);

    // Root power.
    assertThrows(() => Polynomial.fft([_, 1, _, _], 0));
    assertThat(Polynomial.fft([_, 1, _, _], 1)).isEqualTo([1, X, -1, nX]);
    assertThat(Polynomial.fft([_, 1, _, _], 2)).isEqualTo([1, X2, -1, nX2]);
    assertThat(Polynomial.fft([_, 1, _, _], 3)).isEqualTo([1, X4, -1, nX4]);

    // Bigger frequency.
    assertThat(Polynomial.fft([_, 1, _, _, _, _, _, _], 2)).isEqualTo([1, X, X2, X3, -1, nX, nX2, nX3]);
});

suite.test("inverse_fft", () => {
    let _ = Polynomial.ZERO;
    let X = Polynomial.X;
    let X2 = Polynomial.XToThe(2);
    let X3 = Polynomial.XToThe(3);
    let X4 = Polynomial.XToThe(4);
    let nX = _.minus(X);
    let nX2 = _.minus(X2);
    let nX3 = _.minus(X3);
    let nX4 = _.minus(X4);

    // Raw frequencies.
    assertThat(Polynomial.inverse_fft([4, _, _, _], 1)).isEqualTo([1,  1,  1,  1]);
    assertThat(Polynomial.inverse_fft([_, 4, _, _], 1)).isEqualTo([1, nX, -1,  X]);
    assertThat(Polynomial.inverse_fft([_, _, 4, _], 1)).isEqualTo([1, -1,  1, -1]);
    assertThat(Polynomial.inverse_fft([_, _, _, 4], 1)).isEqualTo([1,  X, -1, nX]);

    // Anti frequencies.
    assertThat(Polynomial.inverse_fft([1,  1,  1,  1], 1)).isEqualTo([1, _, _, _]);
    assertThat(Polynomial.inverse_fft([1,  X, -1, nX], 1)).isEqualTo([_, 1, _, _]);
    assertThat(Polynomial.inverse_fft([1, -1,  1, -1], 1)).isEqualTo([_, _, 1, _]);
    assertThat(Polynomial.inverse_fft([1, nX, -1,  X], 1)).isEqualTo([_, _, _, 1]);

    // Scaling.
    let R = Polynomial.ofCoefs(2, 3, 5, 7);
    let R4 = Polynomial.ofCoefs(8, 12, 20, 28);
    assertThat(Polynomial.inverse_fft([R4, _, _, _], 2)).isEqualTo([R, R, R, R]);

    // Root power.
    assertThrows(() => Polynomial.inverse_fft([_, 4, _, _], 0));
    assertThat(Polynomial.inverse_fft([_, 4, _, _], 1)).isEqualTo([1, nX , -1, X ]);
    assertThat(Polynomial.inverse_fft([_, 4, _, _], 2)).isEqualTo([1, nX2, -1, X2]);
    assertThat(Polynomial.inverse_fft([_, 4, _, _], 3)).isEqualTo([1, nX4, -1, X4]);

    // Bigger frequency.
    assertThat(Polynomial.inverse_fft([_, 8, _, _, _, _, _, _], 2)).isEqualTo([1, nX3, nX2, nX, -1, X3, X2, X]);
});

suite.test("cyclic_convolution", () => {
    let mul = (a, b) => multiply_polynomial_Schoolbook(a, b, multiply_integer_Karatsuba);
    let assertThatCyclicConvolutionOf = (u, v, e=2) => assertThat(Polynomial.cyclic_convolution(
        u,
        v,
        e,
        mul));

    assertThatCyclicConvolutionOf([1, 0, 0, 0], [1, 2, 3, 4]).isEqualTo([1, 2, 3, 4]);
    assertThatCyclicConvolutionOf([0, 1, 0, 0], [1, 2, 3, 4]).isEqualTo([4, 1, 2, 3]);
    assertThatCyclicConvolutionOf([0, 0, 1, 0], [1, 2, 3, 4]).isEqualTo([3, 4, 1, 2]);
    assertThatCyclicConvolutionOf([0, 0, 0, 1], [1, 2, 3, 4]).isEqualTo([2, 3, 4, 1]);

    let R = Polynomial.ofCoefs(2, 3, 5, 7);
    assertThatCyclicConvolutionOf([R, 0, 0, 0], [1, 2, 3, 4]).isEqualTo([R, mul(R, 2), mul(R, 3), mul(R, 4)]);
    assertThatCyclicConvolutionOf([0, R, 0, 0], [1, 2, 3, 4]).isEqualTo([mul(R, 4), R, mul(R, 2), mul(R, 3)]);
    let S = Polynomial.ofCoefs(11, 13, 17, 19);
    assertThatCyclicConvolutionOf([0, R, 0, 0], [0, S, 0, 0], 2).isEqualTo([0, 0, mul(R, S).modXnPlus1(4), 0]);
    assertThatCyclicConvolutionOf([0, R, 0, 0], [0, S, 0, 0], 3).isEqualTo([0, 0, mul(R, S), 0]);
    assertThatCyclicConvolutionOf([0, 0, R, 0], [0, 0, S, 0], 2).isEqualTo([mul(R, S).modXnPlus1(4), 0, 0, 0]);
    assertThatCyclicConvolutionOf([0, 0, R, 0], [0, 0, S, 0], 3).isEqualTo([mul(R, S), 0, 0, 0]);
});

suite.test("negacyclic_convolution", () => {
    let mul = (a, b) => multiply_polynomial_Schoolbook(a, b, multiply_integer_Karatsuba);
    let assertThatNegacyclicConvolutionOf = (u, v, e=2) => assertThat(Polynomial.negacyclic_convolution(
        u,
        v,
        e,
        mul));

    assertThatNegacyclicConvolutionOf([1, 0, 0, 0], [1, 2, 3, 4]).isEqualTo([1, 2, 3, 4]);
    assertThatNegacyclicConvolutionOf([0, 1, 0, 0], [1, 2, 3, 4]).isEqualTo([-4, 1, 2, 3]);
    assertThatNegacyclicConvolutionOf([0, 0, 1, 0], [1, 2, 3, 4]).isEqualTo([-3, -4, 1, 2]);
    assertThatNegacyclicConvolutionOf([0, 0, 0, 1], [1, 2, 3, 4]).isEqualTo([-2, -3, -4, 1]);

    let R = Polynomial.ofCoefs(2, 3, 5, 7);
    assertThatNegacyclicConvolutionOf([R, 0, 0, 0], [1, 2, 3, 4]).isEqualTo([R, mul(R, 2), mul(R, 3), mul(R, 4)]);
    assertThatNegacyclicConvolutionOf([0, R, 0, 0], [1, 2, 3, 4]).isEqualTo([mul(R, -4), R, mul(R, 2), mul(R, 3)]);
    let S = Polynomial.ofCoefs(11, 13, 17, 19);
    assertThatNegacyclicConvolutionOf([0, R, 0, 0], [0, S, 0, 0], 2).isEqualTo([0, 0, mul(R, S).modXnPlus1(4), 0]);
    assertThatNegacyclicConvolutionOf([0, R, 0, 0], [0, S, 0, 0], 3).isEqualTo([0, 0, mul(R, S), 0]);
    assertThatNegacyclicConvolutionOf([0, 0, R, 0], [0, 0, S, 0], 2).
        isEqualTo([mul(mul(R, S).modXnPlus1(4), -1), 0, 0, 0]);
    assertThatNegacyclicConvolutionOf([0, 0, R, 0], [0, 0, S, 0], 3).isEqualTo([mul(mul(R, S), -1), 0, 0, 0]);
});

