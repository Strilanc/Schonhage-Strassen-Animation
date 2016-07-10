import describe from "test/testing/Describe.js"
import equate from "test/testing/Equate.js"

let assertionSubjectIndexInNextTest = 1;

/**
 * @param {!string} message
 */
export function fail(message) {
    throw new Error(message);
}

/**
 * @param {*} subject
 * @throws
 */
function sanityCheck(subject) {
    if (subject instanceof Map) {
        for (let k in subject) {
            if (subject.hasOwnProperty(k)) {
                throw new Error(`Map has property 'map[${k}]' instead of entry 'map.get(${k})'. Probably a mistake.`)
            }
        }
    }
}

export class AssertionSubject {
    /**
     * @param {*} subject
     * @param {*} id
     * @param {*} info
     * @property {*} subject
     */
    constructor(subject, id=undefined, info=undefined) {
        sanityCheck(subject);

        /**
         * The "actual" value, to be compared against expected values.
         * @type {*}
         */
        this.subject = subject;
        /**
         * @type {*}
         */
        this.id = id;
        /**
         * @type {*}
         */
        this.info = info;

        assertionSubjectIndexInNextTest += 1;
    }

    /**
     * @param {*} newInfo
     * @returns {!AssertionSubject}
     */
    withInfo(newInfo) {
        return new AssertionSubject(this.subject, this.id, newInfo);
    }

    /**
     * @param {!string} message
     * @private
     */
    _fail(message) {
        let idMessage = this.id === undefined ? message : `${message} (${this.id})`;
        let infoMessage = this.info === undefined ? idMessage : `${idMessage} (info: ${describe(this.info)})`;
        fail(infoMessage);
    }

    /**
     * @private
     */
    _failExpected(relation, expected) {
        let act = describe(this.subject);
        let exp = describe(expected);
        if (act.length + exp.length < 50) {
            this._fail(`Got <${act}> but expected it ${relation} <${exp}>.`);
        } else {
            this._fail(`Got <\n\t${act}\n> but expected it ${relation} <\n\t${exp}\n>.`);
        }
    }

    /**
     * @param {*} other
     */
    isEqualTo(other) {
        if (!equate(this.subject, other)) {
            this._failExpected('to equal', other);
        }
    }

    /**
     * @param {*} other
     */
    isNotEqualTo(other) {
        if (equate(this.subject, other)) {
            this._failExpected('to NOT equal', other);
        }
    }

    isMadeUpOfEquivalenceGroups() {
        for (let g1 of this.subject) {
            for (let g2 of this.subject) {
                for (let e1 of g1) {
                    for (let e2 of g2) {
                        if (g1 === g2) {
                            assertThat(e1).withInfo({g1, g2}).isEqualTo(e2);
                        } else {
                            assertThat(e1).withInfo({g1, g2}).isNotEqualTo(e2);
                        }
                        assertionSubjectIndexInNextTest -= 1;
                    }
                }
            }
        }
    }
}

/**
 * Returns an assertion subject for the given value, which can be fluently extended with conditions like "isEqualTo".
 * @param {*} subject
 * @param {=undefined} extraArgCatcher
 * returns {!AssertionSubject}
 */
export function assertThat(subject, extraArgCatcher) {
    if (extraArgCatcher !== undefined) {
        fail('Extra assertThat arg');
    }
    return new AssertionSubject(subject, 'assertThat #' + assertionSubjectIndexInNextTest);
}

/**
 * Invokes a function, requiring it to throw an exception. Returns the exception wrapped in an assertion subject.
 * @param {function()} func
 * @param {=undefined} extraArgCatcher
 * returns {!AssertionSubject}
 */
export function assertThrows(func, extraArgCatcher) {
    if (extraArgCatcher !== undefined) {
        fail('Extra assertThrows arg');
    }
    try {
        func();
    } catch(ex) {
        return new AssertionSubject(ex, 'assertThrows');
    }
    fail('Expected an exception to be thrown by ' + func);
    return undefined;
}

/**
 * A named collection of tests.
 */
export class Suite {
    /**
     * @param {!string} name
     */
    constructor(name) {
        Suite.suites.push(this);
        /** @type {!(!function(!{ warn_only: !boolean|!string })[])} */
        this.tests = [];
         /** @type {!string} */
        this.name = name;
    }

    /**
     * @param {!string} name
     * @param {!function(!{ warn_only: !boolean|!string })} method
     */
    test(name, method) {
        this.tests.push([name, status => {
            assertionSubjectIndexInNextTest = 1;
            let result = method(status);
            if (result === undefined && assertionSubjectIndexInNextTest === 1) {
                console.warn(`No assertions in test '${name}' of suite '${this.name}'.`);
            }
            return result;
        }]);
    }
}

Suite.suites = [];
