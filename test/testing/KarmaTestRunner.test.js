import { Suite } from "test/testing/Test.js";

let tryPromiseRun = method => {
    try {
        return Promise.resolve(method());
    } catch (ex) {
        return Promise.reject(ex);
    }
};

let promiseRunTest = (suite, name, method) => {
    let result = {
        description: name,
        suite: [suite.name],
        success: false,
        log: [],
        time: undefined
    };
    let status = {warn_only: false};

    let t0;
    let t1;
    let promise = tryPromiseRun(() => {
        t0 = performance.now();
        let result = method(status);
        t1 = performance.now(); // Hack: only measures the synchronous time.
        return result;
    });
    let finish = () => {
        result.time = t1 - t0;
        if (result.time > 1000) {
            console.warn(`${suite.name}.${name} took ${Math.ceil(result.time)}ms to run.`)
        }
        __karma__.result(result);
        return result;
    };

    return promise.then(() => {
        result.success = true;
        if (status.warn_only) {
            console.warn(`${suite.name}.${name} passed, but is set to warn_only (${status.warn_only})`)
        }
        return finish();
    }, ex => {
        result.log.push(String(ex));
        if (ex.details !== undefined) {
            result.log.push(ex.details);
        }
        if (ex.stack !== undefined) {
            result.log.push(ex.stack);
        }
        if (status.warn_only) {
            console.warn(`${suite.name}.${name} FAILED, but is set to warn_only (${status.warn_only})`)
        }
        result.success = status.warn_only;
        return finish();
    });
};

__karma__.start = () => {
    let total = 0;
    for (let suite of Suite.suites) {
        total += suite.tests.length;
    }
    __karma__.info({ total: total });

    let all = Promise.all(Suite.suites.map(suite => {
        if (suite.tests.length === 0) {
            console.warn(`Empty test suite: ${suite.name}`);
        }
        let suiteResult = Promise.all(suite.tests.map(e => promiseRunTest(suite, e[0], e[1])));
        suiteResult.catch(() => console.error(`${suite.name} suite failed`));
        return suiteResult;
    }));

    all.then(() => __karma__.complete());
};
