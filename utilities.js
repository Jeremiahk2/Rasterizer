//Vector class taken from exercise 2 & 4
class Vector { 
    constructor(x,y,z) {
        this.set(x,y,z);
    } // end constructor
    
    // sets the components of a vector
    set(x,y,z) {
        try {
            if ((typeof(x) !== "number") || (typeof(y) !== "number") || (typeof(z) !== "number"))
                throw "vector component not a number";
            else
                this.x = x; this.y = y; this.z = z; 
        } // end try
        
        catch(e) {
            console.log(e);
        }
    } // end vector set
    
    // copy the passed vector into this one
    copy(v) {
        try {
            if (!(v instanceof Vector))
                throw "Vector.copy: non-vector parameter";
            else
                this.x = v.x; this.y = v.y; this.z = v.z;
        } // end try
        
        catch(e) {
            console.log(e);
        }
    }
    
    toConsole(prefix="") {
        console.log(prefix+"["+this.x+","+this.y+","+this.z+"]");
    } // end to console
    
    // static dot method
    static dot(v1,v2) {
        try {
            if (!(v1 instanceof Vector) || !(v2 instanceof Vector))
                throw "Vector.dot: non-vector parameter";
            else
                return(v1.x*v2.x + v1.y*v2.y + v1.z*v2.z);
        } // end try
        
        catch(e) {
            console.log(e);
            return(NaN);
        }
    } // end dot static method
    
    // static cross method
    static cross(v1,v2) {
        try {
            if (!(v1 instanceof Vector) || !(v2 instanceof Vector))
                throw "Vector.cross: non-vector parameter";
            else {
                var crossX = v1.y*v2.z - v1.z*v2.y;
                var crossY = v1.z*v2.x - v1.x*v2.z;
                var crossZ = v1.x*v2.y - v1.y*v2.x;
                return(new Vector(crossX,crossY,crossZ));
            } // endif vector params
        } // end try
        
        catch(e) {
            console.log(e);
            return(NaN);
        }
    } // end dot static method
    
