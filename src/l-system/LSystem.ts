import {vec3, mat4} from 'gl-matrix';
import Turtle from './Turtle';
import {LSymbol, ExpansionRule} from './LSymbol';
import Plant from '../geometry/Plant';

class LSystem {
    alphabet: Array<LSymbol>;
    turtleStack: Array<Turtle>;
    plant: Plant;

    constructor() {
        //this.alphabet = [];
        this.initAlphabet();
        this.turtleStack = [];
        this.plant = new Plant(vec3.fromValues(0, 0, 0));
    }

    initAlphabet() {
        let A = new LSymbol("A", function (t: Turtle, p: Plant) { });
        let B = new LSymbol("B", function (t: Turtle, p: Plant) { });
        let C = new LSymbol("C", function (t: Turtle, p: Plant) { });
        this.alphabet = [];
        this.alphabet.push(A);
        this.alphabet.push(B);
        this.alphabet.push(C);
        A.setExpansionRules([new ExpansionRule(1, [B])]);
        B.setExpansionRules([new ExpansionRule(1, [C])]);
    }

};

export default LSystem;
