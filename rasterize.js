/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles2.json"; // triangles file loc
const INPUT_LIGHTS_URL = "https://ncsucgclass.github.io/prog3/lights.json";
//const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog3/spheres.json"; // spheres file loc

let eye=vec3.fromValues(.5, .5, -.5);
let center=vec3.fromValues(.5, .5, 0.0);
let up=vec3.fromValues(0,1,0);
var cameraAngleRadians = degToRad(0);

var inputTriangles =  getJSONFile(INPUT_TRIANGLES_URL, "triangles");
var lights = [
    {"x": -.5, "y": 1.5, "z": -.5, "ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1]}
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

var whichSetScale = [];
var whichSetTranslate = [];
var whichSetRotate = [];
var currentSelection = 0;


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
    gl.viewport(0, 0, canvas.width, canvas.height);
 
} // end setupWebGL



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
        var scaleArray = [];
        var centerArray = [];
        var translationArray = [];
        var rotationArray = [];
        
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

                var currentCenter = new Vector(0.0, 0.0, 0.0);
                //For each vertex in the set, calculate the center point for scaling and rotations.
                for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
                    var v = inputTriangles[whichSet].vertices[whichSetVert] //the current vertex
                    currentCenter = Vector.add(currentCenter, new Vector(v[0], v[1], v[2]));
                }
                currentCenter = Vector.scale(1.0 / inputTriangles[whichSet].vertices.length, currentCenter);
                //For each vertex in the triangle.
                for (var i = 0; i < 3; i++) {
                    //Get index
                    var vIndex = inputTriangles[whichSet].triangles[whichSetTri][i];

                    var index = vIndex + currentOffset;
                    normalArray[index * 3 + 0] = currentNormal.x; 
                    normalArray[index * 3 + 1] = currentNormal.y; 
                    normalArray[index * 3 + 2] = currentNormal.z; 

                    centerArray[index * 3 + 0] = currentCenter.x; 
                    centerArray[index * 3 + 1] = currentCenter.y; 
                    centerArray[index * 3 + 2] = currentCenter.z; 

                    translationArray[index * 3 + 0] = whichSetTranslate[whichSet][0];
                    translationArray[index * 3 + 1] = whichSetTranslate[whichSet][1];
                    translationArray[index * 3 + 2] = whichSetTranslate[whichSet][2];

                    rotationArray[index * 3 + 0] = whichSetRotate[whichSet][0];
                    rotationArray[index * 3 + 1] = whichSetRotate[whichSet][1];
                    rotationArray[index * 3 + 2] = whichSetRotate[whichSet][2];
                    
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

                    scaleArray[index] = whichSetScale[whichSet];


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

        gl.bindBuffer(gl.ARRAY_BUFFER,scaleBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(scaleArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,centerBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(centerArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,translateBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(translationArray),gl.STATIC_DRAW); // coords to that buffer

        gl.bindBuffer(gl.ARRAY_BUFFER,rotationBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(rotationArray),gl.STATIC_DRAW); // coords to that buffer


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
        varying vec4 fragNormal;          // Varying for normal
        varying vec4 fragPosition;        // Varying for fragment position
        varying vec3 fragDiffuse; 
        varying vec3 fragAmbient; 
        varying vec3 fragSpecular; 
        varying float fragShininess; 
        varying vec4 lightPos;

        //Static inputs
           // Light source position Need to modify this. DO NOT apply the model transform, just view and perspective
        uniform vec4 viewPosition;    // Camera position
        uniform vec3 lightAmbient;
        uniform vec3 lightDiffuse;
        uniform vec3 lightSpecular;

        void main(void) {
            vec3 realNormal = vec3(fragNormal[0], fragNormal[1], fragNormal[2]); 
            vec3 realLightPos = vec3(lightPos[0], lightPos[1], lightPos[2]); 
            vec3 realFragPosition = vec3(fragPosition[0], fragPosition[1], fragPosition[2]); 
            vec3 realView = vec3(viewPosition[0], viewPosition[1], viewPosition[2]); 

            vec3 N = normalize(realNormal); 
            vec3 lVect = realLightPos - realFragPosition;
            vec3 V = realView - realFragPosition; 

            float NdotE = dot(N, normalize(V));

            if (NdotE < 0.0) {
                N = N * -1.0;
            }

            //normal of lVect is -.511, .483, -.711
            float NdotL = dot(normalize(N), normalize(lVect));
            float NdotH = dot(normalize(N), normalize(normalize(lVect) + normalize(V)));

            vec4 color = vec4(0.0, 0.0, 0.0, 1.0);

            color[0] += fragAmbient[0] * lightAmbient[0];
            color[1] += fragAmbient[1] * lightAmbient[1];
            color[2] += fragAmbient[2] * lightAmbient[2];

            color[0] += fragDiffuse[0] * lightDiffuse[0] * max(NdotL, 0.0); 
            color[1] += fragDiffuse[1] * lightDiffuse[1] * max(NdotL, 0.0); 
            color[2] += fragDiffuse[2] * lightDiffuse[2] * max(NdotL, 0.0);

            color[0] += fragSpecular[0] * lightSpecular[0] * pow(max(NdotH, 0.0), fragShininess); 
            color[1] += fragSpecular[1] * lightSpecular[1] * pow(max(NdotH, 0.0), fragShininess); 
            color[2] += fragSpecular[2] * lightSpecular[2] * pow(max(NdotH, 0.0), fragShininess);

            // color[0] = 0.1;
            // color[1] = 0.1;
            // color[2] = .205;

            gl_FragColor = color;

        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        precision mediump float;

        //Buffer inputs
        attribute vec3 vertexPosition;
        attribute vec3 normal;
        attribute vec3 ambient;   // Ambient light color
        attribute vec3 diffuse;
        attribute vec3 specular;
        attribute float shininess;
        //Transform inputs
        attribute float scaleFactor;
        attribute vec3 center;
        attribute vec3 translation;
        attribute vec3 rotation;

        //Static inputs
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat4 perspectiveMatrix;
        uniform vec3 lightPosition;

        mat4 scale(mat4 m, vec3 s) {
            m[0][0] *= s.x;
            m[1][1] *= s.y;
            m[2][2] *= s.z;
            return m;
        }

        mat4 rotateX(float angle) {
        float cosA = cos(angle);
        float sinA = sin(angle);
        
        return mat4(
            1.0,    0.0,     0.0,    0.0,
            0.0,    cosA,   -sinA,   0.0,
            0.0,    sinA,    cosA,   0.0,
            0.0,    0.0,     0.0,    1.0
        );
    }

    mat4 rotateY(float angle) {
        float cosA = cos(angle);
        float sinA = sin(angle);
        
        return mat4(
            cosA,    0.0,    sinA,    0.0,
            0.0,     1.0,     0.0,    0.0,
            -sinA,   0.0,    cosA,    0.0,
            0.0,     0.0,     0.0,    1.0
        );
    }

    mat4 rotateZ(float angle) {
        float cosA = cos(angle);
        float sinA = sin(angle);
        
        return mat4(
            cosA,   -sinA,    0.0,    0.0,
            sinA,    cosA,    0.0,    0.0,
            0.0,     0.0,     1.0,    0.0,
            0.0,     0.0,     0.0,    1.0
        );
    }


        //Outputs
        varying vec4 fragNormal;          // Varying for normal
        varying vec4 fragPosition;        // Varying for fragment position
        varying vec3 fragAmbient;
        varying vec3 fragDiffuse;
        varying vec3 fragSpecular;
        varying float fragShininess;
        varying vec4 lightPos;

        void main() {

            //Scaling
            //Translate to origin using center
            mat4 translateToOrigin = mat4(1.0);
            translateToOrigin[3] = vec4(-center, 1.0);

            //Scale it
            mat4 scaling = mat4(1.0);
            scaling = scale(scaling, vec3(scaleFactor, scaleFactor, scaleFactor));

            //Translate back
            mat4 translateBack = mat4(1.0);
            translateBack[3] = vec4(center, 1.0);

            //Combine
            mat4 highlight = translateBack * scaling * translateToOrigin;

            //Translating
            mat4 translationMatrix = mat4(1.0);
            translationMatrix[3] = vec4(translation, 1.0);

            //Rotating
            mat4 totalRotation = translateBack * rotateX(rotation[0]) * rotateY(rotation[1]) * rotateZ(rotation[2]) * translateToOrigin;

            fragNormal = vec4(normal, 1.0); // Transform normal  
            fragPosition = translationMatrix * highlight * totalRotation * vec4(vertexPosition, 1.0);
            lightPos =   vec4(lightPosition, 1.0);

            fragAmbient = ambient; // Pass ambient color
            fragDiffuse = diffuse; // Pass diffuse color
            fragSpecular = specular; // Pass specular color
            fragShininess = shininess;

            gl_Position =  perspectiveMatrix * viewMatrix * highlight * translationMatrix * totalRotation * vec4(vertexPosition, 1.0);
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
                scaleattrib = gl.getAttribLocation(shaderProgram, "scaleFactor"); 
                centerattrib = gl.getAttribLocation(shaderProgram, "center"); 
                translateattrib = gl.getAttribLocation(shaderProgram, "translation"); 
                rotateattrib = gl.getAttribLocation(shaderProgram, "rotation"); 
                gl.enableVertexAttribArray(normalattrib); // input to shader from array
                gl.enableVertexAttribArray(ambientattrib); // input to shader from array
                gl.enableVertexAttribArray(diffuseattrib); // input to shader from array
                gl.enableVertexAttribArray(specularattrib); // input to shader from array
                gl.enableVertexAttribArray(shininessattrib); // input to shader from array
                gl.enableVertexAttribArray(scaleattrib); // input to shader from array
                gl.enableVertexAttribArray(centerattrib); // input to shader from array
                gl.enableVertexAttribArray(translateattrib); // input to shader from array
                gl.enableVertexAttribArray(rotateattrib); // input to shader from array
                

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
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
var modelViewLocation
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
var scaleattrib;
var centerattrib;
var translateattrib
var rotateattrib

//Buffers
var normalBuffer;
var ambientBuffer;
var diffuseBuffer;
var specularBuffer;
var shininessBuffer;
var scaleBuffer;
var centerBuffer;
var translateBuffer;
var rotationBuffer;


var bgColor = 0;
// render the loaded model

var viewMatrix=mat4.create();
var modelMatrix = mat4.create();
var modelViewMatrix=mat4.create();
var perspectiveMatrix=mat4.create();
var storageMatrix = mat4.create();
mat4.lookAt(viewMatrix,eye,center,up); //View matrix

function update() {
    triBufferSize = 0;
    loadTriangles();

    //Clear board
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    gl.clearColor(0, 0, 0, 1.0);


    //Set up Perspective
    var indexType = gl.UNSIGNED_SHORT;
    var fieldOfViewRadians = degToRad(90);
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = .1;
    var zFar = 100;
    mat4.perspective(perspectiveMatrix,fieldOfViewRadians, aspect, zNear, zFar); //Perspective Matrix (Projection)
    mat4.invert(modelViewMatrix, modelMatrix);
    mat4.transpose(modelViewMatrix, modelViewMatrix);


    //Uniform matrices
    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
    gl.uniformMatrix4fv(modelLocation, false, modelMatrix);
    gl.uniformMatrix4fv(modelViewLocation,false,modelViewMatrix);
    gl.uniformMatrix4fv(perspectiveLocation,false,perspectiveMatrix);

    //Uniform vec3's
    gl.uniform3fv(lightDiffuseLocation,new vec3.fromValues(lights[0].diffuse[0], lights[0].diffuse[1], lights[0].diffuse[2],));
    gl.uniform3fv(lightAmbientLocation,new vec3.fromValues(lights[0].ambient[0], lights[0].ambient[1], lights[0].ambient[2]));
    gl.uniform3fv(lightSpecularLocation,new vec3.fromValues(lights[0].specular[0], lights[0].specular[1], lights[0].specular[2]));
    gl.uniform3fv(lightPosLocation,new vec3.fromValues(lights[0].x, lights[0].y, lights[0].z));
    gl.uniform4fv(viewPosition, new vec4.fromValues(eye[0], eye[1], eye[2], 1.0));

    //End view


    //Buffers
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

    gl.bindBuffer(gl.ARRAY_BUFFER,scaleBuffer); // activate
    gl.vertexAttribPointer(scaleattrib,1,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,centerBuffer); // activate
    gl.vertexAttribPointer(centerattrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,translateBuffer); // activate
    gl.vertexAttribPointer(translateattrib,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,rotationBuffer); // activate
    gl.vertexAttribPointer(rotateattrib,3,gl.FLOAT,false,0,0);

    //Activate index buffer.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);

    gl.drawElements(gl.TRIANGLES, triBufferSize, indexType, 0); // render
}


/* MAIN -- HERE is where execution begins after window load */

function main() {

    for (var i = 0; i < inputTriangles.length; i++) {
        whichSetScale[i] = 1.0;
        whichSetTranslate[i] = new vec3.fromValues(0.0, 0.0, 0.0);
        whichSetRotate[i] = new vec3.fromValues(0.0, 0.0, 0.0);
    }

    document.addEventListener('keydown', (event)=> {
        if (event.key == "d") {
            eye[0] += .01;
            center[0] += .01
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "a") {
            eye[0] -= .01;
            center[0] -= .01
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "w") {
            eye[2] += .01;
            center[2] += .01
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "s") {
            eye[2] -= .01;
            center[2] -= .01
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "q") {
            eye[1] += .01;
            center[1] += .01
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "e") {
            eye[1] -= .01;
            center[1] -= .01
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "A") {
            const rotationMatrix = mat4.create();
            mat4.rotate(rotationMatrix, rotationMatrix, degToRad(-1), vec3.fromValues(0, 1, 0));

            vec3.transformMat4(center, center, rotationMatrix);
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "D") {
            const rotationMatrix = mat4.create();
            mat4.rotate(rotationMatrix, rotationMatrix, degToRad(1), vec3.fromValues(0, 1, 0));

            vec3.transformMat4(center, center, rotationMatrix);
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "W") {
            const rotationMatrix = mat4.create();
            mat4.rotate(rotationMatrix, rotationMatrix, degToRad(1), vec3.fromValues(1, 0, 0));

            vec3.transformMat4(center, center, rotationMatrix);
            vec3.transformMat4(up, up, rotationMatrix);

            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "S") {
            const rotationMatrix = mat4.create();
            mat4.rotate(rotationMatrix, rotationMatrix, degToRad(-1), vec3.fromValues(1, 0, 0));

            vec3.transformMat4(center, center, rotationMatrix);
            vec3.transformMat4(up, up, rotationMatrix);
            mat4.lookAt(viewMatrix,eye,center,up); //View matrix
        }
        if (event.key == "ArrowLeft") {
            whichSetScale[(currentSelection++) % whichSetScale.length] = 1.0;
            whichSetScale[(currentSelection) % whichSetScale.length] = 1.2;
        }
        if (event.key == "ArrowRight") {
            whichSetScale[(currentSelection--) % whichSetScale.length] = 1.0;
            if (currentSelection < 0) {
                currentSelection = whichSetScale.length - 1;
            }
            whichSetScale[(currentSelection) % whichSetScale.length] = 1.2;
        }
        if (event.key == " ") {
            whichSetScale[(currentSelection) % whichSetScale.length] = 1.0;

        }
        if (event.key == "k") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetTranslate[(currentSelection) % whichSetScale.length][0] = whichSetTranslate[(currentSelection) % whichSetScale.length][0] + .01;
            }
        }
        if (event.key == ";") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetTranslate[(currentSelection) % whichSetScale.length][0] = whichSetTranslate[(currentSelection) % whichSetScale.length][0] - .01;
            }
        }
        if (event.key == "o") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetTranslate[(currentSelection) % whichSetScale.length][2] = whichSetTranslate[(currentSelection) % whichSetScale.length][2] + .01;
            }
        }
        if (event.key == "l") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetTranslate[(currentSelection) % whichSetScale.length][2] = whichSetTranslate[(currentSelection) % whichSetScale.length][2] - .01;
            }
        }
        if (event.key == "i") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetTranslate[(currentSelection) % whichSetScale.length][1] = whichSetTranslate[(currentSelection) % whichSetScale.length][1] + .01;
            }
        }
        if (event.key == "p") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetTranslate[(currentSelection) % whichSetScale.length][1] = whichSetTranslate[(currentSelection) % whichSetScale.length][1] - .01;
            }
        }
        if (event.key == "K") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetRotate[(currentSelection) % whichSetScale.length][1] = whichSetRotate[(currentSelection) % whichSetScale.length][1] + degToRad(3);
            }
        }
        if (event.key == ":") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetRotate[(currentSelection) % whichSetScale.length][1] = whichSetRotate[(currentSelection) % whichSetScale.length][1] - degToRad(3);
            }
        }
        if (event.key == "O") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetRotate[(currentSelection) % whichSetScale.length][0] = whichSetRotate[(currentSelection) % whichSetScale.length][0] + degToRad(3);
            }
        }
        if (event.key == "L") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetRotate[(currentSelection) % whichSetScale.length][0] = whichSetRotate[(currentSelection) % whichSetScale.length][0] - degToRad(3);
            }
        }
        if (event.key == "I") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetRotate[(currentSelection) % whichSetScale.length][2] = whichSetRotate[(currentSelection) % whichSetScale.length][2] + degToRad(3);
            }
        }
        if (event.key == "P") {
            if (whichSetScale[(currentSelection) % whichSetScale.length] == 1.2) {
                whichSetRotate[(currentSelection) % whichSetScale.length][2] = whichSetRotate[(currentSelection) % whichSetScale.length][2] - degToRad(3);
            }
        }

        
        requestAnimationFrame(update);
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
    scaleBuffer = gl.createBuffer();
    centerBuffer = gl.createBuffer();
    translateBuffer = gl.createBuffer();
    rotationBuffer = gl.createBuffer();
    setupShaders(); // setup the webGL shaders
    update(); // draw the triangles using webGL
  
} // end main

//Remember gl.enable(gl.DEPTH_TEST) from orthographic 3d.