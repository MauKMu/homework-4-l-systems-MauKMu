export const LRANDOM_MATH_RANDOM = 1;
export const LRANDOM_DETERMINISTIC = 2;

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
function fract(x: number): number {
    return x - Math.floor(x); 
}

function rand(x: number) {
    return fract(Math.sin(x) * 43758.5453123);
}

export class LRandom {
    mode: number;
    state: number;

    constructor(mode: number, seed: number) {
        this.mode = mode;
        this.state = seed;
    }

    setSeed(seed: number) {
        this.state = seed;
    }

    getNext() {
        if (this.mode == LRANDOM_MATH_RANDOM) {
            return Math.random();
        }
        else if (this.mode == LRANDOM_DETERMINISTIC) {
            return rand(this.state++);
        }
        else {
            return -1.0;
        }
    }

};
