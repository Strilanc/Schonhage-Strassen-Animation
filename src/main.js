let txtInput = /** @type {!HTMLTextAreaElement} */ document.getElementById('txt-input');
let divStep1 = /** @type {!HTMLDivElement} */ document.getElementById('div-step1');
let canvas = /** @type {!HTMLCanvasElement} */ document.getElementById('canvas-state');

function redraw() {
    let state = State.fromInput(txtInput.value);
    state.draw(canvas);
}

txtInput.addEventListener('keyup', function() {
    try {
        redraw();
    } catch (ex) {
        divStep1.innerText = "ERROR: " + ex;
        throw ex;
    }
});

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

const CW = 60;
const CH = 20;
class State {
    /**
     * @param {int[][]} digit_grid
     */
    constructor(digit_grid) {
        this.digit_grid = digit_grid;
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

        let padded_length = 1 << (Math.ceil(Math.log2(digits.length) / 2) + 1);

        let digit_grid = make_grid(padded_length, padded_length, (c, r) => {
            let k = (r*padded_length>>1) + c;
            return k < digits.length && c*2 < padded_length ? digits[k] : 0;
        });

        return new State(digit_grid);
    }

    draw(canvas) {
        this.drawRotate(canvas, 0, 0)
    }


    afterRotate(slope) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        return new State(make_grid(w, h, (c, r) => {
            let {div, mod} = divmod(r - slope*c, h);
            let f = (div & 1) === 0 ? 1 : -1;
            return this.digit_grid[c][mod] * f;
        }));
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
        }));
    }

    /**
     * @param {!HTMLCanvasElement} canvas
     * @param {!int} bit
     * @param {!number} time
     */
    drawHadamard(canvas, bit, time) {
        let ctx = /** @type {!CanvasRenderingContext2D} */ canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12pt monospace';
        let m = 1 << bit;
        let w_high = w >> (bit + 1);
        for (let c_low = 0; c_low < m; c_low++) {
            for (let r = 0; r < h; r++) {
                let t0 = (c_low+r/h)/(m+2)/2;
                let t1 = (c_low+r/h+1/h)/(m+2)/2;
                let t2 = (c_low+m+r/h)/(m+2)/2;
                let t3 = (c_low+m+r/h+1/h)/(m+2)/2;
                let showConnector = (time >= t0 && time < t1) || (time >= t2 && time <= t3);
                let showFormula = time >= t1 && time < t3;
                let showResult = time >= t3;

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
                        ctx.strokeStyle = `#AAA`;
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

    afterCarry() {
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
                g[c][r % h] = v2;
                carry = (v2 - v) / 10;
            }
        }
        return new State(g);
    }

    drawCarry(canvas, time) {
        let ctx = /** @type {!CanvasRenderingContext2D} */ canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12pt monospace';

        let max_r = Math.floor(time*(h*2+1));
        let g = make_grid(w, h, (c, r) => this.digit_grid[c][r]);
        for (let c = 0; c < w; c++) {
            let carry = 0;
            for (let r = 0; r < max_r; r++) {
                if (r === h) {
                    carry = -carry;
                }
                let v = g[c][r % h] + carry;
                let v2 = v % 10;
                g[c][r % h] = v2;
                carry = (v - v2) / 10;
            }
            for (let r = 0; r < h; r++) {
                let v = g[c][r];

                ctx.fillStyle = v === 0 ? 'rgba(0, 0, 0, 0.4)'
                    : v < 0 ? '#F00'
                    : '#000';
                ctx.textAlign = 'right';
                ctx.fillText(v, c*CW + CW, r*CH + CH * 0.8);

                if (r === max_r || r + h === max_r) {
                    ctx.fillStyle = carry === 0 ? 'rgba(0, 0, 0, 0.4)'
                        : carry < 0 ? '#F00'
                        : '#000';
                    ctx.textAlign = 'left';
                    ctx.fillText((carry >= 0 ? '+' : '') + carry, c * CW + CW, r * CH + CH * 0.8);

                    if (Math.abs(v) >= 10) {
                        ctx.beginPath();
                        ctx.moveTo(c*CW+CW-16, r*CH);
                        ctx.lineTo(c*CW+CW-8, r*CH+CH);
                        ctx.strokeStyle = v < 0 ? 'black' : 'red';
                        ctx.stroke();
                    }
                }
            }
        }
    }

    /**
     * @param {!HTMLCanvasElement} canvas
     * @param {!int} slope
     * @param {!number} time
     */
    drawRotate(canvas, slope, time) {
        let ctx = /** @type {!CanvasRenderingContext2D} */ canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12pt monospace';
        for (let c = 0; c < w; c++) {
            for (let r = 0; r < h; r++) {
                let v = this.digit_grid[c][r];
                let slope_slow = divmod(slope*c, h).mod;
                let {div, mod: y} = divmod(r*CH + slope_slow*time*CH, h*CH);
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
                    ctx.fillStyle = 'black';
                    ctx.fillRect(c*CW+4, y, CW, 1);
                    ctx.fillStyle = 'red';
                    ctx.fillRect(c*CW+4, divmod(r*CH + slope*c*CH, h*CH).mod, CW/2, 1);
                }
            }
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, -CH, w*CW, CH);
        ctx.fillRect(0, h*CH, w*CW, CH);
    }
}

txtInput.value = '1234567898765432123456789876543212345678987654321234567898765432';
redraw();

setInterval(() => {
    let h_step = i => ({
        draw: (s, t) => s.drawHadamard(canvas, i, t),
        after: s => s.afterHadamard(i)
    });
    let r_step = i => ({
        draw: (s, t) => s.drawRotate(canvas, i, t),
        after: s => s.afterRotate(i)
    });
    let c_step = {
        draw: (s, t) => s.drawCarry(canvas, t),
        after: s => s.afterCarry()
    };
    let steps = [
        h_step(3),
        c_step,
        r_step(4),
        h_step(2),
        c_step,
        r_step(2),
        h_step(1),
        c_step,
        r_step(1),
        h_step(0),
        c_step
    ];
    try {
        let state = State.fromInput(txtInput.value);
        let t = (window.performance.now() / 3000) % steps.length;
        let i;
        for (i = 0; t - i >= 1; i++) {
            state = steps[i].after(state);
        }
        steps[i].draw(state, t - i);
    } catch (ex) {
        divStep1.innerText = "ERROR: " + ex;
        throw ex;
    }
}, 50);

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
