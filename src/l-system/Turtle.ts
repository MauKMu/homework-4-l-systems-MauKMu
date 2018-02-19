import {vec3, mat4, quat} from 'gl-matrix';

// what's up?
const UP = vec3.fromValues(0, 1, 0);

class Turtle {
    position: vec3;
    orientation: vec3;
    depth: number;

    constructor() {
        this.position = vec3.create();
        this.orientation = UP;
        this.depth = 0;
    }

    moveForward(distance: number) {
        vec3.scaleAndAdd(this.position, this.position, this.orientation, distance);
    }

    getTransformationToTurtle(): mat4 {
        let q = quat.create();
        quat.rotationTo(q, UP, this.orientation); 
        let m = mat4.create();
        mat4.fromRotationTranslation(m, q, this.position);
        return m;
    }

    makeDeepCopy(): Turtle {
        let copy = new Turtle();
        vec3.copy(copy.position, this.position);
        vec3.copy(copy.orientation, this.orientation);
        copy.depth = this.depth;
        return copy;
    }

};

export default Turtle;
