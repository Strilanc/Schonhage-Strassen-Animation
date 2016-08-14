import LeafState from "src/LeafState.js"
import { divmod } from "src/util/util.js"

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
        let r = this._recurse('afterSplit', ...args);
        if (!(r instanceof NodeState)) {
            return new NodeState(r);
        }
        return r;
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

function subscript_digit(i) {
    return "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089"[i];
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
