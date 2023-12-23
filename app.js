import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js'


const GRID_SPACING = 0.05;
const TABLE_WIDTH = 3.0;
const MAX_CHARGES = 23;
const ANGULAR_SPEED = 0.01;

let tableHeight;

/**
 * For a given index i,
 *  posAndVal[i][0] == x coordinate
 *  posAndVal[i][1] == x coordinate
 *  posAndVal[i][2] == x charge value
 */
let charges = {
            posAndVal:[], 
            visible:true
        };

let chargeInfo = {};
let gridInfo = {};

/** @type {WebGLRenderingContext} */
let gl;

let erroMessageOpacity;


// Creates new properties for object
function setupObjectInfo(gl, object, program, posAttribName)
{
    object.buffer = gl.createBuffer();
    object.program = program;
    object.vPositionLoc = gl.getAttribLocation(program, posAttribName);
}

function setup(shaders) 
{
    // Setup canvas 
    const canvas = document.getElementById("gl-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    tableHeight = TABLE_WIDTH/(canvas.width/canvas.height);
    

    // Setup grid
    let gridVertices = [];
    for(let x = -TABLE_WIDTH/2; x <= TABLE_WIDTH/2; x += GRID_SPACING) {
        for(let y = tableHeight/2; y >= -tableHeight/2; y -= GRID_SPACING) {
            let randx = Math.random()*((x+GRID_SPACING/2) - (x-GRID_SPACING/2)) + (x-GRID_SPACING/2);
            let randy = Math.random()*((y+GRID_SPACING/2) - (y-GRID_SPACING/2)) + (y-GRID_SPACING/2);
            gridVertices.push(MV.vec3(randx, randy, 0.0));
            gridVertices.push(MV.vec3(randx, randy, 1.0));
        }
    }
    
    gl = UTILS.setupWebGL(canvas);
    
    // Setup glsl programs
    let gridProgram = UTILS.buildProgramFromSources(gl, shaders["grid_shader.vert"], shaders["grid_shader.frag"]);
    let chargeProgram = UTILS.buildProgramFromSources(gl, shaders["charge_shader.vert"], shaders["charge_shader.frag"]);

    // Setup objects containing rendering information
    setupObjectInfo(gl, gridInfo, gridProgram, "vPosition");
    gridInfo.numGridPoints = gridVertices.length;

    setupObjectInfo(gl, chargeInfo, chargeProgram, "vPosition");
    chargeInfo.numCharges = 0;

    // Load buffers with data
    gl.bindBuffer(gl.ARRAY_BUFFER, gridInfo.buffer);   
    gl.bufferData(gl.ARRAY_BUFFER, MV.flatten(gridVertices), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, chargeInfo.buffer); 
    gl.bufferData(gl.ARRAY_BUFFER, MAX_CHARGES*2*gl.FLOAT, gl.STATIC_DRAW);
    
    // Setup event listeners
    window.addEventListener("resize", function (event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        tableHeight = (TABLE_WIDTH*canvas.height)/canvas.width;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });
    
    canvas.addEventListener("click", function (event){

        if(chargeInfo.numCharges < MAX_CHARGES){
            let x = Math.round((event.offsetX/canvas.width*TABLE_WIDTH - TABLE_WIDTH/2.0) * 100) / 100;
            let y = Math.round(-(event.offsetY/canvas.height*tableHeight - tableHeight/2.0) * 100) / 100;
            let c = 0.0;    
            if(event.shiftKey){
                c = -1.0;
            } else {
                c = 1.0;
            }
            
            let vec = MV.vec3(x, y, c);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, chargeInfo.buffer); 
            gl.bufferSubData(gl.ARRAY_BUFFER, MV.sizeof['vec3']*chargeInfo.numCharges, MV.flatten(vec));

            charges.posAndVal.push(vec);
            chargeInfo.numCharges++;
        } else {
            let errorP = document.getElementById("error-message");
            errorP.innerHTML = "MAXIMUM CHARGES REACHED!";
            erroMessageOpacity = 1.0;
        }
    });

    document.addEventListener("keydown", function(e){
        if(e.code == "Space"){
            if(charges.visible){
                charges.visible = false;
            } else {
                charges.visible = true;
            }
        }
    });

    // Setup the viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Setup the backgrouncolor
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Call animate for the first time
    animate();

}

