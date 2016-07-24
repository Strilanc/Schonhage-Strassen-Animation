import { assertThat } from "test/testing/Test.js"
import BigInt from "src/util/BigInt.js"

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

export {testAllSmallCases, testRandomCasesAgainstNative, testRandomLargeCasesAgainst}
