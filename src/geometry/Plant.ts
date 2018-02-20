import {vec3, vec4, mat3, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';


const PI = 3.14159265;
const TWO_PI = 6.283185307;

export const PRISM_HEIGHT = 10;

// helper function for copying values of a vec4 into an array
function copyVec4ToArray(arr: Array<number>, startIdx: number, vec: vec4) {
    arr[startIdx] = vec[0];
    arr[startIdx + 1] = vec[1];
    arr[startIdx + 2] = vec[2];
    arr[startIdx + 3] = vec[3];
}

// like above, but assumes you are adding to end
function appendVec4ToArray(arr: Array<number>, vec: vec4) {
    copyVec4ToArray(arr, arr.length, vec);
}

// hack to put normals in array without explicitly specifying last coord as 0
function appendNormalToArray(arr: Array<number>, vec: vec3) {
    let len = arr.length;
    arr[len] = vec[0];
    arr[len + 1] = vec[1];
    arr[len + 2] = vec[2];
    arr[len + 3] = 0;
}

function appendTri(arr: Array<number>, i0: number, i1: number, i2: number) {
    let len = arr.length;
    arr[len] = i0;
    arr[len + 1] = i1;
    arr[len + 2] = i2;
}


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

    // adds a prism to the staged* arrays, with all points transformed
    // by _transform_. with no transformation, the prism is
    // oriented such that its base:
    //   * lies on the XZ planes
    //   * has its center at the origin
    // the prism will extend in the +Y direction from the base.
    addPrism(transform: mat4, sides: number, scaleBottom: number, scaleTop: number, scaleHeight: number) {
        // set up =============================================

        let idxStart = this.stagedPositions.length / 4;

        // get the inverse transpose for normals
        let invTr = mat3.create();
        mat3.fromMat4(invTr, transform);
        mat3.invert(invTr, invTr);
        mat3.transpose(invTr, invTr);

        // add base ===========================================
        // add center
        let p = vec4.fromValues(0, 0, 0, 1);
        vec4.transformMat4(p, p, transform);
        appendVec4ToArray(this.stagedPositions, p);

        let n = vec3.fromValues(0, -1, 0);
        vec3.transformMat3(n, n, invTr);
        vec3.normalize(n, n);
        appendNormalToArray(this.stagedNormals, n);

        // add radial vertices
        let angle = TWO_PI / sides;
        let rotMat4 = mat4.create();
        mat4.fromRotation(rotMat4, angle, vec3.fromValues(0, 1, 0));

        let localPos = vec4.fromValues(scaleBottom, 0, 0, 1);

        for (let i = 0; i < sides; i++) {
            // transform and append position
            vec4.transformMat4(p, localPos, transform);
            appendVec4ToArray(this.stagedPositions, p);

            // append normal (already transformed when computing center)
            appendNormalToArray(this.stagedNormals, n);

            // if this is not last iteration...
            if (i < sides - 1) {
                // rotate local position
                vec4.transformMat4(localPos, localPos, rotMat4);

                // append indices to make faces
                appendTri(this.stagedIndices, idxStart, idxStart + 1 + i, idxStart + 2 + i);
            }
            else {
                // append indices to make faces -- edge case
                appendTri(this.stagedIndices, idxStart, idxStart + sides, idxStart + 1);
            }
        }

        // add top ============================================
        // refresh idxStart
        idxStart = this.stagedPositions.length / 4;
        // add center
        p = vec4.fromValues(0, PRISM_HEIGHT * scaleHeight, 0, 1);
        vec4.transformMat4(p, p, transform);
        appendVec4ToArray(this.stagedPositions, p);

        n = vec3.fromValues(0, 1, 0);
        vec3.transformMat3(n, n, invTr);
        vec3.normalize(n, n);
        appendNormalToArray(this.stagedNormals, n);

        // add radial vertices

        localPos = vec4.fromValues(scaleTop, PRISM_HEIGHT * scaleHeight, 0, 1);

        for (let i = 0; i < sides; i++) {
            // transform and append position
            vec4.transformMat4(p, localPos, transform);
            appendVec4ToArray(this.stagedPositions, p);

            // append normal (already transformed when computing center)
            appendNormalToArray(this.stagedNormals, n);

            // if this is not last iteration...
            if (i < sides - 1) {
                // rotate local position
                vec4.transformMat4(localPos, localPos, rotMat4);

                // append indices to make faces
                appendTri(this.stagedIndices, idxStart, idxStart + 1 + i, idxStart + 2 + i);
            }
            else {
                // append indices to make faces -- edge case
                appendTri(this.stagedIndices, idxStart, idxStart + sides, idxStart + 1);
            }
        }

        // add sides (rectangular faces) ======================
        // refresh idxStart
        idxStart = this.stagedPositions.length / 4;

        let rotMat3 = mat3.create();
        mat3.fromMat4(rotMat3, rotMat4);

        // localPosBot will be computed from localPosTop by setting Y = 0
        let localPosBot = vec4.fromValues(scaleBottom, 0, 0, 1);
        let localPosTop = vec4.fromValues(scaleTop, PRISM_HEIGHT * scaleHeight, 0, 1);

        // compute initial normal by rotating by half angle
        let halfRotMat4 = mat4.create();
        mat4.fromRotation(halfRotMat4, angle * 0.5, vec3.fromValues(0, 1, 0));
        let localNorVec4 = vec4.fromValues(1, 0, 0, 0);
        vec4.transformMat4(localNorVec4, localNorVec4, halfRotMat4);
        let localNor = vec3.fromValues(localNorVec4[0], localNorVec4[1], localNorVec4[2]);
        
        for (let i = 0; i < sides; i++) {
            // transform and append position -- top
            vec4.transformMat4(p, localPosTop, transform);
            appendVec4ToArray(this.stagedPositions, p);

            // transform and append position -- bottom
            //vec4.set(localPosBot, localPosTop[0], 0, localPosTop[2], 1);
            vec4.transformMat4(p, localPosBot, transform);
            appendVec4ToArray(this.stagedPositions, p);

            // transform and append normal (need to append twice)
            vec3.transformMat3(n, localNor, invTr);
            vec3.normalize(n, n);
            appendNormalToArray(this.stagedNormals, n);
            appendNormalToArray(this.stagedNormals, n);

            // if this is not last iteration...
            if (i < sides - 1) {
                // rotate local position
                vec4.transformMat4(localPosTop, localPosTop, rotMat4);
                vec4.transformMat4(localPosBot, localPosBot, rotMat4);

                // rotate local normal
                vec3.transformMat3(localNor, localNor, rotMat3);

                // append indices to make faces
                // adjusts start index to account for i (# of sides added so far)
                let adjStart = idxStart + 2 * i;
                appendTri(this.stagedIndices, adjStart, adjStart + 2, adjStart + 1);
                appendTri(this.stagedIndices, adjStart + 1, adjStart + 2, adjStart + 3);
            }
            else {
                // append indices to make faces -- edge case
                let adjStart = idxStart + 2 * i;
                appendTri(this.stagedIndices, adjStart, idxStart, adjStart + 1);
                appendTri(this.stagedIndices, adjStart + 1, idxStart, idxStart + 1);
            }
        }
    }


    create() {
        /*
        this.addPrism(mat4.create(), 12);
        let trans = mat4.create();
        //mat4.fromRotation(trans, PI * 0.25, vec3.fromValues(0, 0, 1));
        mat4.translate(trans, trans, vec3.fromValues(0, PRISM_HEIGHT, 0));
        mat4.rotateY(trans, trans, PI * 0.5);
        mat4.rotateZ(trans, trans, PI * 0.25);
        this.addPrism(trans, 12);
        */

        this.indices = new Uint32Array(this.stagedIndices);
        this.positions = new Float32Array(this.stagedPositions);
        this.normals = new Float32Array(this.stagedNormals);

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
