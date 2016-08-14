/**
 * @param {!int | *} val
 * @returns {!int|undefined}
 */
function exact_lg2(val) {
    if (val < 1 || !Number.isInteger(val) || (val & (val-1)) !== 0) {
        return undefined;
    }
    let result = 0;
    while (val > 1) {
        val >>= 1;
        result++;
    }
    return result;
}

/**
 * @param {!int} val
 * @returns {!int}
 */
function floor_lg2(val) {
    if (val < 1 || !Number.isInteger(val)) {
        throw new Error("val isn't a positive integer")
    }
    let s = Math.ceil(Math.log2(val));
    if ((1<<s) > val) {
        s -= 1;
    }
    return s;
}

/**
 * @param {!int} val
 * @returns {!int}
 */
function ceil_lg2(val) {
    if (!Number.isInteger(val)) {
        throw new Error("val isn't a positive integer")
    }
    if (val < 1) {
        return 0;
    }
    let s = Math.floor(Math.log2(val));
    if ((1<<s) < val) {
        s += 1;
    }
    return s;
}

/**
 * @param {number} a
 * @param {number} b
 * @returns {{div: number, mod: number}}
 */
function divmod(a, b) {
    let div = Math.floor(a / b);
    let mod = a - b*div;
    return {div, mod}
}

/**
 * @param {!int} val
 * @param {!int} bit_count
 * @returns {!int}
 */
function _reverse_bit_order(val, bit_count) {
    let result = 0;
    for (let p = 0; p < bit_count; p++) {
        if ((val & (1<<p)) !== 0) {
            result |= 1<<(bit_count-p-1);
        }
    }
    return result;
}

/**
 * @param {!Array.<T>} list
 * @returns {!Array.<T>}
 * @template T
 */
function swap_index_bit_orders(list) {
    let result = [];

    let bit_count = 1;
    while ((1<<bit_count) < list.length) { bit_count+=1; }

    for (let i = 0; i < list.length; i++) {
        result.push(list[_reverse_bit_order(i, bit_count)]);
    }
    return result;
}

/**
 * @param {!Array.<T>} list
 * @returns {!Array.<T>}
 * @template T
 */
function reversed_list(list) {
    let result = [];
    for (let i = 0; i < list.length; i++) {
        result.push(list[list.length - i - 1]);
    }
    return result;
}

/**
 * Inserts a bit into a number, shifting existing bits out of the way.
 * @param {!int} val
 * @param {!int} offset
 * @param {!boolean} bit
 * @returns {!int}
 */
function splice_bit(val, offset, bit) {
    let m = (1 << offset) - 1;
    let low = val & m;
    let high = val & ~m;
    return low | (bit << offset) | (high << 1);
}

/**
 * @param {T} value
 * @param {!int} length
 * @returns {!Array.<T>}
 * @template T
 */
function repeat(value, length) {
    let result = new Array(length);
    result.fill(value);
    return result;
}

/**
 * @param {!number} a
 * @param {!number} b
 * @returns {!number}
 */
function proper_mod(a, b) {
    return ((a%b)+b)%b;
}

/**
 * @param {int} width
 * @param {int} height
 * @param {function(x: int, y: int) : T} value_func
 * @returns {Array.<T>}
 * @template T
 */
function make_grid(width, height, value_func) {
    let grid = [];
    for (let c = 0; c < width; c++) {
        let col = [];
        for (let r = 0; r < height; r++) {
            col.push(value_func(c, r));
        }
        grid.push(col);
    }
    return grid;
}

export {
    make_grid,
    repeat,
    splice_bit,
    reversed_list,
    swap_index_bit_orders,
    floor_lg2,
    ceil_lg2,
    exact_lg2,
    proper_mod,
    divmod
}