// Functions to load uniforms with values
function setupUniform1f(gl, program, uName, uValue)
{
    let uLoc = gl.getUniformLocation(program, uName);
    gl.uniform1f(uLoc, uValue);
}

function setupUniform1i(gl, program, uName, uValue)
{
    let uLoc = gl.getUniformLocation(program, uName);
    gl.uniform1i(uLoc, uValue);
}

function setupUniform2fv(gl, program, uName, uVec2Value)
{
    let uLoc = gl.getUniformLocation(program, uName);
    gl.uniform2fv(uLoc, MV.flatten(uVec2Value));
}


function animate(time)
{
    window.requestAnimationFrame(animate);

    // Drawing code
   
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Setup grid

    // Setup grid drawing buffer
    
    gl.bindBuffer(gl.ARRAY_BUFFER, gridInfo.buffer);
    gl.vertexAttribPointer(gridInfo.vPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gridInfo.vPositionLoc);
    gl.useProgram(gridInfo.program);

    // Setup grid uniforms
    setupUniform1f(gl, gridInfo.program, "uTableWidth", TABLE_WIDTH);
    setupUniform1f(gl, gridInfo.program, "uTableHeight", tableHeight);
    setupUniform1i(gl, gridInfo.program, "numCharges", chargeInfo.numCharges);

    // Compute new positions for charges if they exist to simulate orbit around center
    let s = 0.0;
    let c = 0.0;
    for(let i = 0; i < chargeInfo.numCharges ; i++){
        if(charges.posAndVal[i][2] > 0) {
            s = Math.sin(ANGULAR_SPEED);
            c = Math.cos(ANGULAR_SPEED);
        } else {
            s = Math.sin(-ANGULAR_SPEED);
            c = Math.cos(-ANGULAR_SPEED);
        }
            
        let x = (-s * charges.posAndVal[i][1] + c * charges.posAndVal[i][0]);
        let y = (s * charges.posAndVal[i][0] + c * charges.posAndVal[i][1]);
        charges.posAndVal[i][0] = x;
        charges.posAndVal[i][1] = y;    
        
        // Setup grid uniforms to draw lines
        setupUniform2fv(gl, gridInfo.program, "uPosition[" + i + "]", charges.posAndVal[i].slice(0,2));
        setupUniform1f(gl, gridInfo.program, "uCharge[" + i + "]", charges.posAndVal[i][2]);
    }

    // Draw grid
    gl.drawArrays(gl.LINES, 0, gridInfo.numGridPoints);
    
    // Write error message if maximum number of charges has been reached
    if(chargeInfo.numCharges == MAX_CHARGES && erroMessageOpacity >=0){
        let errorP = document.getElementById("error-message");
        erroMessageOpacity-=0.004;
        errorP.style.opacity = erroMessageOpacity;
    }

    // Setup charges

    if(charges.visible){
        
        // Setup charge buffer with new positions
        gl.bindBuffer(gl.ARRAY_BUFFER, chargeInfo.buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(charges.posAndVal));
        gl.vertexAttribPointer(chargeInfo.vPositionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(chargeInfo.vPositionLoc);
        gl.useProgram(chargeInfo.program);

        // Setup charge uniforms
        setupUniform1f(gl, chargeInfo.program, "uTableWidth", TABLE_WIDTH);
        setupUniform1f(gl, chargeInfo.program, "uTableHeight", tableHeight);
        
        // Draw charges
        gl.drawArrays(gl.POINTS, 0, chargeInfo.numCharges);
    }
}


UTILS.loadShadersFromURLS(["grid_shader.vert", "grid_shader.frag", 
                            "charge_shader.vert", "charge_shader.frag"]).then(shaders => setup(shaders));
