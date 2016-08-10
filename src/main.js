let txtInput = /** @type {!HTMLTextAreaElement} */ document.getElementById('txt-input');
let divStep1 = /** @type {!HTMLDivElement} */ document.getElementById('div-step1');
let canvas = /** @type {!HTMLCanvasElement} */ document.getElementById('canvas-state');

function parseDigits(digit_string) {
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
    return digits;
}

txtInput.focus();

const CW = 35;
const CH = 14;

class State {
    /**
     * @param {int[][]} digit_grid
     * @param {int} focus_width
     */
    constructor(digit_grid, focus_width) {
        this.digit_grid = digit_grid;
        this.focus_width = focus_width;
    }

    /**
     * @param {!String} digit_string
     * @returns {!State}
     */
    static fromInput(digit_string) {
        // Ignore all white space.
        digit_string = digit_string.split(/\s/).join('');
        // We're squaring. Negative doesn't matter.
        if (digit_string.startsWith("-")) {
            digit_string = digit_string.substr(1);
        }

        let digits = [];
        for (let e of digit_string) {
            let d = "0123456789".indexOf(e);
            if (d === -1) {
                throw new Error("Not a decimal integer: '" + digit_string + "'");
            }
            digits.push(d);
        }

        let power = Math.ceil(Math.log2(digits.length)/2)+1;
        let padded_height = 1 << power;
        let padded_width = 1 << power;

        let digit_grid = make_grid(padded_width, padded_height, (c, r) => {
            let k = (r*padded_width>>1) + c;
            return k < digits.length && c*2 < padded_width ? digits[k] : 0;
        });

        return new State(digit_grid, digit_grid.length);
    }

