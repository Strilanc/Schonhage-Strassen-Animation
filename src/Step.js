/**
 * A step in the algorithm, made up of some atomic action or logical combination of other steps.
 */
export default class Step {
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
         * @returns {void}
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

    static halve(bit) {
        return Step.combo(
            'Div' + subscript_digit(bit),
            '#FFA',
            [Step.rotation(bit), Step.hadamard(bit), Step.carry()]);
    }

    static fourier(n) {
        let steps = [];
        for (let i = n - 1; i >= 0; i--) {
            steps.push(Step.halve(i));
        }
        return Step.combo(
            'Fourier',
            '#FAF',
            steps);
    }
}

function subscript_digit(i) {
    return "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089"[i];
}
