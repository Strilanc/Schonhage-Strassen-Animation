let txtInput = /** @type {!HTMLTextAreaElement} */ document.getElementById('txt-input');
let divStep1 = /** @type {!HTMLDivElement} */ document.getElementById('div-step1');
let canvas = /** @type {!HTMLCanvasElement} */ document.getElementById('canvas-state');

const DURATION_PER_STEP = 1000; // millis
const CW = 35;
const CH = 12;

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

class NodeState {
    /**
     * @param {NodeState[]|LeafState} content
     */
    constructor(content) {
        this.content = content;
    }

    _recurse(key, ...args) {
        if (this.content instanceof LeafState) {
            let r = this.content[key](...args);
            return r instanceof NodeState ? r : new NodeState(r);
        }
        return new NodeState(this.content.map(e => e[key](...args)));
    }

    /**
     * @param {string} key
     * @param {CanvasRenderingContext2D} ctx
     * @param {*} args
     * @private
     */
    _recurseDraw(key, ctx, ...args) {
        if (this.content instanceof LeafState) {
            this.content[key](ctx, ...args);
            return;
        }

        let n = Math.round(Math.sqrt(this.content.length));
        let {w, h} = this.content[0].drawSize();
        w += CH;
        h += CH;
        for (let i = 0; i < this.content.length; i++) {
            let r = divmod(i, n);
            ctx.save();
            ctx.translate(r.div*w, r.mod*h);
            this.content[i][key](ctx, ...args);
            ctx.restore();
        }
    }

    drawSize() {
        let e = this.content instanceof LeafState ? this.content : this.content[0];
        let n = this.content instanceof LeafState ? 1 : Math.round(Math.sqrt(this.content.length));
        let {w, h} = e.drawSize();
        return {w: w*n, h: h*n};
    }

    afterSplit(...args) {
        return this._recurse('afterSplit', ...args);
    }

    drawSplit(ctx, ...args) {
        return this._recurseDraw('drawSplit', ctx, ...args);
    }

    afterHadamard(...args) {
        return this._recurse('afterHadamard', ...args);
    }

    drawSeparators(ctx, ...args) {
        return this._recurseDraw('drawSeparators', ctx, ...args);
    }

    afterRotate(...args) {
        return this._recurse('afterRotate', ...args);
    }

    afterCarry(...args) {
        return this._recurse('afterCarry', ...args);
    }

    drawRotate(ctx, ...args) {
        return this._recurseDraw('drawRotate', ctx, ...args);
    }

    drawHadamard(ctx, ...args) {
        return this._recurseDraw('drawHadamard', ctx, ...args);
    }

    drawCarry(ctx, ...args) {
        return this._recurseDraw('drawCarry', ctx, ...args);
    }
}

class LeafState {
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
     * @returns {!LeafState}
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

