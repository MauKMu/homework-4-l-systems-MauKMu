import {vec3, vec4, mat3, mat4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import Plant from './geometry/Plant';
import { PRISM_HEIGHT } from './geometry/Plant';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

var OBJ = require('webgl-obj-loader');


import Turtle from './l-system/Turtle';
import {LSymbol, ExpansionRule} from './l-system/LSymbol';
import LSystem from './l-system/LSystem';

enum ShaderEnum {
    LAMBERT = 1,
    CUSTOM,
    DISKS,
    PLANET,
    BLDGS,
    MAGIC,
}

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 6,
  'Load Scene': loadScene, // A function pointer, essentially
  geometryColor: [200, 10, 10],
  shader: ShaderEnum.LAMBERT,
  shaderSpeed: 1,
  'Toggle tilting': toggleAnimXZ,
  'Toggle squishing': toggleAnimY,
  lightX: 10,
  lightY: 1,
  lightZ: 1,
  lavaBias: 50,
  plumeBias: 0,
  edgeClarity: 0,
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let plant: Plant;

let renderer: OpenGLRenderer;

let alphabet: Map<string, LSymbol>;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(1.5, 0, 0));
  cube.create();
  plant = new Plant(vec3.fromValues(0, 0, 0));
  plant.create();
}

function toggleAnimXZ() {
  renderer.toggleAnimXZ();
}

function toggleAnimY() {
  renderer.toggleAnimY();
}

let objString: string;
let isObjLoaded: boolean;

function readTextFile(file: string) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                objString = rawFile.responseText;
                isObjLoaded = true;
                //alert(objString);
            }
        }
        //objString = "Error when loading OBJ file!"        
    }
    rawFile.send(null);
}

