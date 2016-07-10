import { Suite, assertThat, assertThrows } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"

let suite = new Suite("BigInt");

suite.test("constructor", () => {
    let a = new BigInt([true, false], true);
    //noinspection JSAccessibilityCheck
    assertThat(a._bits).isEqualTo([true, false]);
    //noinspection JSAccessibilityCheck
    assertThat(a._tail).isEqualTo(true);

    let b = new BigInt([true, false, true], true);
    //noinspection JSAccessibilityCheck
    assertThat(b._bits).isEqualTo([true, false]);
    //noinspection JSAccessibilityCheck
    assertThat(b._tail).isEqualTo(true);

    let c = new BigInt([true, false], false);
    //noinspection JSAccessibilityCheck
    assertThat(c._bits).isEqualTo([true]);
    //noinspection JSAccessibilityCheck
    assertThat(c._tail).isEqualTo(false);
});

suite.test("is", () => {
    assertThat(BigInt.of(-2).isNegative()).isEqualTo(true);
    assertThat(BigInt.of(-2).isNegativeOne()).isEqualTo(false);
    assertThat(BigInt.of(-2).isZero()).isEqualTo(false);
    assertThat(BigInt.of(-2).isOne()).isEqualTo(false);
    assertThat(BigInt.of(-2).isPositive()).isEqualTo(false);

    assertThat(BigInt.of(-1).isNegative()).isEqualTo(true);
    assertThat(BigInt.of(-1).isNegativeOne()).isEqualTo(true);
    assertThat(BigInt.of(-1).isZero()).isEqualTo(false);
    assertThat(BigInt.of(-1).isOne()).isEqualTo(false);
    assertThat(BigInt.of(-1).isPositive()).isEqualTo(false);

    assertThat(BigInt.of(0).isNegative()).isEqualTo(false);
    assertThat(BigInt.of(0).isNegativeOne()).isEqualTo(false);
    assertThat(BigInt.of(0).isZero()).isEqualTo(true);
    assertThat(BigInt.of(0).isOne()).isEqualTo(false);
    assertThat(BigInt.of(0).isPositive()).isEqualTo(false);

    assertThat(BigInt.of(1).isNegative()).isEqualTo(false);
    assertThat(BigInt.of(1).isNegativeOne()).isEqualTo(false);
    assertThat(BigInt.of(1).isZero()).isEqualTo(false);
    assertThat(BigInt.of(1).isOne()).isEqualTo(true);
    assertThat(BigInt.of(1).isPositive()).isEqualTo(true);

    assertThat(BigInt.of(2).isNegative()).isEqualTo(false);
    assertThat(BigInt.of(2).isNegativeOne()).isEqualTo(false);
    assertThat(BigInt.of(2).isZero()).isEqualTo(false);
    assertThat(BigInt.of(2).isOne()).isEqualTo(false);
    assertThat(BigInt.of(2).isPositive()).isEqualTo(true);

    assertThat(BigInt.of(522).isNegative()).isEqualTo(false);
    assertThat(BigInt.of(522).isNegativeOne()).isEqualTo(false);
    assertThat(BigInt.of(522).isZero()).isEqualTo(false);
    assertThat(BigInt.of(522).isOne()).isEqualTo(false);
    assertThat(BigInt.of(522).isPositive()).isEqualTo(true);
});

suite.test("isEqualTo", () => {
    assertThat([
        [""],
        [new BigInt([], false), new BigInt([false], false), 0, BigInt.ZERO],
        [new BigInt([], true), new BigInt([true], true), -1, BigInt.MINUS_ONE],
        [new BigInt([true], false), new BigInt([true, false], false), 1, BigInt.ONE],
        [new BigInt([false, true], false), new BigInt([false, true, false, false, false], false), 2],
        [new BigInt([false], true), new BigInt([false, true], true), -2],
        [new BigInt([true, false], true), -3],
        [new BigInt([false, true, false, false], true), new BigInt([false, true, false, false, true], true), -14]
    ]).isMadeUpOfEquivalenceGroups();
});

suite.test("of", () => {
    assertThat(BigInt.of(-4)).isEqualTo(new BigInt([false, false], true));
    assertThat(BigInt.of(-3)).isEqualTo(new BigInt([true, false], true));
    assertThat(BigInt.of(-2)).isEqualTo(new BigInt([false], true));
    assertThat(BigInt.of(-1)).isEqualTo(new BigInt([], true));
    assertThat(BigInt.of(0)).isEqualTo(new BigInt([], false));
    assertThat(BigInt.of(1)).isEqualTo(new BigInt([true], false));
    assertThat(BigInt.of(2)).isEqualTo(new BigInt([false, true], false));
    assertThat(BigInt.of(3)).isEqualTo(new BigInt([true, true], false));
    assertThat(BigInt.of(4)).isEqualTo(new BigInt([false, false, true], false));
});

