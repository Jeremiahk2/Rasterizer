/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles2.json"; // triangles file loc
const INPUT_LIGHTS_URL = "https://ncsucgclass.github.io/prog3/lights.json";
//const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog3/spheres.json"; // spheres file loc
var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space
var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
var lights = [
    {"x": -.5, "y": 1.5, "z": -0.5, "ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1]}
    ]
    

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triangleVertexColorBuffer;
var vertexColorAttrib
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var matrixLocation;


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

function doLighting(worldCoords, N, pointColors, eye) {

    var color = new Color();
    var V = Vector.subtract(eye, worldCoords);
    var worldLoc = worldCoords;

    var lVect = new Vector(lights[0].x, lights[0].y, lights[0].z);

    // get light vector
    lVect = Vector.subtract(lVect,worldLoc);

    //If the normal is facing away from the eye, flip it for correct lighting.
    var NdotE = Vector.dot(Vector.normalize(N), Vector.normalize(eye));
    if (NdotE < 0) {
        N = Vector.scale(-1, N);
    }

    var NdotL = Vector.dot(Vector.normalize(N), Vector.normalize(lVect));
    console.log(NdotL);
    var NdotH = Vector.dot(Vector.normalize(N), Vector.normalize(Vector.add(Vector.normalize(lVect), Vector.normalize(V))))
    // calc diffuse color
    color.r = pointColors.ambient[0] * lights[0].ambient[0]
    color.g = pointColors.ambient[1] * lights[0].ambient[1]
    color.b = pointColors.ambient[2] * lights[0].ambient[2]

    color.r += pointColors.diffuse[0] * lights[0].diffuse[0] * max(NdotL, 0);
    color.g += pointColors.diffuse[1] * lights[0].diffuse[1] * max(NdotL, 0);
    color.b += pointColors.diffuse[2] * lights[0].diffuse[2] * max(NdotL, 0);

    color.r += pointColors.specular[0] * lights[0].specular[0] * max(NdotH, 0)**pointColors.n;
    color.g += pointColors.specular[1] * lights[0].specular[1] * max(NdotH, 0)**pointColors.n;
    color.b += pointColors.specular[2] * lights[0].specular[2] * max(NdotH, 0)**pointColors.n;

    color.r = min(color.r, 1);
    color.g = min(color.g, 1);
    color.b = min(color.b, 1);

    return color;
}

// read triangles in, load them into webgl buffers
function loadTriangles() {
    if (inputTriangles != String.null) { 
        var currentOffset = 0;
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var indexArray = []; //Index array for triangles using index buffer.
        var colorsArray = [];
        
        //Loop through the arrays of types of triangles.
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            var vertexColors = [];

            //Loop through the triangle index arrays
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++){

                var currentVertices = []
                //For each vertex (index) in the triangle.
                for (var i = 0; i < 3; i++) {
                    //Get triangle's vertex index.
                    var index = currentOffset +  inputTriangles[whichSet].triangles[whichSetTri][i]; //The index into the ENTIRE list of vertices across types.
                    indexArray = indexArray.concat(index); //Set up the index array

                    var vIndex = index - currentOffset; //The index into just this type of triangle.
                    var v = inputTriangles[whichSet].vertices[vIndex] //the current vertex
                    currentVertices[i] = new Vector(v[0], v[1], v[2]); //Set up the mini vertex array.
                }

                //Get the normal for this triangle.
                var currentNormal = Vector.cross(Vector.subtract(currentVertices[1], currentVertices[0]), Vector.subtract(currentVertices[2], currentVertices[0]));

                //For each vertex in the triangle.
                for (var i = 0; i < 3; i++) {
                    //Get index
                    var vIndex = inputTriangles[whichSet].triangles[whichSetTri][i];
                    var currentVertex = inputTriangles[whichSet].vertices[vIndex]
                    var currentVector = new Vector(currentVertex[0], currentVertex[1], currentVertex[2]);
                    var color = doLighting(currentVector, currentNormal, inputTriangles[whichSet].material, new Vector(Eye[0], Eye[1], Eye[2]));
                    var newColors = [color.r, color.g, color.b];
                    vertexColors[vIndex] = newColors;
                    triBufferSize++;
                }
            }
            
            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
                
                var currentVertex = inputTriangles[whichSet].vertices[whichSetVert];
                coordArray = coordArray.concat(currentVertex);
                if (vertexColors[whichSetVert] != undefined) {
                    colorsArray = colorsArray.concat(vertexColors[whichSetVert]);
                    colorsArray = colorsArray.concat(1.0); //Finish the colors array for this triangle.
                }
                currentOffset++;
            }
        } // end for each triangle set 

        //Create vertex buffer and fill it with our data
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        //Create color buffer and fill it with our data
        triangleVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsArray), gl.STATIC_DRAW);
        triangleVertexColorBuffer.itemSize = 4;
        triangleVertexColorBuffer.numItems = 3;

        //Create element array buffer and fill it with our data.
        triangleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition;
        attribute vec4 aVertexColor;
        uniform mat4 u_matrix;

        varying vec4 vColor;

        void main(void) {
            gl_Position = u_matrix * vec4(vertexPosition, 1.0); // use the untransformed position

            vColor = aVertexColor;
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                matrixLocation=gl.getUniformLocation(shaderProgram,"u_matrix");
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexColorAttrib = gl.getAttribLocation(shaderProgram, "aVertexColor");
                gl.enableVertexAttribArray(vertexColorAttrib);
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders
var bgColor = 0;
// render the loaded model

function renderTriangles() {
    var indexType = gl.UNSIGNED_SHORT;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    // bgColor = (bgColor < 1) ? (bgColor + 0.001) : 0;
    gl.clearColor(0, 0, 0, 1.0);
    // requestAnimationFrame(renderTriangles);

    //Set up view
    var fieldOfViewRadians = degToRad(90);
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = .5;
    var zFar = 1.5;

    var lookAtMatrix=mat4.create();
    var perspectiveMatrix=mat4.create();
    var uniformMatrix=mat4.create();

    let eye=vec3.fromValues(.5, .5, -.5);
    let center=vec3.fromValues(.5, .5, .5);
    let up=vec3.fromValues(0,1,0);
    mat4.lookAt(lookAtMatrix,eye,center,up);
    mat4.perspective(perspectiveMatrix,fieldOfViewRadians, aspect, zNear, zFar);
    mat4.multiply(uniformMatrix,lookAtMatrix,uniformMatrix);
    mat4.multiply(uniformMatrix,perspectiveMatrix,uniformMatrix);
    gl.uniformMatrix4fv(matrixLocation,false,uniformMatrix);
    //End view


    //Activate vertex buffer and feed it in.
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0);

    //Activate color vertex buffer and feed it in.
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer(vertexColorAttrib, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //Activate index buffer.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);

    gl.drawElements(gl.TRIANGLES, triBufferSize, indexType, 0); // render
} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  
} // end main

//Remember gl.enable(gl.DEPTH_TEST) from orthographic 3d.