/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles2.json"; // triangles file loc
const INPUT_LIGHTS_URL = "https://ncsucgclass.github.io/prog3/lights.json";
//const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog3/spheres.json"; // spheres file loc

var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space
let eye=vec3.fromValues(.5, .5, -.5);
let center=vec3.fromValues(.5, .5, .5);
let up=vec3.fromValues(0,1,0);
var cameraAngleRadians = degToRad(0);

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
        var normalArray = [];
        var colorsArray = [];
        var ambientArray = [];
        var diffuseArray = [];
        var specularArray = [];
        var shininessArray = [];
        
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
                    vertexColors[vIndex] = newColors; //Fil Color buffer (TO BE DELETED)

                    var index = vIndex + currentOffset;
                    normalArray[index * 3 + 0] = currentNormal.x; //Fill normal array
                    normalArray[index * 3 + 1] = currentNormal.y; //Fill normal array
                    normalArray[index * 3 + 2] = currentNormal.z; //Fill normal array
                    
                    ambientArray[index * 3 + 0] = inputTriangles[whichSet].material.ambient[0];
                    ambientArray[index * 3 + 1] = inputTriangles[whichSet].material.ambient[1];
                    ambientArray[index * 3 + 2] = inputTriangles[whichSet].material.ambient[2];

                    diffuseArray[index * 3 + 0] = inputTriangles[whichSet].material.diffuse[0];
                    diffuseArray[index * 3 + 1] = inputTriangles[whichSet].material.diffuse[1];
                    diffuseArray[index * 3 + 2] = inputTriangles[whichSet].material.diffuse[2];

                    specularArray[index * 3 + 0] = inputTriangles[whichSet].material.specular[0];
                    specularArray[index * 3 + 1] = inputTriangles[whichSet].material.specular[1];
                    specularArray[index * 3 + 2] = inputTriangles[whichSet].material.specular[2];

                    shininessArray[index] = inputTriangles[whichSet].material.n
                    shininessArray[index] = inputTriangles[whichSet].material.n;
                    shininessArray[index] = inputTriangles[whichSet].material.n;


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
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normalArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ambientArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(diffuseArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(specularArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,shininessBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(shininessArray),gl.STATIC_DRAW); // coords to that buffer

        //Create element array buffer and fill it with our data.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);

        //Create color buffer and fill it with our data
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsArray), gl.STATIC_DRAW);
        triangleVertexColorBuffer.itemSize = 4;
        triangleVertexColorBuffer.numItems = 3;
    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;

        //vShader inputs
        varying vec4 vColor;
        varying vec3 fragNormal;          // Varying for normal
        varying vec3 fragPosition;        // Varying for fragment position
        varying vec3 fragDiffuse; 
        varying vec3 fragAmbient; 
        varying vec3 fragSpecular; 
        varying float fragShininess; 

        //Static inputs
        uniform vec3 lightPosition;   // Light source position
        uniform vec3 viewPosition;    // Camera position
        uniform vec3 lightAmbient;
        uniform vec3 lightDiffuse;
        uniform vec3 lightSpecular;

        void main(void) {
        
            vec3 lVect = lightPosition - fragPosition;
            
            
            float NdotE = dot(normalize(fragNormal), normalize(viewPosition));

            vec3 N = fragNormal;
            if (NdotE < 0.0) {
                N = N * -1.0;
            }

            float NdotL = dot(normalize(N), normalize(lVect));
            float NdotH = dot(normalize(N), normalize(normalize(lVect) + normalize(viewPosition)));

            vec4 color;

            color[0] = fragAmbient[0] * lightAmbient[0];
            color[1] = fragAmbient[1] * lightAmbient[1];
            color[2] = fragAmbient[2] * lightAmbient[2];

            color[0] += fragDiffuse[0] * lightDiffuse[0] * max(NdotL, 0.0);
            color[1] += fragDiffuse[1] * lightDiffuse[1] * max(NdotL, 0.0);
            color[2] += fragDiffuse[2] * lightDiffuse[2] * max(NdotL, 0.0);

            color[0] += fragSpecular[0] * lightSpecular[0] * pow(max(NdotH, 0.0), fragShininess);
            color[1] += fragSpecular[1] * lightSpecular[1] * pow(max(NdotH, 0.0), fragShininess);
            color[2] += fragSpecular[2] * lightSpecular[2] * pow(max(NdotH, 0.0), fragShininess);

            color[0] = min(color[0], 1.0);
            color[1] = min(color[1], 1.0);
            color[2] = min(color[2], 1.0);
            color[3] = 1.0;

            // if (NdotE >= 0.0) {
            //     gl_FragColor = vColor;
            // }

            gl_FragColor = color;
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        precision mediump float;

        //Buffer inputs
        attribute vec3 vertexPosition;

        attribute vec4 aVertexColor;
        attribute vec3 normal;
        attribute vec3 ambient;   // Ambient light color
        attribute vec3 diffuse;
        attribute vec3 specular;
        attribute float shininess;

        //Static inputs
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat4 perspectiveMatrix;

        //Outputs
        varying vec4 vColor;
        varying vec3 fragNormal;          // Varying for normal
        varying vec3 fragPosition;        // Varying for fragment position
        varying vec3 fragAmbient;
        varying vec3 fragDiffuse;
        varying vec3 fragSpecular;
        varying float fragShininess;

        void main() {
            // Transform the vertex position to clip space
            gl_Position =  perspectiveMatrix * modelMatrix * viewMatrix * vec4(vertexPosition, 1.0);

            fragNormal = normalize(mat3(modelViewMatrix) * mat3(perspectiveMatrix) * normal); // Transform normal
            fragPosition = vertexPosition;

            fragAmbient = ambient; // Pass ambient color
            fragDiffuse = diffuse; // Pass diffuse color
            fragSpecular = specular; // Pass specular color
            fragShininess = shininess;

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

                modelLocation=gl.getUniformLocation(shaderProgram,"modelMatrix");
                viewLocation=gl.getUniformLocation(shaderProgram,"viewMatrix");
                modelViewLocation=gl.getUniformLocation(shaderProgram,"modelViewMatrix");
                perspectiveLocation=gl.getUniformLocation(shaderProgram,"perspectiveMatrix");
                lightDiffuseLocation=gl.getUniformLocation(shaderProgram,"lightDiffuse");
                lightAmbientLocation=gl.getUniformLocation(shaderProgram,"lightAmbient");
                lightSpecularLocation=gl.getUniformLocation(shaderProgram,"lightSpecular");
                lightPosLocation=gl.getUniformLocation(shaderProgram,"lightPosition");
                viewPosition=gl.getUniformLocation(shaderProgram,"viewPosition");

                normalattrib = gl.getAttribLocation(shaderProgram, "normal"); 
                ambientattrib = gl.getAttribLocation(shaderProgram, "ambient"); 
                diffuseattrib = gl.getAttribLocation(shaderProgram, "diffuse"); 
                specularattrib = gl.getAttribLocation(shaderProgram, "specular"); 
                shininessattrib = gl.getAttribLocation(shaderProgram, "shininess"); 
                gl.enableVertexAttribArray(normalattrib); // input to shader from array
                gl.enableVertexAttribArray(ambientattrib); // input to shader from array
                gl.enableVertexAttribArray(diffuseattrib); // input to shader from array
                gl.enableVertexAttribArray(specularattrib); // input to shader from array
                gl.enableVertexAttribArray(shininessattrib); // input to shader from array
                

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); 
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

//Vertex data:
var modelLocation;
var viewLocation;
var perspectiveLocation;
var lightDiffuseLocation;
var lightAmbientLocation;
var lightSpecularLocation;
var lightPosLocation;
var viewPosition;

//Attributes
var normalattrib;
var ambientattrib;
var diffuseattrib;
var specularattrib;
var shininessattrib;

//Buffers
var normalBuffer;
var ambientBuffer;
var diffuseBuffer;
var specularBuffer;
var shininessBuffer;


var bgColor = 0;
// render the loaded model

function renderTriangles() {
    var indexType = gl.UNSIGNED_SHORT;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    // bgColor = (bgColor < 1) ? (bgColor + 0.001) : 0;
    gl.clearColor(0, 0, 0, 1.0);

    //Set up view
    var fieldOfViewRadians = degToRad(90);
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = .5;
    var zFar = 1.5;

    //Create our matrices
    var viewMatrix=mat4.create();
    var modelMatrix = mat4.create();
    var modelViewMatrix=mat4.create();
    var perspectiveMatrix=mat4.create();

    //Set up our matrices
    mat4.fromTranslation(modelMatrix, new vec3.fromValues(0, 0, 0));
    mat4.lookAt(viewMatrix,eye,center,up); //View matrix
    mat4.perspective(perspectiveMatrix,fieldOfViewRadians, aspect, zNear, zFar); //Perspective Matrix (Projection)

    //Combine them
    mat4.multiply(modelViewMatrix, modelMatrix, modelViewMatrix);
    mat4.multiply(modelViewMatrix,viewMatrix,modelViewMatrix);
    // mat4.multiply(uniformMatrix,perspectiveMatrix,uniformMatrix);
    //Send them
    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
    gl.uniformMatrix4fv(modelViewLocation,false,modelViewMatrix);
    gl.uniformMatrix4fv(perspectiveLocation,false,perspectiveMatrix);

    gl.uniform3fv(lightDiffuseLocation,new vec3.fromValues(lights[0].diffuse[0], lights[0].diffuse[1], lights[0].diffuse[2],));
    gl.uniform3fv(lightAmbientLocation,new vec3.fromValues(lights[0].ambient[0], lights[0].ambient[1], lights[0].ambient[2]));
    gl.uniform3fv(lightSpecularLocation,new vec3.fromValues(lights[0].specular[0], lights[0].specular[1], lights[0].specular[2]));
    gl.uniform3fv(lightPosLocation,new vec3.fromValues(lights[0].x, lights[0].y, lights[0].z));
    gl.uniform3fv(viewPosition, new vec3.fromValues(Eye[0], Eye[1], Eye[2]));
    //End view


    //Activate vertex buffer and feed it in.
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate
    gl.vertexAttribPointer(normalattrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer); // activate
    gl.vertexAttribPointer(diffuseattrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer); // activate
    gl.vertexAttribPointer(specularattrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer); // activate
    gl.vertexAttribPointer(ambientattrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,shininessBuffer); // activate
    gl.vertexAttribPointer(shininessattrib,1,gl.FLOAT,false,0,0);

    //Activate color vertex buffer and feed it in.
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer(vertexColorAttrib, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //Activate index buffer.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);

    gl.drawElements(gl.TRIANGLES, triBufferSize, indexType, 0); // render
} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function main() {

    document.addEventListener('keydown', (event)=> {
        if (event.key == "d") {
            eye[0] = eye[0] - .01;
            center[0] = center[0] - .01;
            triBufferSize = 0;
            loadTriangles();
            requestAnimationFrame(renderTriangles);
        }
        if (event.key == "a") {
            eye[0] = eye[0] + .01;
            center[0] = center[0] + .01;
            triBufferSize = 0;
            loadTriangles();
            requestAnimationFrame(renderTriangles);
        }
        if (event.key == "w") {
            eye[2] = eye[2] + .01;
            center[2] = center[2] + .01;
            triBufferSize = 0;
            loadTriangles();
            requestAnimationFrame(renderTriangles);
        }
        if (event.key == "s") {
            eye[2] = eye[2] - .01;
            center[2] = center[2] - .01;
            triBufferSize = 0;
            loadTriangles();
            requestAnimationFrame(renderTriangles);
        }
        if (event.key == "q") {
            eye[1] = eye[1] + .01;
            center[1] = center[1] + .01;
            triBufferSize = 0;
            loadTriangles();
            requestAnimationFrame(renderTriangles);
        }
        if (event.key == "e") {
            eye[1] = eye[1] - .01;
            center[1] = center[1] - .01;
            triBufferSize = 0;
            loadTriangles();
            requestAnimationFrame(renderTriangles);
        }

    })

    setupWebGL(); // set up the webGL environment
    vertexBuffer = gl.createBuffer();
    triangleVertexColorBuffer = gl.createBuffer();
    triangleBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();
    ambientBuffer = gl.createBuffer();
    diffuseBuffer = gl.createBuffer();
    specularBuffer = gl.createBuffer();
    shininessBuffer = gl.createBuffer();
    loadTriangles(); // load in the triangles from tri file
    setupShaders(); // setup the webGL shaders
    renderTriangles(); // draw the triangles using webGL
  
} // end main

//Remember gl.enable(gl.DEPTH_TEST) from orthographic 3d.