suite.test("toJavascriptNumber", () => {
    for (let i = -17; i < 20; i++) {
        assertThat(BigInt.of(i).toJavascriptNumber() === i).isEqualTo(true);
    }
    assertThrows(() => BigInt.parse("123456789123456789123456789123456789123456789123456789").toJavascriptNumber());
    assertThat(BigInt.parse("123456789123456789123456789123456789123456789123456789").toJavascriptNumber(false))
        .isEqualTo(1.2345678912345678e+53);
});

suite.test("parse", () => {
    assertThrows(() => BigInt.parse(""));
    assertThrows(() => BigInt.parse("a"));
    assertThat(BigInt.parse("-1")).isEqualTo(-1);
    assertThat(BigInt.parse("0")).isEqualTo(0);
    assertThat(BigInt.parse("00000")).isEqualTo(0);
    assertThat(BigInt.parse("00010")).isEqualTo(10);
    assertThat(BigInt.parse("1")).isEqualTo(1);
    assertThat(BigInt.parse("2")).isEqualTo(2);
    assertThat(BigInt.parse("-4")).isEqualTo(-4);
    assertThat(BigInt.parse("-123456789")).isEqualTo(-123456789);
    assertThat(BigInt.parse("123456789")).isEqualTo(123456789);
    assertThat(BigInt.parse("1000000")).isEqualTo(1000000);
    assertThat(BigInt.parse("1000001")).isEqualTo(1000001);
    assertThat(BigInt.parse("999999")).isEqualTo(999999);
});

suite.test("toRawString", () => {
    assertThat(BigInt.of(0).toTwosComplementString()).isNotEqualTo(undefined);
});

suite.test("toString", () => {
    assertThat(BigInt.of(-11).toString()).isEqualTo("-11");
    assertThat(BigInt.of(-10).toString()).isEqualTo("-10");
    assertThat(BigInt.of(-9).toString()).isEqualTo("-9");
    assertThat(BigInt.of(-4).toString()).isEqualTo("-4");
    assertThat(BigInt.of(-3).toString()).isEqualTo("-3");
    assertThat(BigInt.of(-2).toString()).isEqualTo("-2");
    assertThat(BigInt.of(-1).toString()).isEqualTo("-1");
    assertThat(BigInt.of(0).toString()).isEqualTo("0");
    assertThat(BigInt.of(1).toString()).isEqualTo("1");
    assertThat(BigInt.of(2).toString()).isEqualTo("2");
    assertThat(BigInt.of(3).toString()).isEqualTo("3");
    assertThat(BigInt.of(4).toString()).isEqualTo("4");
    assertThat(BigInt.of(5).toString()).isEqualTo("5");
    assertThat(BigInt.of(9).toString()).isEqualTo("9");
    assertThat(BigInt.of(10).toString()).isEqualTo("10");
    assertThat(BigInt.of(11).toString()).isEqualTo("11");

    assertThat(BigInt.parse("020").toString()).isEqualTo("20");
    assertThat(BigInt.parse("01234567890123456789").toString()).isEqualTo("1234567890123456789");
    assertThat(BigInt.parse("-01234567890123456789").toString()).isEqualTo("-1234567890123456789");
});

suite.test("_times10", () => {
    assertThat(BigInt.of(123)._times10()).isEqualTo(1230);
    assertThat(BigInt.of(-1)._times10()).isEqualTo(-10);
});

suite.test("negate", () => {
    assertThat(BigInt.of(0).negate()).isEqualTo(0);
    assertThat(BigInt.of(1).negate()).isEqualTo(-1);
    assertThat(BigInt.of(-1).negate()).isEqualTo(1);
    assertThat(BigInt.of(123).negate()).isEqualTo(-123);
    assertThat(BigInt.of(-234).negate()).isEqualTo(234);
});

suite.test("plus", () => {
    for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
            assertThat(BigInt.of(i).plus(j)).withInfo({i, j}).isEqualTo(i+j);
        }
    }
    assertThat(BigInt.of(0).plus(10)).isEqualTo(10);
    assertThat(BigInt.of(5).plus(7)).isEqualTo(12);
    assertThat(BigInt.of(5).plus(3)).isEqualTo(8);
    assertThat(BigInt.of(5).plus(0)).isEqualTo(5);
    assertThat(BigInt.of(5).plus(-3)).isEqualTo(2);
    assertThat(BigInt.of(5).plus(-7)).isEqualTo(-2);
    assertThat(BigInt.parse("12345678901234567890").plus(BigInt.parse("22222222222222222222222222")))
        .isEqualTo(BigInt.parse("22222234567901123456790112"));
    assertThat(BigInt.parse("22222222222222222222222222").plus(BigInt.parse("12345678901234567890")))
        .isEqualTo(BigInt.parse("22222234567901123456790112"));
    assertThat(BigInt.parse("12345678901234567890").plus(BigInt.parse("-22222222222222222222222222")))
        .isEqualTo(BigInt.parse("-22222209876543320987654332"));
});