function blah() {
    //fetch("../models/Manzana.obj")
        //.then(response => response.text())
        //.then(text => console.log(text));
    objString = "";
    isObjLoaded = false;
    readTextFile("models/fg_pear.obj");
    console.log(isObjLoaded);
    let mesh = new OBJ.Mesh(objString);
    debugger;
    // define alphabet
    alphabet = new Map<string, LSymbol>();

    // symbol definitions below.
    // they include:
    //   * string representation
    //   * action
    //   * expansion rules, if any

    let F = new LSymbol("F", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        //lsys.addPrismAtTurtle(turtle);
        lsys.addScaledPrismAtTurtle(turtle, 2.0);
        turtle.moveForward(PRISM_HEIGHT * 2.0);
    });
    alphabet.set(F.stringRepr, F);
    let push = new LSymbol("[", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        let copy = turtle.makeDeepCopy();
        copy.depth++;
        lsys.turtleStack.push(copy);
    });
    alphabet.set(push.stringRepr, push);
    let pop = new LSymbol("]", function (lsys: LSystem) {
        lsys.turtleStack.pop();
    });
    alphabet.set(pop.stringRepr, pop);
    // "root"
    let R = new LSymbol("R", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT * 0.8);
    });
    let plusZ = new LSymbol("(+Z)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateZ(Math.PI * 0.1333333);
    });
    alphabet.set(plusZ.stringRepr, plusZ);
    let minusZ = new LSymbol("(-Z)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateZ(-Math.PI * 0.1333333);
    });
    alphabet.set(minusZ.stringRepr, minusZ);
    // twisty trunk ===========================================
    let twistyPlusBigY = new LSymbol("(T+Y)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateY(Math.PI * 0.25);
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT * 0.8);
    });
    alphabet.set(twistyPlusBigY.stringRepr, twistyPlusBigY);
    let twistyMinusBigY = new LSymbol("(T-Y)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateY(-Math.PI * 0.25);
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT * 0.8);
    });
    alphabet.set(twistyMinusBigY.stringRepr, twistyMinusBigY);
    // just expands to one of (T+Y) or (T-Y)
    let twistyStart = new LSymbol("(TS)", function (lsys: LSystem) {
    });
    alphabet.set(twistyStart.stringRepr, twistyStart);
    twistyStart.setExpansionRules([new ExpansionRule(1, [twistyPlusBigY]), new ExpansionRule(1, [twistyMinusBigY])]);
    // set expansion rules for other twisty trunks
    twistyPlusBigY.setExpansionRules([
        new ExpansionRule(6, [twistyPlusBigY, twistyPlusBigY]),
        new ExpansionRule(3, [twistyPlusBigY]),
        new ExpansionRule(1, [twistyPlusBigY, twistyMinusBigY])
    ]);
    twistyMinusBigY.setExpansionRules([
        new ExpansionRule(6, [twistyMinusBigY, twistyMinusBigY]),
        new ExpansionRule(3, [twistyMinusBigY]),
        new ExpansionRule(1, [twistyMinusBigY, twistyPlusBigY])
    ]);
    // branchy trunk ==========================================
    let branchyPlusSmallX = new LSymbol("(B+x)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateX(Math.PI * 0.1);
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT);
    });
    alphabet.set(branchyPlusSmallX.stringRepr, branchyPlusSmallX);
    let branchyMinusSmallX = new LSymbol("(B-x)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateX(-Math.PI * 0.1);
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT);
    });
    alphabet.set(branchyMinusSmallX.stringRepr, branchyMinusSmallX);
    let branchyPlusSmallY = new LSymbol("(B+y)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateY(Math.PI * 0.1);
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT);
    });
    alphabet.set(branchyPlusSmallY.stringRepr, branchyPlusSmallY);
    let branchyMinusSmallY = new LSymbol("(B-y)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        turtle.rotateY(-Math.PI * 0.1);
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT);
    });
    alphabet.set(branchyMinusSmallY.stringRepr, branchyMinusSmallY);
    // expands to a branchy trunk
    let branchyStart = new LSymbol("(BS)", function (lsys: LSystem) {
    });
    alphabet.set(branchyStart.stringRepr, branchyStart);
    branchyStart.setExpansionRules([
        new ExpansionRule(1, [branchyPlusSmallX]),
        new ExpansionRule(1, [branchyMinusSmallX]),
        new ExpansionRule(1, [branchyPlusSmallY]),
        new ExpansionRule(1, [branchyMinusSmallY]),
    ]);

    // define this here so we can add it to branchy expansion rules
    // "seed" for araucaria branches
    let araucariaStart = new LSymbol("(AS)", function (lsys: LSystem) {
    });
    alphabet.set(araucariaStart.stringRepr, araucariaStart);

    // set expansion rules for branchy trunk pieces
    branchyPlusSmallX.setExpansionRules([
        new ExpansionRule(4, [branchyPlusSmallX]),
        new ExpansionRule(2, [branchyPlusSmallX, branchyMinusSmallX]),
        new ExpansionRule(9, [branchyPlusSmallX, araucariaStart]), 
        new ExpansionRule(1, [branchyPlusSmallX, branchyPlusSmallY]), 
        new ExpansionRule(1, [branchyPlusSmallX, branchyMinusSmallY])
    ]);
    branchyMinusSmallX.setExpansionRules([
        new ExpansionRule(4, [branchyMinusSmallX]),
        new ExpansionRule(2, [branchyMinusSmallX, branchyPlusSmallX]),
        new ExpansionRule(9, [branchyMinusSmallX, araucariaStart]), 
        new ExpansionRule(1, [branchyMinusSmallX, branchyPlusSmallY]), 
        new ExpansionRule(1, [branchyMinusSmallX, branchyMinusSmallY])
    ]);
    branchyPlusSmallY.setExpansionRules([
        new ExpansionRule(4, [branchyPlusSmallY]),
        new ExpansionRule(2, [branchyPlusSmallY, branchyMinusSmallY]),
        new ExpansionRule(9, [branchyPlusSmallY, araucariaStart]), 
        new ExpansionRule(1, [branchyPlusSmallY, branchyPlusSmallX]), 
        new ExpansionRule(1, [branchyPlusSmallY, branchyMinusSmallX])
    ]);
    branchyMinusSmallY.setExpansionRules([
        new ExpansionRule(4, [branchyMinusSmallY]),
        new ExpansionRule(2, [branchyMinusSmallY, branchyPlusSmallY]),
        new ExpansionRule(9, [branchyMinusSmallY, araucariaStart]), 
        new ExpansionRule(1, [branchyMinusSmallY, branchyPlusSmallX]), 
        new ExpansionRule(1, [branchyMinusSmallY, branchyMinusSmallX])
    ]);
    // transition main trunk -> araucaria =====================
    // use "vertify" to smoothly change into a mostly vertical direction
    // similar to araucariaLong, but more intense
    let vertify = new LSymbol("(vert)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        // draw some prisms while increasing Y to move orientation up
        let VERTIFY_Y_INC = 0.8;
        for (let i = 0; i < 3; i++) {
            // draw part of the branch
            lsys.addPrismAtTurtle(turtle);
            turtle.moveForward(PRISM_HEIGHT);
            // add to Y and normalize to nudge it upwards
            vec3.add(turtle.orientation, turtle.orientation, vec3.fromValues(0, VERTIFY_Y_INC, 0));
            vec3.normalize(turtle.orientation, turtle.orientation);
        }
    });
    alphabet.set(vertify.stringRepr, vertify);
    // do this by setting orientation to something with Y <= 0
    // we call this "flatifying", as it "flattens" the direction
    // (if you think of up as a "non-flat" direction. flatty mcflatty.)
    let flatify = new LSymbol("(flat)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        let angle = Math.random() * 2.0 * Math.PI;
        let y = -Math.random() * 0.3 + 0.05;
        vec3.set(turtle.orientation, Math.cos(angle), y, Math.sin(angle));
        vec3.normalize(turtle.orientation, turtle.orientation);
    });
    alphabet.set(flatify.stringRepr, flatify);
    // araucaria branches =====================================
    // the main branches coming off the main trunk have two parts:
    // the "straight", long part coming from the main trunk; and
    // the vertical tip at the end;
    let araucariaLong = new LSymbol("(AL)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        // draw some prisms while increasing Y to move orientation up
        let ARAUCARIA_Y_INC = 0.2;
        for (let i = 0; i < 5; i++) {
            // draw part of the branch
            lsys.addPrismAtTurtle(turtle);
            turtle.moveForward(PRISM_HEIGHT);
            // add to Y and normalize to nudge it upwards
            vec3.add(turtle.orientation, turtle.orientation, vec3.fromValues(0, ARAUCARIA_Y_INC, 0));
            vec3.normalize(turtle.orientation, turtle.orientation);
        }
    });
    alphabet.set(araucariaLong.stringRepr, araucariaLong);
    let araucariaTip = new LSymbol("(AT)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT);
    });
    alphabet.set(araucariaTip.stringRepr, araucariaTip);
    // "helper" symbol to change the turtle orientation randomly
    // and make branches more chaotic
    let randify = new LSymbol("(rand)", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        let angle = Math.random() * 2.0 * Math.PI;
        let y = Math.random() * 1.8 - 0.9;
        vec3.set(turtle.orientation, Math.cos(angle), y, Math.sin(angle));
        vec3.normalize(turtle.orientation, turtle.orientation);
    });
    alphabet.set(randify.stringRepr, randify);

    // set expansion rules for araucaria
    araucariaStart.setExpansionRules([
        new ExpansionRule(1, [push, flatify, araucariaLong, araucariaTip, pop])
    ]);

    araucariaTip.setExpansionRules([
        new ExpansionRule(6, [araucariaTip]), // don't change
        new ExpansionRule(4, [araucariaTip, push, randify, araucariaTip, pop]), // add branch
        new ExpansionRule(1, [araucariaTip, araucariaTip]) // grow current branch
    ]);

    // initialize L-system
    let lsys = new LSystem();

    //lsys.setAxiom([R, plusZ, R, plusZ, R, twistyPlusBigY, twistyPlusBigY, twistyPlusBigY]);
    //lsys.setAxiom([R, plusZ, R, plusZ, R, twistyPlusBigY, twistyPlusBigY, twistyPlusBigY, vertify, R, R]);
    //lsys.setAxiom([R, R, R, push, flatify, araucariaLong, pop, push, flatify, araucariaLong, pop  ]);
    //lsys.setAxiom([R, R, R, push, flatify, araucariaLong, araucariaTip, push, randify, araucariaTip, pop, push, randify, araucariaTip, pop, push, randify, araucariaTip, pop, pop, push, flatify, araucariaLong, pop  ]);
    lsys.setAxiom([
        F, plusZ, F, plusZ, F, plusZ, F, twistyStart, vertify, F, branchyStart
    ]);
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.expandString();
    console.log(lsys.lstring.toString());
    lsys.executeString();

    //F.action(lsys);
    //let turtle = lsys.getTopTurtle();
    //turtle.orientation = vec3.fromValues(0.7071, 0.7071, 0);
    //F.action(lsys);
    //turtle.orientation = vec3.fromValues(1, 0, 0);
    //F.action(lsys);
    plant = lsys.plant;
    plant.addDecoration(mesh);
    plant.create();
}

