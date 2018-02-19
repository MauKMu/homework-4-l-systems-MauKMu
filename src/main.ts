import {vec3, vec4} from 'gl-matrix';
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

function blah() {
    // define alphabet
    let F = new LSymbol("F", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        lsys.addPrismAtTurtle(turtle);
        turtle.moveForward(PRISM_HEIGHT);
    });
    let push = new LSymbol("[", function (lsys: LSystem) {
        let turtle = lsys.getTopTurtle();
        let copy = turtle.makeDeepCopy();
        copy.depth++;
        lsys.turtleStack.push(copy);
    });
    let pop = new LSymbol("]", function (lsys: LSystem) {
        lsys.turtleStack.pop();
    });
    // set expansion rules
    let lsys = new LSystem();
    console.log(lsys.alphabet);
    lsys.setAxiom([lsys.alphabet[0], lsys.alphabet[1], lsys.alphabet[2]]);
    console.log(lsys.axiom.toString());
    lsys.axiom.expand();
    console.log(lsys.axiom.toString());
    lsys.axiom.expand();
    console.log(lsys.axiom.toString());

    F.action(lsys);
    let turtle = lsys.getTopTurtle();
    turtle.orientation = vec3.fromValues(0.7071, 0.7071, 0);
    F.action(lsys);
    turtle.orientation = vec3.fromValues(1, 0, 0);
    F.action(lsys);
    plant = lsys.plant;
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
