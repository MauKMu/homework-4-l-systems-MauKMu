import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Plant extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    stagedIndices: Array<number>;
    stagedPositions: Array<number>;
    stagedNormals: Array<number>;

    constructor(center: vec3) {
        super(); // Call the constructor of the super class. This is required.
        this.center = center; //vec4.fromValues(center[0], center[1], center[2], 1);
        // The staged* arrays are modifiable arrays used to hold
        // indices/positions/normals prior to putting them in
        // fixed Uint32Arrays/Float32Arrays.
        this.stagedIndices = [];
        this.stagedPositions = [];
        this.stagedNormals = [];
    }



    create() {

        this.stagedIndices = [
            // -XY face
            0, 1, 2,
            0, 2, 3,
            // +XY face
            6, 5, 4,
            7, 6, 4,
            // -XZ face
            8, 9, 10,
            8, 10, 11,
            // +XZ face
            14, 13, 12,
            15, 14, 12,
            // -YZ face
            16, 17, 18,
            16, 18, 19,
            // +YZ face
            22, 21, 20,
            //23, 22, 20,
        ];
        this.stagedIndices.push(23);
        this.stagedIndices.push(22);
        this.stagedIndices.push(20);
        this.indices = new Uint32Array(this.stagedIndices);
        this.normals = new Float32Array([
            // -XY face
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            // +XY face
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,
            // -XZ face
            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0,
            // +XZ face
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
            // -YZ face
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            // +YZ face
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
        ]);
        this.positions = new Float32Array([
            // -XY face
            -1, -1, -1, 1,
            1, -1, -1, 1,
            1, 1, -1, 1,
            -1, 1, -1, 1,
            // +XY face
            -1, -1, 1, 1,
            1, -1, 1, 1,
            1, 1, 1, 1,
            -1, 1, 1, 1,
            // -XZ face
            -1, -1, -1, 1,
            1, -1, -1, 1,
            1, -1, 1, 1,
            -1, -1, 1, 1,
            // +XZ face
            -1, 1, -1, 1,
            1, 1, -1, 1,
            1, 1, 1, 1,
            -1, 1, 1, 1,
            // -YZ face
            -1, -1, -1, 1,
            -1, -1, 1, 1,
            -1, 1, 1, 1,
            -1, 1, -1, 1,
            // +YZ face
            1, -1, -1, 1,
            1, -1, 1, 1,
            1, 1, 1, 1,
            1, 1, -1, 1,
        ]);

        this.generateIdx();
        this.generatePos();
        this.generateNor();

        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        console.log(`Created Plant`);
    }
};

export default Plant;
