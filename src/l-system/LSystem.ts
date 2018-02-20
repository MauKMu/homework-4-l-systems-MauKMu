import {vec3, mat4, quat} from 'gl-matrix';
import Turtle from './Turtle';
import {LSymbol, ExpansionRule} from './LSymbol';
import Plant from '../geometry/Plant';
import LString from './LString';

class LSystem {
    alphabet: Array<LSymbol>;
    turtleStack: Array<Turtle>;
    plant: Plant;
    axiom: LString;
    lstring: LString;

    constructor() {
        //this.alphabet = [];
        this.initAlphabet();
        this.turtleStack = [new Turtle()];
        this.plant = new Plant(vec3.fromValues(0, 0, 0));
        this.axiom = new LString([]);
        this.lstring = new LString([]);
    }

    setAxiom(axiomArray: Array<LSymbol>) {
        this.axiom.fromArray(axiomArray);
        this.lstring.fromArray(axiomArray);
    }

    getTopTurtle(): Turtle {
        return this.turtleStack[this.turtleStack.length - 1];
    }

    addPrismAtTurtle(turtle: Turtle) {
        let trans = turtle.getTransformationToTurtle();
        this.plant.addPrism(trans, 8, turtle.scaleBottom, turtle.scaleTop, 1);
        turtle.scaleBottom = turtle.scaleTop;
        turtle.scaleTop *= 0.99;
    }

    addScaledPrismAtTurtle(turtle: Turtle, scaleHeight: number) {
        let trans = turtle.getTransformationToTurtle();
        this.plant.addPrism(trans, 8, turtle.scaleBottom, turtle.scaleTop, scaleHeight);
        turtle.scaleBottom = turtle.scaleTop;
        turtle.scaleTop *= 0.8;
    }

    addPearAtTurtle(turtle: Turtle, pearMesh: any) {
        // extract only translation from turtle
        let turtlePos = turtle.position;
        let trans = mat4.create();
        mat4.fromTranslation(trans, turtlePos);
        let toOrigin = mat4.create();
        let m = mat4.create();
        let q = quat.create();
        quat.fromEuler(q, 90, 0, 0); // angles in degrees, for some reason...
        mat4.fromRotationTranslationScale(toOrigin, q, vec3.fromValues(0, 0, 0), vec3.fromValues(1, 1, 1));
        mat4.fromTranslation(m, vec3.fromValues(0, 0, 15));
        mat4.multiply(toOrigin, toOrigin, m);
        mat4.multiply(trans, trans, toOrigin);
        this.plant.addDecoration(pearMesh, trans);
    }

    initAlphabet() {
        let A = new LSymbol("A", function (lsys: LSystem) { });
        let B = new LSymbol("B", function (lsys: LSystem) { });
        let C = new LSymbol("C", function (lsys: LSystem) { });
        this.alphabet = [];
        this.alphabet.push(A);
        this.alphabet.push(B);
        this.alphabet.push(C);
        A.setExpansionRules([new ExpansionRule(1, [B, B, A]), new ExpansionRule(1, [A])]);
        B.setExpansionRules([new ExpansionRule(1, [C, B])]);
    }

    expandString() {
        this.lstring.expand();
    }

    executeString() {
        this.lstring.execute(this);
    }

};

export default LSystem;
