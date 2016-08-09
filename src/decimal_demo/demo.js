/**
 * @param {string} digit_string
 * @returns {string}
 */
function square(digit_string) {
    // Parse.
    if (digit_string.startsWith("-")) {
        digit_string = digit_string.substr(1); // We're squaring. Negative doesn't matter.
    }
    let digits = [];
    for (let e of digit_string) {
        let d = "0123456789".indexOf(e);
        if (d === -1) {
            throw new Error("Not a decimal integer: '" + digit_string + "'");
        }
        digits.push(d);
    }

    // Square.
    digits.reverse();
    digits = square_with_wrap(digits, Math.ceil(Math.log2(digits.length)) + 1);
    digits.reverse();

    // toString.
    return digits.join('');
}

/**
 * @param {int[]} digits
 * @param {int} word_size_exponent
 * @returns {int[]}
 */
function square_with_wrap(digits, word_size_exponent) {
    // Split into pieces.
    let sub_word_size_exponent = word_size_exponent / 2;
    let sub_word_size = 1 << sub_word_size_exponent;
    let sub_word_count = 1 << sub_word_size_exponent;
    let sub_words = [];
    for (let i = 0; i < sub_word_count; i++) {
        sub_words.push(digits.slice(i*sub_word_size, i*sub_word_size + 1));
    }

    // Multiply the pieces together with a convolution.
    let convolved = phased_cyclic_convolution(sub_words, word_size_exponent, sub_word_size);

    // Recombine the pieces.
    let carry = [];
    let out = [];
    for (let piece of convolved) {
        carry = add_digits(carry, piece);
        out.push(...carry.slice(0, sub_word_size));
        carry = carry.slice(sub_word_size);
    }
    out.push(...carry);

    // That's all!
    return wrap_digits(out, word_size_exponent);
}

/**
 * @param {int[][]} words
 * @param {int} word_size_exponent
 * @param {int} phase_per_cycle
 * @returns {int[][]}
 */
function phased_cyclic_convolution(words, word_size_exponent, phase_per_cycle) {
    // Singleton base case is just a squaring of the word.
    if (words.length === 1) {
        return [square_with_wrap(words[0], word_size_exponent)];
    }

    // Reduce to two half-sized convolutions with finer phase factors.
    let half_phase = phase_per_cycle >> 1;
    let half_len = words.length >> 1;
    let [a, b] = [words.slice(0, half_len), words.slice(half_len)];
    b = b.map(w => phase_digits(w, half_phase, word_size_exponent));
    [a, b] = Hadamard_words(a, b, word_size_exponent);

    // Recurse.
    a = phased_cyclic_convolution(a, half_len, half_phase);
    b = phased_cyclic_convolution(b, half_len, -half_phase);

    // Recover.
    [a, b] = Hadamard_words(a, b, word_size_exponent);
    b = b.map(w => phase_digits(w, -half_phase, word_size_exponent));
    return a.concat(b);
}

/**
 * @param {int[]} digits1
 * @param {int[]} digits2
 * @returns {int[]}
 */
function add_digits(digits1, digits2) {
    let result = [];
    let carry = 0;
    let n = Math.max(digits1.length, digits2.length);
    for (let i = 0; i < n; i++) {
        let sum = (+digits1[i]) + (+digits2[i]) + carry;
        carry = Math.floor(sum/10);
        result.push(sum - carry*10);
    }
    result.push(carry);
    return result;
}

/**
 * @param {int[]} digits
 * @param {int} rotation_amount
 * @param {int} word_size_exponent
 * @returns {int[]}
 */
function phase_digits(digits, rotation_amount, word_size_exponent) {
    let len = 1 << word_size_exponent;
    rotation_amount &= len - 1;
    let head = digits.slice(rotation_amount);
    let missing = new Array(len - digits.length);
    let tail = digits.slice(0, rotation_amount);
    missing.fill(0);
    return head.concat(missing).concat(tail);
}

/**
 * @param {int[]} digits
 * @param {int} word_size_exponent
 * @returns {int[]}
 */
function wrap_digits(digits, word_size_exponent) {
    let max_length = 1 << word_size_exponent;
    if (digits.length < max_length) {
        return digits;
    }
    let total = [];
    for (let i = 0; i < digits.length; i += max_length) {
        total = add_digits(total, digits.slice(i, i + max_length));
    }
    return wrap_digits(total, word_size_exponent);
}

/**
 * @param {int[][]} words1
 * @param {int[][]} words2
 * @param {int} word_size_exponent
 * @returns {int[][]}
 */
function Hadamard_words(words1, words2, word_size_exponent) {
    let a = [];
    let b = [];
    let n = Math.max(words1.length, words2.length);
    for (let i = 0; i < n; i++) {
        let w1 = words1[i];
        let w2 = words2[i];
        a.push(wrap_digits(add_digits(w1, w2), word_size_exponent));
        b.push(wrap_digits(add_digits(w1, w2.map(e => -e)), word_size_exponent));
    }
    return [a, b];
}

export {
    square,
    square_with_wrap,
    phased_cyclic_convolution,
    add_digits,
    phase_digits,
    wrap_digits,
    Hadamard_words
}