    // static add method
    static add(v1,v2) {
        try {
            if (!(v1 instanceof Vector) || !(v2 instanceof Vector))
                throw "Vector.add: non-vector parameter";
            else
                return(new Vector(v1.x+v2.x,v1.y+v2.y,v1.z+v2.z));
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end add static method

    // static subtract method, v1-v2
    static subtract(v1,v2) {
        try {
            if (!(v1 instanceof Vector) || !(v2 instanceof Vector))
                throw "Vector.subtract: non-vector parameter";
            else {
                var v = new Vector(v1.x-v2.x,v1.y-v2.y,v1.z-v2.z);
                return(v);
            }
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end subtract static method

    // static scale method
    static scale(c,v) {
        try {
            if (!(typeof(c) === "number") || !(v instanceof Vector))
                throw "Vector.scale: malformed parameter";
            else
                return(new Vector(c*v.x,c*v.y,c*v.z));
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end scale static method
    
    // static normalize method
    static normalize(v) {
        try {
            if (!(v instanceof Vector))
                throw "Vector.normalize: parameter not a vector";
            else {
                var lenDenom = 1/Math.sqrt(Vector.dot(v,v));
                return(Vector.scale(lenDenom,v));
            }
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    } // end scale static method

    static magnitude(v) {
        try {
            if (!(v instanceof Vector))
                throw "Vector.normalize: parameter not a vector";
            else {
                
                return(Math.sqrt(Vector.dot(v, v)));
            }
        } // end try
        
        catch(e) {
            console.log(e);
            return(new Vector(NaN,NaN,NaN));
        }
    }
    
} // end Vector class

//Color class taken from exercise 2 and 4
class Color {
    
    // Color constructor default opaque black
constructor(r=0,g=0,b=0,a=255) {
    try {
        if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
            throw "color component not a number";
        else if ((r<0) || (g<0) || (b<0) || (a<0)) 
            throw "color component less than 0";
        else if ((r>255) || (g>255) || (b>255) || (a>255)) 
            throw "color component bigger than 255";
        else {
            this.r = r; this.g = g; this.b = b; this.a = a; 
        }
    } // end try
    
    catch (e) {
        console.log(e);
    }
} // end Color constructor

    // Color change method
change(r,g,b,a) {
    try {
        if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
            throw "color component not a number";
        else if ((r<0) || (g<0) || (b<0) || (a<0)) 
            throw "color component less than 0";
        else if ((r>255) || (g>255) || (b>255) || (a>255)) 
            throw "color component bigger than 255";
        else {
            this.r = r; this.g = g; this.b = b; this.a = a; 
            return(this);
        }
    } // end throw
    
    catch (e) {
        console.log(e);
    }
} // end Color change method

    // Color add method
add(c) {
    try {
        if (!(c instanceof Color))
            throw "Color.add: non-color parameter";
        else {
            this.r += c.r; this.g += c.g; this.b += c.b; this.a += c.a;
            return(this);
        }
    } // end try
    
    catch(e) {
        console.log(e);
    }
} // end color add

    // Color subtract method
subtract(c) {
    try {
        if (!(c instanceof Color))
            throw "Color.subtract: non-color parameter";
        else {
            this.r -= c.r; this.g -= c.g; this.b -= c.b; this.a -= c.a;
            return(this);
        }
    } // end try
    
    catch(e) {
        console.log(e);
    }
} // end color subgtract

    // Color scale method
scale(s) {
    try {
        if (typeof(s) !== "number")
            throw "scale factor not a number";
        else {
            this.r *= s; this.g *= s; this.b *= s; this.a *= s; 
            return(this);
        }
    } // end throw
    
    catch (e) {
        console.log(e);
    }
} // end Color scale method

    // Color copy method
copy(c) {
    try {
        if (!(c instanceof Color))
            throw "Color.copy: non-color parameter";
        else {
            this.r = c.r; this.g = c.g; this.b = c.b; this.a = c.a;
            return(this);
        }
    } // end try
    
    catch(e) {
        console.log(e);
    }
} // end Color copy method

    // Color clone method
clone() {
    var newColor = new Color();
    newColor.copy(this);
    return(newColor);
} // end Color clone method

    // translate color to string
toString() {
    return(this.r +" "+ this.g +" "+ this.b +" "+ this.a);
}  // end Color toConsole

    // Send color to console
toConsole() {
    console.log(this.toString());
}  // end Color toConsole

} // end color class

function max(first, second) {
    return first > second ? first : second;
}

function min(first, second) {
    return first < second ? first : second;
}

function radToDeg(r) {
return r * 180 / Math.PI;
}

function degToRad(d) {
return d * Math.PI / 180;
}


var freestyle =  [ 
    //Right stick
    {
    "material": {"ambient": [210/255, 180/255, 140/255], "diffuse": [.1,.1,.1], "specular": [1,1,1], "n":100, "alpha": 0.7, "texture": "billie.jpg"}, 
    "vertices": [[0.0, -.25, 0.10],[0.0, 0.05, 0.10],[0.05,0.05,0.10],[0.05,-0.25,0.10],
                 [0.0, -.25, 0.15],[0.0, 0.05, 0.15],[0.05,0.05,0.15],[0.05,-0.25,0.15]],
    "normals": [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]],
    "uvs": [[0,0], [0,1], [1,1], [1,0]],
    "triangles": [[0,1,2],[2,3,0], [4,5,6], [6, 7, 4], [0, 4, 1], [4, 1, 5], [2, 6, 3], [6, 3, 7]]
    },
    //STICK 4S
    {
    "material": {"ambient": [210/255, 180/255, 140/255], "diffuse": [.1,.1,.1], "specular": [1,1,1], "n":100, "alpha": 0.7, "texture": "billie.jpg"}, 
    "vertices": [[0.2, -.85, 0.10],[0.2, 0.05, 0.10],[0.25,0.05,0.10],[0.25,-0.85,0.10],
                 [0.2, -.85, 0.15],[0.2, 0.05, 0.15],[0.25,0.05,0.15],[0.25,-0.85,0.15]],
    "normals": [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]],
    "uvs": [[0,0], [0,1], [1,1], [1,0]],
    "triangles": [[0,1,2],[2,3,0], [4,5,6], [6, 7, 4], [0, 4, 1], [4, 1, 5], [2, 6, 3], [6, 3, 7]]
    },
    //STICK 3
    {
      "material": {"ambient": [210/255, 180/255, 140/255], "diffuse": [.1,.1,.1], "specular": [1,1,1], "n":100, "alpha": 0.7, "texture": "billie.jpg"}, 
      "vertices": [[0.4, -.55, 0.10],[0.4, 0.05, 0.10],[0.45,0.05,0.10],[0.45,-0.55,0.10],
                   [0.4, -.55, 0.15],[0.4, 0.05, 0.15],[0.45,0.05,0.15],[0.45,-0.55,0.15]],
      "normals": [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]],
      "uvs": [[0,0], [0,1], [1,1], [1,0]],
      "triangles": [[0,1,2],[2,3,0], [4,5,6], [6, 7, 4], [0, 4, 1], [4, 1, 5], [2, 6, 3], [6, 3, 7]]
    },
    //STICK 2
    {
    "material": {"ambient": [210/255, 180/255, 140/255], "diffuse": [.1,.1,.1], "specular": [1,1,1], "n":100, "alpha": 0.7, "texture": "billie.jpg"}, 
    "vertices": [[0.6, -.35, 0.10],[0.6, 0.05, 0.10],[0.65,0.05,0.10],[0.65,-0.35,0.10],
                [0.6, -.35, 0.15],[0.6, 0.05, 0.15],[0.65,0.05,0.15],[0.65,-0.35,0.15]],
    "normals": [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]],
    "uvs": [[0,0], [0,1], [1,1], [1,0]],
    "triangles": [[0,1,2],[2,3,0], [4,5,6], [6, 7, 4], [0, 4, 1], [4, 1, 5], [2, 6, 3], [6, 3, 7]]
    },
    //STICK 1 Winning stick
    {
    "material": {"ambient": [210/255, 180/255, 140/255], "diffuse": [.1,.1,.1], "specular": [1,1,1], "n":100, "alpha": 0.7, "texture": "billie.jpg"}, 
    "vertices": [[0.8, -.15, 0.10],[0.8, 0.05, 0.10],[0.85,0.05,0.10],[0.85,-0.15,0.10],//Front face
                 [0.8, -.15, 0.15],[0.8, 0.05, 0.15],[0.85,0.05,0.15],[0.85,-0.15,0.15]], //Back face
                
    "normals": [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]],
    "uvs": [[0,0], [0,1], [1,1], [1,0]],
    "triangles": [[0,1,2],[2,3,0], [4,5,6], [6, 7, 4], [0, 4, 1], [4, 1, 5], [2, 6, 3], [6, 3, 7]]
    },
    //STICK 0
    {
    "material": {"ambient": [210/255, 180/255, 140/255], "diffuse": [.1,.1,.1], "specular": [1,1,1], "n":100, "alpha": 0.7, "texture": "billie.jpg"}, 
    "vertices": [[1.0, -.45, 0.10],[1.0, 0.05, 0.10],[1.05,0.05,0.10],[1.05,-0.45,0.10],
                 [1.0, -.45, 0.15],[1.0, 0.05, 0.15],[1.05,0.05,0.15],[1.05,-0.45,0.15]],
    "normals": [[0, 0, -1],[0, 0, -1],[0, 0,-1],[0, 0,-1]],
    "uvs": [[0,0], [0,1], [1,1], [1,0]],
    "triangles": [[0,1,2],[2,3,0], [4,5,6], [6, 7, 4], [0, 4, 1], [4, 1, 5], [2, 6, 3], [6, 3, 7]]
    },
    ];