    afterRotate(bit) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        let m = 1 << bit;
        return new State(make_grid(w, h, (c, r) => {
            let slope = (c & m) === 0 ? 0 : (c & ~(m-1));
            let {div, mod} = divmod(r - slope, h);
            let f = (div & 1) === 0 ? 1 : -1;
            return this.digit_grid[c][mod] * f;
        }), this.focus_width);
    }

    afterHadamard(bit) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        let m = 1 << bit;
        return new State(make_grid(w, h, (c, r) => {
            let c_bit = (c & m) !== 0;
            let c_off = c & ~m;
            let c_on = c | m;
            let v_off = this.digit_grid[c_off][r];
            let v_on = this.digit_grid[c_on][r];
            return c_bit ? v_off - v_on : v_off + v_on;
        }), this.focus_width/2);
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!int} bit
     * @param {!number} progress
     */
    drawHadamard(ctx, bit, progress) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12px monospace';
        let m = 1 << bit;
        let w_high = w >> (bit + 1);
        for (let c_low = 0; c_low < m; c_low++) {
            for (let r = 0; r < h; r++) {
                let d = h*(m+1)*2;
                let t0 = (c_low*h + r) / d;
                let t1 = (c_low*h + r+1) / d;
                let t2 = (c_low*h + m*h + r) / d;
                let t3 = (c_low*h + m*h + r + 1)/d;
                let showConnector = (progress >= t0 && progress < t1) || (progress >= t2 && progress <= t3);
                let showFormula = progress >= t1 && progress < t3;
                let showResult = progress >= t3;

                for (let c_high = 0; c_high < w_high; c_high++) {

                    let c_off = c_low | (c_high << (bit + 1));
                    let c_on = c_off + m;

                    if (showConnector) {
                        ctx.beginPath();
                        let x1 = (c_off + 0.9)*CW;
                        let x2 = (c_on + 0.9)*CW;
                        let y1 = r*CH;
                        let y2 = r*CH + (m-c_low)*3 + 30;
                        ctx.moveTo(x1, y1);
                        ctx.bezierCurveTo(x1, y1, x2, y2, x2, y1);
                        ctx.strokeStyle = `#008`;
                        ctx.stroke();
                    }

                    for (let c_bit = 0; c_bit < 2; c_bit++) {
                        let c = c_off + c_bit*m;
                        let x = c*CW;
                        let y = r*CH;
                        let v_off = this.digit_grid[c_off][r];
                        let v_on = this.digit_grid[c_on][r];
                        let v_in = this.digit_grid[c][r];
                        let v_out = c_bit ? v_off - v_on : v_off + v_on;
                        let v = showFormula || showResult ? v_out : v_in;
                        let s = (!showFormula ? v+""
                            : c_bit ? v_off + "-" + v_on
                            : v_off + "+" + v_on).split("+-").join('-').split("--").join('+');
                        ctx.fillStyle = v === 0 ? 'rgba(0, 0, 0, 0.4)'
                            : v < 0 ? '#F00'
                            : '#000';
                        ctx.textAlign = 'right';
                        ctx.fillText(s, x + CW, y + CH * 0.8);
                    }
                }
            }
        }
    }

    afterCarry(allowNegative=true) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        let g = make_grid(w, h, (c, r) => this.digit_grid[c][r]);
        for (let c = 0; c < w; c++) {
            let carry = 0;
            for (let r = 0; r < 2 * h; r++) {
                if (r === h) {
                    carry = -carry;
                }
                let v = g[c][r % h] + carry;
                let v2 = v % 10;
                if (!allowNegative) {
                    v2 += 10;
                    v2 %= 10;
                }
                g[c][r % h] = v2;
                carry = (v - v2) / 10;
            }
        }
        return new State(g, this.focus_width);
    }

    drawCarry(ctx, progress, allowNegative=true) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12px monospace';

        let max_r = Math.floor(progress*(h*2+1));
        let g = make_grid(w, h, (c, r) => this.digit_grid[c][r]);
        for (let c = 0; c < w; c++) {
            let carry = 0;
            for (let r = 0; r < max_r; r++) {
                if (r === h) {
                    carry = -carry;
                }
                let v = g[c][r % h] + carry;
                let v2 = v % 10;
                if (!allowNegative) {
                    v2 += 10;
                    v2 %= 10;
                }
                g[c][r % h] = v2;
                carry = (v - v2) / 10;
            }
            for (let r = 0; r < h; r++) {
                let v = g[c][r];

                ctx.fillStyle = v === 0 ? 'rgba(0, 0, 0, 0.4)'
                    : v < 0 ? '#F00'
                    : '#000';
                ctx.textAlign = 'right';

                if (r === max_r || r + h === max_r) {
                    let s = (v>=0?'+':'') + v;
                    ctx.fillText(s, c*CW + CW, r*CH + CH * 0.8);
                    ctx.fillStyle = carry === 0 ? 'rgba(0, 0, 0, 0.4)'
                        : carry < 0 ? '#F00'
                        : '#000';
                    ctx.textAlign = 'right';
                    ctx.fillText((carry >= 0 ? '+' : '') + carry, c * CW - ctx.measureText(s).width, r * CH + CH * 0.8);

                    if (Math.abs(v) >= 10) {
                        ctx.beginPath();
                        ctx.moveTo(c*CW+CW-16, r*CH);
                        ctx.lineTo(c*CW+CW-8, r*CH+CH);
                        ctx.strokeStyle = v < 0 ? 'black' : 'red';
                        ctx.stroke();
                    }
                } else {
                    ctx.fillText(v, c*CW + CW, r*CH + CH * 0.8);
                }
            }
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {!int} bit
     * @param {!number} progress
     */
    drawRotate(ctx, bit, progress) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12px monospace';
        let m = 1 << bit;
        for (let c = 0; c < w; c++) {
            for (let r = 0; r < h; r++) {
                let v = this.digit_grid[c][r];
                let slope = (c & m) === 0 ? 0 : (c & ~(m-1));
                let slope_slow = divmod(slope, h*2).mod;
                let {div, mod: y} = divmod(r*CH + slope_slow*progress*CH, h*CH);
                v *= (div & 1) === 0 ? 1 : -1;
                ctx.fillStyle = v === 0 ? '#BBB'
                    : v < 0 ? '#F00'
                    : '#000';
                ctx.textAlign = 'right';
                ctx.fillText(v, c * CW + CW, y + CH*0.8);
                if (y > h*CH-CH) {
                    ctx.fillStyle = v === 0 ? '#BBB'
                        : -v < 0 ? '#F00'
                        : '#000';
                    ctx.fillText(""+-v, c*CW + CW, y + CH*0.8 - h*CH);
                }
                if (r === 0) {
                    ctx.fillStyle = 'red';
                    let sy = divmod(r*CH + slope*CH, h*CH*2).mod;
                    if (sy === h*CH) {
                        sy -= 1;
                    }
                    ctx.fillRect((c+0.5)*CW, sy % (h*CH), CW/2, 1);
                    ctx.fillStyle = 'black';
                    ctx.fillRect((c+0.5)*CW, y, CW/2, 1);
                }
            }
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, -CH, w*CW, CH);
        ctx.fillRect(0, h*CH, w*CW, CH);
    }
}

class Step {
    constructor(process, drawBar, duration) {
        /**
         * @param {State} input
         * @returns {{output: State, drawer: function(ctx: CanvasRenderingContext2D, progress: number)}}
         */
        this.process = process;
        /**
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         */
        this.drawBar = drawBar;
        /**
         * @type {number}
         */
        this.duration = duration;
    }