        return new LeafState(digit_grid, digit_grid.length);
    }

    drawSize() {
        return {w: this.digit_grid.length*CW+6, h: this.digit_grid[0].length*CH};
    }
    
    afterRotate(bit) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        let m = 1 << bit;
        return new LeafState(make_grid(w, h, (c, r) => {
            let slope = (c & m) === 0 ? 0 : (c & ~(m-1));
            let {div, mod} = divmod(r - slope, h);
            let f = (div & 1) === 0 ? 1 : -1;
            return this.digit_grid[c][mod] * f;
        }), this.focus_width);
    }

    afterHadamard(bit) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        let m = 1 << bit;
        return new LeafState(make_grid(w, h, (c, r) => {
            let c_bit = (c & m) !== 0;
            let c_off = c & ~m;
            let c_on = c | m;
            let v_off = this.digit_grid[c_off][r];
            let v_on = this.digit_grid[c_on][r];
            return c_bit ? v_off - v_on : v_off + v_on;
        }), this.focus_width/2);
    }

    afterSplit() {
        let children = [];
        for (let col of this.digit_grid) {
            let n = Math.round(Math.sqrt(col.length));
            let subcols = [];
            for (let i = 0; i < n; i++) {
                subcols.push([...col.slice(i*n, i*n + n), ...new Array(n).fill(0)]);
            }
            children.push(new LeafState(subcols, subcols.length));
        }
        return new NodeState(children);
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!number} progress
     */
    drawSplit(ctx, progress) {
        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12px monospace';

        let w2 = Math.round(Math.sqrt(this.digit_grid[0].length));
        let h2 = this.digit_grid[0].length / w2;

        let t0 = 0;
        let t1 = 0.4;
        let t2 = 0.8;
        let t3 = 0.9;
        let g = make_grid(w, h, (c, r) => this.digit_grid[c][r]);
        for (let c = 0; c < h; c++) {
            for (let c2 = 0; c2 < w2; c2++) {
                for (let r2 = 0; r2 < h2; r2++) {
                    let r = c2*w2 + r2;
                    let v = g[c][r];

                    let x1 = c*CW + CW;
                    let x2 = x1;
                    let x3 = Math.floor(c/h2)*(w2+1)*CW + CW + c2*CW;
                    let y1 = r*CH + CH*0.8;
                    let y2 = r*CH + CH*0.8 + (c%h2)*(h2*CH+CH);
                    let y3 = r2*CH + CH*0.8 + (c%h2)*(h2*2*CH+CH);
                    let x = lerp_within(x1, x2, t0, t1, progress) ||
                            lerp_within(x2, x3, t1, t2, progress) ||
                            x3;
                    let y = lerp_within(y1, y2, t0, t1, progress) ||
                            lerp_within(y2, y3, t1, t2, progress) ||
                            y3;

                    if (r === 0 && progress < t1) {
                        ctx.strokeRect(x-CW+6, y-CH, CW, CH*h+2);
                    }
                    if (r2 === 0) {
                        let s = 0;
                        if (progress > t1 && progress < t2) {
                            s = (progress-t1)/(t2-t1);
                        }
                        if (progress >= t2) {
                            s = 1;
                        }
                        let s2 = 1;
                        if (progress >= t2 && progress <= t3) {
                            s2 = 1-(progress-t2)/(t3-t2);
                        }
                        if (progress >= t3) {
                            s2 = 0;
                        }
                        this.drawSeparatorSection(ctx, c*(1-s), x-CW+6, y-CH, CW, CH*h2*(1+s));
                        ctx.strokeStyle = `rgba(0,0,0,${Math.min(1, progress/t1)*s2})`;
                        ctx.strokeRect(x-CW+6, y-CH, CW, CH*h2*(1+s)+2*(1-s));
                        if (c2 === 0 && progress >= t2) {
                            ctx.strokeStyle = `#000`;
                            ctx.strokeRect(x-CW+6, y-CH, CW*w2, CH*h2*2);
                        }
                    }
                    ctx.fillStyle = sign_highlight(v);
                    ctx.textAlign = 'right';
                    ctx.fillText(v, x, y);
                }
                for (let r2 = h2; r2 < 2*h2; r2++) {
                    let r = c2*w2 + r2;
                    if (progress <= t2) {
                        continue;
                    }
                    let x = Math.floor(c/h2)*(w2+1)*CW + CW + c2*CW;
                    let y = r2*CH + CH*0.8 + (c%h2)*(h2*2*CH+CH);
                    ctx.save();
                    ctx.fillStyle = sign_highlight(0);
                    ctx.globalAlpha = Math.min(1, (progress-t2)/(t3-t2));
                    ctx.textAlign = 'right';
                    ctx.fillText('0', x, y);
                    ctx.restore();
                }
            }
        }
    }

    /**
     * @param {!CanvasRenderingContext2D} ctx
     * @param {!int} bit
     * @param {!number} progress
     */
    drawHadamard(ctx, bit, progress) {
        this.drawSeparators(ctx);

        let [w, h] = [this.digit_grid.length, this.digit_grid[0].length];
        ctx.font = '12px monospace';
        let m = 1 << bit;
        let w_high = w >> (bit + 1);
        for (let c_low = 0; c_low < m; c_low++) {
            for (let r = 0; r < h; r++) {
                let d = (h+1)*m*2;
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
                        let y1 = (r+0.5)*CH;
                        let y2 = (r+0.5)*CH + (m-c_low)*3 + 30;
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
                        if (showFormula) {
                            ctx.textAlign = 'right';
                            let cx = x + CW;
                            let s1 = Math.abs(v_on) + '';
                            let s2 = (c_bit != (v_on < 0)) ? '-' : '+';
                            let s3 = v_off + '';
                            ctx.fillStyle = sign_highlight(v_on);
                            ctx.fillText(s1, cx, y + CH * 0.8);
                            cx -= ctx.measureText(s1).width;
                            ctx.fillStyle = sign_highlight(c_bit ? -1 : +1);
                            ctx.fillText(s2, cx, y + CH * 0.8);
                            cx -= ctx.measureText(s2).width;
                            ctx.fillStyle = sign_highlight(v_off);
                            ctx.fillText(s3, cx, y + CH * 0.8);
                        } else {
                            let v = showResult ? v_out : v_in;
                            let s = (!showFormula ? v+""
                                : c_bit ? v_off + "-" + v_on
                                : v_off + "+" + v_on).split("+-").join('-').split("--").join('+');
                            ctx.fillStyle = sign_highlight(v);
                            ctx.textAlign = 'right';
                            ctx.fillText(s, x + CW, y + CH * 0.8);
                        }
                    }
                }
            }
        }
        this.drawOutline(ctx);
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
        return new LeafState(g, this.focus_width);
    }

    drawCarry(ctx, progress, allowNegative=true) {
        this.drawSeparators(ctx);
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

                ctx.fillStyle = sign_highlight(v);
                ctx.textAlign = 'right';

                if (r === max_r || r + h === max_r) {
                    let s = (v>=0?'+':'') + v;
                    ctx.fillText(s, c*CW + CW, r*CH + CH * 0.8);
                    ctx.fillStyle = sign_highlight(carry);
                    ctx.textAlign = 'right';
                    let cx = c * CW + CW - ctx.measureText(s).width;
                    ctx.fillText((carry >= 0 ? '+' : '') + carry, cx, r * CH + CH * 0.8);

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
        this.drawOutline(ctx);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {!int} bit
     * @param {!number} progress
     */
    drawRotate(ctx, bit, progress) {
        this.drawSeparators(ctx);
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
                ctx.fillStyle = sign_highlight(v);
                ctx.textAlign = 'right';
                ctx.fillText(v, c * CW + CW, y + CH*0.8);
                if (y > h*CH-CH) {
                    ctx.fillStyle = sign_highlight(v);
                    ctx.fillText(""+-v, c*CW + CW, y + CH*0.8 - h*CH);
                }
                if (r === 0 && slope !== 0) {
                    ctx.fillStyle = 'red';
                    let sy = divmod(r*CH + slope*CH, h*CH*2).mod;
                    if (sy === h*CH) {
                        sy -= 1;
                    }
                    ctx.fillRect(c*CW+6, sy % (h*CH), CW, 1);
                    ctx.fillStyle = 'black';
                    ctx.fillRect(c*CW+6, y, CW, 1);
                }
            }
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, -11, w*CW, 11);
        ctx.fillRect(0, h*CH, w*CW, 11);
        this.drawOutline(ctx);
    }

    drawOutline(ctx) {
        let {w, h} = this.drawSize();
        ctx.strokeStyle = '#000';
        ctx.strokeRect(0, 0, w, h);
    }
    drawSeparators(ctx) {
        for (let k = 0; k < this.digit_grid.length; k += this.focus_width) {
            this.drawSeparatorSection(ctx,k, k*CW+6, 0, this.focus_width*CW, this.digit_grid[0].length*CH);
        }
    }
    drawSeparatorSection(ctx, k, x, y, w, h) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${k/this.digit_grid.length/4})`;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'black';
        if (k > 0) {
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + h);
            ctx.stroke();
        }
        if (this.focus_width > 1) {
            ctx.beginPath();
            ctx.setLineDash([4, 2]);
            ctx.strokeStyle = '#AAA';
            ctx.moveTo(x + (w / 2), y);
            ctx.lineTo(x + (w / 2), y + h);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class Step {
    constructor(process, drawBar, duration) {
        /**
         * @param {NodeState} input
         * @returns {{output: NodeState, drawer: function(ctx: CanvasRenderingContext2D, progress: number)}}
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
     * @param {function(ctx: CanvasRenderingContext2D, state: NodeState, progress: number)} draw
     * @param {function(NodeState): NodeState} after
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
            0.8);
    }

    static split(i) {
        return Step.atom(
            (ctx, s, t) => s.drawSplit(ctx, t),
            s => s.afterSplit(i),
            'split',
            '#FFA',
            5);
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
            'Div' + subscript_digit(bit),
            '#FFA',
            [Step.rotation(bit), Step.hadamard(bit), Step.carry()]);
    }

    static divide_many(n) {
        let steps = [];
        for (let i = n - 1; i >= 0; i--) {
            steps.push(Step.divide(i));
        }
        return Step.combo(
            'Fourier',
            '#FAF',
            steps);
    }
}

class AlgorithmDemo {
    constructor(digit_string) {
        this.state = new NodeState(LeafState.fromInput(digit_string));
        let f = Math.round(Math.log2(this.state.content.digit_grid.length));
        this.step = Step.combo(
            'square',
            '#FFF',
            [
                Step.divide_many(f),
                Step.split(),
                Step.combo('recurse', '#FFF', [
                    Step.divide_many(f>>1),
                    Step.split(),
                    Step.combo('recurse', '#FFF', [
                    Step.atom(
                        (ctx, s, t) => s.drawRotate(ctx, 0),
                        e => e,
                        'base',
                        '#FFF',
                        3)
                    ])
                ])
            ]
        );
        this.processed = this.step.process(this.state);
    }

    draw(ctx, progress) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.processed.drawer(ctx, progress);
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

function sign_highlight(v) {
    return v === 0 ? 'rgba(0, 0, 0, 0.4)'
        : v < 0 ? '#F00'
        : '#000';
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

setTimeout(() => {
    txtInput.value = '1234567898765432123456789876543212345678987654321234567898765432';
    let shownAlgorithm = new AlgorithmDemo(txtInput.value);
    txtInput.addEventListener('keyup', function () {
        try {
            shownAlgorithm = new AlgorithmDemo(txtInput.value);
        } catch (ex) {
            divStep1.innerText = "ERROR: " + ex;
            throw ex;
        }
    });

    function redraw() {
        try {
            let t = (window.performance.now() / DURATION_PER_STEP / shownAlgorithm.step.duration) % 1;
            t += 0.17;
            t %= 1;
            let ctx = canvas.getContext("2d");
            shownAlgorithm.draw(ctx, t);
        } finally {
            requestAnimationFrame(redraw);
        }
    }
    redraw();
}, 0);
