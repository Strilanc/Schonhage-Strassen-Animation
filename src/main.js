import LeafState from "src/LeafState.js"
import Step from "src/Step.js"
import { divmod } from "src/util/util.js"

let txtInput = /** @type {!HTMLTextAreaElement} */ document.getElementById('txt-input');
let canvas = /** @type {!HTMLCanvasElement} */ document.getElementById('canvas-state');

const DURATION_PER_STEP = 500; // millis
const BLOCK_MARGIN = 12;

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
        w += BLOCK_MARGIN;
        h += BLOCK_MARGIN;
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

class AlgorithmDemo {
    constructor(digit_string) {
        this.state = new NodeState(LeafState.fromInput(digit_string));
        let f = Math.round(Math.log2(this.state.content.digit_grid.length));
        this.step = Step.combo(
            'square',
            '#FFF',
            [
                Step.fourier(f),
                Step.split(),
                Step.combo('recurse', '#FFF', [
                    Step.fourier(f>>1),
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

// Start animating *after* the module loading phase has finished, so bugs don't kill the loading process.
setTimeout(() => {
    txtInput.value = '1234567898765432123456789876543212345678987654321234567898765432';
    let shownAlgorithm = new AlgorithmDemo(txtInput.value);
    txtInput.addEventListener('keyup', function () {
        shownAlgorithm = new AlgorithmDemo(txtInput.value);
    });

    function redraw() {
        try {
            let t = (window.performance.now() / DURATION_PER_STEP / shownAlgorithm.step.duration) % 1;
            let ctx = canvas.getContext("2d");
            shownAlgorithm.draw(ctx, t);
        } finally {
            requestAnimationFrame(redraw);
        }
    }
    redraw();
}, 0);