suite.test("abs", () => {
    assertThat(BigInt.of(-200).abs()).isEqualTo(200);
    assertThat(BigInt.of(-2).abs()).isEqualTo(2);
    assertThat(BigInt.of(-1).abs()).isEqualTo(1);
    assertThat(BigInt.of(0).abs()).isEqualTo(0);
    assertThat(BigInt.of(1).abs()).isEqualTo(1);
    assertThat(BigInt.of(2).abs()).isEqualTo(2);
    assertThat(BigInt.of(200).abs()).isEqualTo(200);
});

suite.test("minus", () => {
    for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
            assertThat(BigInt.of(i).minus(j)).withInfo({i, j}).isEqualTo(i-j);
        }
    }
    assertThat(BigInt.of(0).minus(10)).isEqualTo(-10);
    assertThat(BigInt.of(5).minus(7)).isEqualTo(-2);
    assertThat(BigInt.of(5).minus(3)).isEqualTo(2);
    assertThat(BigInt.of(5).minus(0)).isEqualTo(5);
    assertThat(BigInt.of(5).minus(-3)).isEqualTo(8);
    assertThat(BigInt.of(5).minus(-7)).isEqualTo(12);
    assertThat(BigInt.parse("12345678901234567890").minus(BigInt.parse("22222222222222222222222222")))
        .isEqualTo(BigInt.parse("-22222209876543320987654332"));
    assertThat(BigInt.parse("22222222222222222222222222").minus(BigInt.parse("12345678901234567890")))
        .isEqualTo(BigInt.parse("22222209876543320987654332"));
    assertThat(BigInt.parse("12345678901234567890").minus(BigInt.parse("-22222222222222222222222222")))
        .isEqualTo(BigInt.parse("22222234567901123456790112"));
});

suite.test("shift", () => {
    assertThat(BigInt.of(0).shift(1)).isEqualTo(0);
    assertThat(BigInt.of(1).shift(1)).isEqualTo(2);
    assertThat(BigInt.of(-1).shift(1)).isEqualTo(-2);
    assertThat(BigInt.of(123).shift(3)).isEqualTo(984);

    assertThat(BigInt.of(984).shift(-3)).isEqualTo(123);
    assertThat(BigInt.of(984+7).shift(-3)).isEqualTo(123);
    assertThat(BigInt.of(984-1).shift(-3)).isEqualTo(122);

    assertThat(BigInt.of(-984).shift(-3)).isEqualTo(-123);
    assertThat(BigInt.of(-984+7).shift(-3)).isEqualTo(-123);
    assertThat(BigInt.of(-984-1).shift(-3)).isEqualTo(-124);
});

suite.test("bitwiseAnd", () => {
    for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
            assertThat(BigInt.of(i).bitwiseAnd(j)).withInfo({i, j}).isEqualTo(i & j);
        }
    }
    assertThat(BigInt.of(14).bitwiseAnd(28)).isEqualTo(12);
});

suite.test("bitwiseOr", () => {
    for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
            assertThat(BigInt.of(i).bitwiseOr(j)).withInfo({i, j}).isEqualTo(i | j);
        }
    }
    assertThat(BigInt.of(14).bitwiseOr(28)).isEqualTo(30);
});

suite.test("bitwiseXor", () => {
    for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
            assertThat(BigInt.of(i).bitwiseXor(j)).withInfo({i, j}).isEqualTo(i ^ j);
        }
    }
    assertThat(BigInt.of(14).bitwiseXor(28)).isEqualTo(18);
});

suite.test("random", () => {
    // ~1 in a trillion runs would fail for a properly random implementation
    assertThat(BigInt.random(40)).isNotEqualTo(BigInt.random(40));
});

suite.test("splitIntoNPiecesOfSize", () => {
    assertThrows(() => BigInt.of(16).splitIntoNPiecesOfSize(2, 2));
    assertThat(BigInt.of(15).splitIntoNPiecesOfSize(2, 2)).isEqualTo([3, 3]);
    assertThat(BigInt.of(14).splitIntoNPiecesOfSize(2, 2)).isEqualTo([2, 3]);

    assertThat(BigInt.of(0).splitIntoNPiecesOfSize(5, 2)).isEqualTo([0, 0, 0, 0, 0]);
    assertThat(BigInt.of(-1).splitIntoNPiecesOfSize(2, 10)).isEqualTo([1023, -1]);
});

suite.test("shiftSum", () => {
    assertThat(BigInt.shiftSum([], 0)).isEqualTo(0);
    assertThat(BigInt.shiftSum([101, 53, 2, 101], 0)).isEqualTo(257);
    assertThat(BigInt.shiftSum([101, 53, 2, 101], 1)).isEqualTo(1023);
    assertThat(BigInt.shiftSum([101, 53, 2, 101], 2)).isEqualTo(6809);
});
