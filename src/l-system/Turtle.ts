import {vec3, mat4} from 'gl-matrix';

class Turtle {
    position: vec3;
    orientation: vec3;
    depth: number;

    constructor() {
        this.position = vec3.create();
        this.orientation = vec3.fromValues(0, 1, 0);
        this.depth = 0;
    }

};

export default Turtle;
