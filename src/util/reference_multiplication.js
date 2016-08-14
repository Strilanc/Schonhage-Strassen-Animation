/**
 * Returns the product, as a little-endian decimal digit array, of two numbers given as little-endian digit arrays.
 * @param {Array.<int>} digits_a
 * @param {Array.<int>} digits_b
 * @returns {Array.<int>}
 */
function multiply_schoolbook(digits_a, digits_b) {
    let total = [];
    for (let i = 0; i < digits_a.length; i++) {
        total = _add(total, _scale([...new Array(i), ...digits_b], digits_a[i]));
    }
    return total;
}

function _add(digits_a, digits_b) {
    let n = Math.max(digits_a.length, digits_b.length);
    let result = [];
    for (let i = 0; i < n; i++) {
        result.push(~~digits_a[i] + ~~digits_b[i]);
    }
    return _carry(result);
}

function _scale(digits, factor) {
    return _carry(digits.map(e => e*factor));
}

function _carry(digits) {
    let c = 0;
    let result = [];
    for (let i = 0; i < digits.length || c !== 0; i++) {
        c += ~~digits[i];
        let r = c%10;
        result.push(r);
        c -= r;
        c /= 10;
    }
    return result;
}

export {multiply_schoolbook}