    /**
     * @private
     */
    static _draw_bar(ctx, label, color, x, y, w, h) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#000';
        ctx.font = '16px serif';
        ctx.textAlign = 'left';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + 0.5 * w, y + 0.5 * h);
        ctx.restore();
    }

    /**
     * @param {function(ctx: CanvasRenderingContext2D, state: State, progress: number)} draw
     * @param {function(State): State} after
     * @param {string} label
     * @param {string} color
     * @param {number} duration
     * @returns {Step}
     */
    static atom(draw, after, label, color, duration) {
        return new Step(
            input => ({
                output: after(input),
                drawer: (ctx, progress) => draw(ctx, input, progress)
            }),
            (ctx, x, y, w, h) => Step._draw_bar(ctx, label, color, x, y, w, h),
            duration);
    }

    static combo(label, color, steps) {
        let duration = 0;
        for (let e of steps) {
            duration += e.duration;
        }

        let process = input => {
            let drawers = [];
            let output = input;
            for (let e of steps) {
                let processed = e.process(output);
                output = processed.output;
                drawers.push(processed.drawer);
            }

            let drawer = (ctx, progress) => {
                let time = progress * duration;
                for (let i = 0; i < steps.length; i++) {
                    if (time < steps[i].duration) {
                        drawers[i](ctx, time / steps[i].duration);
                        break;
                    }
                    time -= steps[i].duration;
                }
            };

            return {output, drawer};
        };

        let drawBar = (ctx, x, y, w, h) => {
            Step._draw_bar(ctx, label, color, x, y, w, h);
            for (let e of steps) {
                let sw = w * e.duration / duration;
                e.drawBar(ctx, x, y + h, sw, h);
                x += sw;
            }
        };

        return new Step(process, drawBar, duration);
    }

    static hadamard(i) {
        return Step.atom(
            (ctx, s, t) => s.drawHadamard(ctx, i, t),
            s => s.afterHadamard(i),
            'H' + subscript_digit(i),
            '#FAA',
            1);
    }

    static rotation(i) {
        return Step.atom(
            (ctx, s, t) => s.drawRotate(ctx, i, t),
            s => s.afterRotate(i),
            'R' + subscript_digit(i),
            '#AFA',
            0.5);
    }

    static carry() {
        return Step.atom(
            (ctx, s, t) => s.drawCarry(ctx, t, false),
            s => s.afterCarry(false),
            'C',
            '#AAF',
            1);
    }

    static divide(bit) {
        return Step.combo(
            'Divide ' + bit,
            '#FFA',
            [Step.rotation(bit), Step.hadamard(bit), Step.carry()]);
    }

    static divide_many(n) {
        let steps = [];
        for (let i = n - 1; i >= 0; i--) {
            steps.push(Step.divide(i));
        }
        return Step.combo(
            'Shatter',
            '#FAF',
            steps);
    }
}

function draw_separators(ctx, state) {
    ctx.save();
    for (let k = 0; k < state.digit_grid.length; k += state.focus_width) {
        ctx.fillStyle = `rgba(0, 0, 0, ${k/state.digit_grid.length/4})`;
        ctx.fillRect(k*CW+6, 0, state.focus_width*CW, state.digit_grid[0].length*CH);
        ctx.strokeStyle = 'black';
        if (k > 0) {
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.moveTo(k * CW + 6, 0);
            ctx.lineTo(k * CW + 6, state.digit_grid[0].length * CH);
            ctx.stroke();
        }
        if (state.focus_width > 1) {
            ctx.beginPath();
            ctx.setLineDash([4, 2]);
            ctx.strokeStyle = '#AAA';
            ctx.moveTo((k + state.focus_width / 2) * CW + 6, 0);
            ctx.lineTo((k + state.focus_width / 2) * CW + 6, state.digit_grid[0].length * CH);
            ctx.stroke();
        }
    }
    ctx.restore();
}

class AlgorithmDemo {
    constructor(digit_string) {
        this.state = State.fromInput(digit_string);
        let f = Math.round(Math.log2(this.state.digit_grid.length));
        this.step = Step.divide_many(f);
        this.processed = this.step.process(this.state);
    }

    draw(ctx, progress) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.processed.drawer(ctx, progress);
        draw_separators(ctx, this.state);
        let y = 300;
        let step_width = 400;
        this.step.drawBar(ctx, 0, y, step_width, 20);
        ctx.fillStyle = '#000';
        ctx.fillRect(progress*step_width, y, 2, 30);
    }
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

function lerp_within(v0, v1, t0, t1, t) {
    let p = (t-t0)/(t1-t0);
    if (p < 0 || p > 1) {
        return undefined;
    }
    return v0 + (v1-v0)*p;
}

function subscript_digit(i) {
    return "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089"[i];
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

txtInput.value = '1234567898765432123456789876543212345678987654321234567898765432';
let shownAlgorithm = new AlgorithmDemo(txtInput.value);
txtInput.addEventListener('keyup', function() {
    try {
        shownAlgorithm = new AlgorithmDemo(txtInput.value);
    } catch (ex) {
        divStep1.innerText = "ERROR: " + ex;
        throw ex;
    }
});

setInterval(() => {
    try {
        let t = (window.performance.now() / 3000 / shownAlgorithm.step.duration) % 1;
        let ctx = canvas.getContext("2d");
        shownAlgorithm.draw(ctx, t);
    } catch (ex) {
        divStep1.innerText = "ERROR: " + ex;
        throw ex;
    }
}, 50);
