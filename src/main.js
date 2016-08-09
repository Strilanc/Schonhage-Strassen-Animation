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
            let {div, mod} = divmod(r + slope*c, h);
            let f = (div & 1) === 0 ? 1 : -1;
            return this.digit_grid[c][mod] * f;
        }));
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
        let d = 20;
        ctx.font = '12pt monospace';
        for (let c = 0; c < w; c++) {
            for (let r = 0; r < h; r++) {
                let v = this.digit_grid[c][r];
                let {div, mod: y} = divmod(r*d + slope*c*time*d, h*d);
                v *= (div & 1) === 0 ? 1 : -1;
                ctx.fillStyle = v === 0 ? '#BBB'
                    : v < 0 ? '#F00'
                    : '#000';
                ctx.fillText(v, c * d, y + d*0.8);
                if (y > h*d-d) {
                    ctx.fillStyle = v === 0 ? '#BBB'
                        : -v < 0 ? '#F00'
                        : '#000';
                    ctx.fillText(""+-v, c*d, y + d*0.8 - h*d);
                }
                if (r === 0) {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(c*d, y, d, 1);
                }
            }
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, -d, w*d, d);
        ctx.fillRect(0, h*d, w*d, d);
    }
}

txtInput.value = '1234567898765432123456789876543212345678987654321234567898765432';
redraw();

setInterval(() => {
    try {
        let state = State.fromInput(txtInput.value);
        let t = (window.performance.now() / 1000) % 2;
        if (t > 1) {
            t = 2 - t;
        }
        state.drawRotate(canvas, 2, t);
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
