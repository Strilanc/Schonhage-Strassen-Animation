import { make_grid, divmod } from "src/util/util.js"

const COL_W = 35;
const COL_H = 12;

export default class LeafState {
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
        return {w: this.digit_grid.length*COL_W+6, h: this.digit_grid[0].length*COL_H};
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
        return children;
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

                    let x1 = c*COL_W + COL_W;
                    let x2 = x1;
                    let x3 = Math.floor(c/h2)*(w2+1)*COL_W + COL_W + c2*COL_W;
                    let y1 = r*COL_H + COL_H*0.8;
                    let y2 = r*COL_H + COL_H*0.8 + (c%h2)*(h2*COL_H+COL_H);
                    let y3 = r2*COL_H + COL_H*0.8 + (c%h2)*(h2*2*COL_H+COL_H);
                    let x = lerp_within(x1, x2, t0, t1, progress) ||
                            lerp_within(x2, x3, t1, t2, progress) ||
                            x3;
                    let y = lerp_within(y1, y2, t0, t1, progress) ||
                            lerp_within(y2, y3, t1, t2, progress) ||
                            y3;

                    if (r === 0 && progress < t1) {
                        ctx.strokeRect(x-COL_W+6, y-COL_H, COL_W, COL_H*h+2);
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
                        this.drawSeparatorSection(ctx, c*(1-s), x-COL_W+6, y-COL_H, COL_W, COL_H*h2*(1+s));
                        ctx.strokeStyle = `rgba(0,0,0,${Math.min(1, progress/t1)*s2})`;
                        ctx.strokeRect(x-COL_W+6, y-COL_H, COL_W, COL_H*h2*(1+s)+2*(1-s));
                        if (c2 === 0 && progress >= t2) {
                            ctx.strokeStyle = `#000`;
                            ctx.strokeRect(x-COL_W+6, y-COL_H, COL_W*w2, COL_H*h2*2);
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
                    let x = Math.floor(c/h2)*(w2+1)*COL_W + COL_W + c2*COL_W;
                    let y = r2*COL_H + COL_H*0.8 + (c%h2)*(h2*2*COL_H+COL_H);
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
                        let x1 = (c_off + 0.9)*COL_W;
                        let x2 = (c_on + 0.9)*COL_W;
                        let y1 = (r+0.5)*COL_H;
                        let y2 = (r+0.5)*COL_H + (m-c_low)*3 + 30;
                        ctx.moveTo(x1, y1);
                        ctx.bezierCurveTo(x1, y1, x2, y2, x2, y1);
                        ctx.strokeStyle = `#008`;
                        ctx.stroke();
                    }

                    for (let c_bit = 0; c_bit < 2; c_bit++) {
                        let c = c_off + c_bit*m;
                        let x = c*COL_W;
                        let y = r*COL_H;
                        let v_off = this.digit_grid[c_off][r];
                        let v_on = this.digit_grid[c_on][r];
                        let v_in = this.digit_grid[c][r];
                        let v_out = c_bit ? v_off - v_on : v_off + v_on;
                        if (showFormula) {
                            ctx.textAlign = 'right';
                            let cx = x + COL_W;
                            let s1 = Math.abs(v_on) + '';
                            let s2 = (c_bit != (v_on < 0)) ? '-' : '+';
                            let s3 = v_off + '';
                            ctx.fillStyle = sign_highlight(v_on);
                            ctx.fillText(s1, cx, y + COL_H * 0.8);
                            cx -= ctx.measureText(s1).width;
                            ctx.fillStyle = sign_highlight(c_bit ? -1 : +1);
                            ctx.fillText(s2, cx, y + COL_H * 0.8);
                            cx -= ctx.measureText(s2).width;
                            ctx.fillStyle = sign_highlight(v_off);
                            ctx.fillText(s3, cx, y + COL_H * 0.8);
                        } else {
                            let v = showResult ? v_out : v_in;
                            let s = (!showFormula ? v+""
                                : c_bit ? v_off + "-" + v_on
                                : v_off + "+" + v_on).split("+-").join('-').split("--").join('+');
                            ctx.fillStyle = sign_highlight(v);
                            ctx.textAlign = 'right';
                            ctx.fillText(s, x + COL_W, y + COL_H * 0.8);
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
                    ctx.fillText(s, c*COL_W + COL_W, r*COL_H + COL_H * 0.8);
                    ctx.fillStyle = sign_highlight(carry);
                    ctx.textAlign = 'right';
                    let cx = c * COL_W + COL_W - ctx.measureText(s).width;
                    ctx.fillText((carry >= 0 ? '+' : '') + carry, cx, r * COL_H + COL_H * 0.8);

                    if (Math.abs(v) >= 10) {
                        ctx.beginPath();
                        ctx.moveTo(c*COL_W+COL_W-16, r*COL_H);
                        ctx.lineTo(c*COL_W+COL_W-8, r*COL_H+COL_H);
                        ctx.strokeStyle = v < 0 ? 'black' : 'red';
                        ctx.stroke();
                    }
                } else {
                    ctx.fillText(v, c*COL_W + COL_W, r*COL_H + COL_H * 0.8);
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
                let {div, mod: y} = divmod(r*COL_H + slope_slow*progress*COL_H, h*COL_H);
                v *= (div & 1) === 0 ? 1 : -1;
                ctx.fillStyle = sign_highlight(v);
                ctx.textAlign = 'right';
                ctx.fillText(v, c * COL_W + COL_W, y + COL_H*0.8);
                if (y > h*COL_H-COL_H) {
                    ctx.fillStyle = sign_highlight(v);
                    ctx.fillText(""+-v, c*COL_W + COL_W, y + COL_H*0.8 - h*COL_H);
                }
                if (r === 0 && slope !== 0) {
                    ctx.fillStyle = 'red';
                    let sy = divmod(r*COL_H + slope*COL_H, h*COL_H*2).mod;
                    if (sy === h*COL_H) {
                        sy -= 1;
                    }
                    ctx.fillRect(c*COL_W+6, sy % (h*COL_H), COL_W, 1);
                    ctx.fillStyle = 'black';
                    ctx.fillRect(c*COL_W+6, y, COL_W, 1);
                }
            }
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(0, -11, w*COL_W, 11);
        ctx.fillRect(0, h*COL_H, w*COL_W, 11);
        this.drawOutline(ctx);
    }

    drawOutline(ctx) {
        let {w, h} = this.drawSize();
        ctx.strokeStyle = '#000';
        ctx.strokeRect(0, 0, w, h);
    }

    drawSeparators(ctx) {
        for (let k = 0; k < this.digit_grid.length; k += this.focus_width) {
            this.drawSeparatorSection(ctx,k, k*COL_W+6, 0, this.focus_width*COL_W, this.digit_grid[0].length*COL_H);
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

function sign_highlight(v) {
    return v === 0 ? 'rgba(0, 0, 0, 0.4)'
        : v < 0 ? '#F00'
        : '#000';
}

function lerp_within(v0, v1, t0, t1, t) {
    let p = (t-t0)/(t1-t0);
    if (p < 0 || p > 1) {
        return undefined;
    }
    return v0 + (v1-v0)*p;
}