function main() {
    /*
    let f = function (y: number) {
        console.log("x+1: " + (y + 1));
        this.stringRepra = "bbb";
    };
    let s = new LSymbol("aaa", f);
    console.log(s.stringRepr);
    s.action(1);
    console.log(s.stringRepr);
    */
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  let colorController = gui.addColor(controls, 'geometryColor');
  gui.add(controls, 'shader', {"Lame Lambert": ShaderEnum.LAMBERT, "Cool Custom": ShaderEnum.CUSTOM, "Decent Disks": ShaderEnum.DISKS, "Plumous Planet": ShaderEnum.PLANET, "Urban Planet": ShaderEnum.BLDGS, "Magic Plumous Planet": ShaderEnum.MAGIC});
  let speedController = gui.add(controls, 'shaderSpeed', 0, 10);
  //gui.add(controls, 'Toggle tilting');
  //gui.add(controls, 'Toggle squishing');
  gui.add(controls, 'lavaBias', 0, 100);
  gui.add(controls, 'plumeBias', 0, 100);
  gui.add(controls, 'edgeClarity', 0, 100);
  let lightFolder = gui.addFolder('Light Position');
  lightFolder.add(controls, 'lightX');
  lightFolder.add(controls, 'lightY');
  lightFolder.add(controls, 'lightZ');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();
  blah();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  // Set up event listener for color change
  colorController.onChange(function (color: Int32Array) {
    renderer.setGeometryColor(vec4.fromValues(color[0] / 255, color[1] / 255, color[2] / 255, 1));
  });

  // Initialize color
  renderer.setGeometryColor(vec4.fromValues(controls.geometryColor[0] / 255,
                                            controls.geometryColor[1] / 255,
                                            controls.geometryColor[2] / 255,
                                            1
  ));

  // Set up event listener for shader speed
  speedController.onChange(function (speed: number) {
    renderer.setShaderSpeed(speed);
  });

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  const disks = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/disks-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/disks-frag.glsl')),
  ]);

  const planet = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/planet-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/planet-frag.glsl')),
  ]);

  const planetMagic = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/planet-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/planet-magic-frag.glsl')),
  ]);

  const bldgs = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/bldgs-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/bldgs-frag.glsl')),
  ]);

  let shaders: { [id: number]: ShaderProgram; } = {};
  shaders[ShaderEnum.LAMBERT] = lambert;
  shaders[ShaderEnum.CUSTOM] = custom;
  shaders[ShaderEnum.DISKS] = disks;
  shaders[ShaderEnum.PLANET] = planet;
  shaders[ShaderEnum.MAGIC] = planetMagic;
  shaders[ShaderEnum.BLDGS] = bldgs;

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.setLightPos(vec3.fromValues(controls.lightX, controls.lightY, controls.lightZ));
    renderer.setLavaBias(controls.lavaBias / 100);
    renderer.setPlumeBias(controls.plumeBias / 100);
    renderer.setEdgeClarity(controls.edgeClarity / 100);
    renderer.render(camera, shaders[controls.shader], [
      // icosphere,
      // square,
      //cube,
      plant,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
