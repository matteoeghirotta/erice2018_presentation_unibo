export function buildAttribs(gl, layout) {
    var attribs = {};
    for (var key in layout) {
        attribs[key] = {
            buffer: new GLBuffer(gl),
            size: layout[key]
        };
    }
    return attribs;
}


export function Framebuffer(gl, color, depth, ext) {

    var self = this;

    self.initialize = function() {
        self.fb = gl.createFramebuffer();
        self.bind();

        if (color.length > 1) {

	    console.warn("FRAMEBUFFER " + color.length);
	    alert("FRAMEBUFFER " + color.length);

            var drawBuffers = [];
            for (var i = 0; i < color.length; i++) {
                drawBuffers.push(ext["COLOR_ATTACHMENT" + i + "_WEBGL"]);
            }

            gl.drawBuffers(drawBuffers);
            // ext.drawBuffersWEBGL(drawBuffers);
            for (var i = 0; i < color.length; i++) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER,
					ext["COLOR_ATTACHMENT" + i + "_WEBGL"],
					gl.TEXTURE_2D,
					color[i].texture, 0);
            }
        } else {
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
				    gl.COLOR_ATTACHMENT0,
				    gl.TEXTURE_2D,
				    color[0].texture, 0);
        }
	
        if (depth !== undefined) {
	    //console.warn("DEPTH framebuffer");
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
				    gl.DEPTH_ATTACHMENT,
				    gl.TEXTURE_2D,
				    depth.texture, 0);
	    //console.warn("DEPTH framebuffer DONE");
        }
    };

    self.bind = function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, self.fb);
    };

    self.initialize();

};


export function Texture(gl, index, data, width, height, options) {
    options = options || {};
    options.target = options.target || gl.TEXTURE_2D;
    options.mag = options.mag || gl.NEAREST;
    options.min = options.min || gl.NEAREST;
    options.wraps = options.wraps || gl.CLAMP_TO_EDGE;
    options.wrapt = options.wrapt || gl.CLAMP_TO_EDGE;
    options.internalFormat = options.internalFormat || gl.RGBA;
    options.format = options.format || gl.RGBA;
    options.type = options.type || gl.UNSIGNED_BYTE;

    var self = this;

    self.initialize = function() {
        self.index = index;
        self.activate();
        self.texture = gl.createTexture();
        self.bind();
        gl.texParameteri(options.target, gl.TEXTURE_MAG_FILTER, options.mag);
        gl.texParameteri(options.target, gl.TEXTURE_MIN_FILTER, options.min);
        gl.texParameteri(options.target, gl.TEXTURE_WRAP_S, options.wraps);
        gl.texParameteri(options.target, gl.TEXTURE_WRAP_T, options.wrapt);
 
	//console.log('ALLOC DATA TYPE: ' + options.type + ' data ' + data);

        // if (data === null
	//     ||
	//     typeof data === 'undefined'
	//     ||
	//     typeof data === 'null') {

	//     //console.log('alloc data type: ' + options.type);
        //     if (options.type === gl.UNSIGNED_BYTE) {
        //         data = new Uint8Array(width * height * 8);
	// 	// data = new Uint8Array([0, 0, 255, 255]);
	// 	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
        //     } else if (options.type === gl.UNSIGNED_SHORT) {
        //         data = new Uint16Array(width * height);
	// 	// data = new Uint16Array([0]);
	// 	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        //     } else {
        //         console.log('unsupported data type: ' + options.type);
        //     }
	// }
	
        // console.log('options.internalFormat: '
        //             + options.internalFormat.toString(16)
        //             + ' options.format: '
        //             + options.format.toString(16)
        //             + ' gl.RGBA: '
        //             + gl.RGBA.toString(16)
        //             + ' gl.DEPTH_COMPONENT: '
        //             + gl.DEPTH_COMPONENT.toString(16)
        //             + ' options.type: '
        //             + options.type.toString(16)
	// 	    + ' size '
	// 	    + width
	// 	    + ' x '
	// 	    + height
        //             + ' data: '
        //             + data.toString(16)
	// 	   );

        gl.texImage2D(options.target,
		      0,
		      options.internalFormat,
		      width, height,
		      0,
		      options.format,
		      options.type,
		      data);

	// if (options.type === gl.UNSIGNED_SHORT) {
	//     // attach the depth texture to the framebuffer
	//     gl.framebufferTexture2D(gl.FRAMEBUFFER,
	// 			    gl.DEPTH_ATTACHMENT,
	// 			    gl.TEXTURE_2D,
	// 			    self.texture,
	// 			    0);
	//     var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
	//     console.log('status: '+ status);
	// }
    };

    self.bind = function() {
        gl.bindTexture(options.target, self.texture);
    };

    self.activate = function() {
        gl.activeTexture(gl.TEXTURE0 + self.index);
    };

    self.reset = function() {
        self.activate();
        self.bind();
        gl.texImage2D(options.target, 0, options.internalFormat, width, height,
            0, options.format, options.type, data);
    };

    self.initialize();
}


export function GLBuffer(gl) {

    var self = this;

    self.initialize = function() {
        self.buffer = gl.createBuffer();
    };

    self.bind = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
    };

    self.set = function(data) {
        self.bind();
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };

    self.initialize();
};


export function Renderable(gl, program, buffers, primitiveCount) {

    var self = this;

    self.primitiveCount = primitiveCount;

    self.initialize = function() {
    };

    self.render = function() {
        program.use();
        for (name in buffers) {
            var buffer = buffers[name].buffer;
            var size = buffers[name].size;
            try {
                var location = program.attribs[name].location;
            } catch (e) {
                console.log("Could not find location for", name);
                throw e;
            }
            buffer.bind();
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3 * primitiveCount);
        for (name in self.buffers) {
            gl.disableVertexAttribArray(program.attributes[name].location);
        }
    };

    self.initialize();
};


export function InstancedRenderable(gl, program,
				    buffers, primitiveCount, instancedExt) {

    var self = this;

    self.initialize = function() {
    };

    self.render = function() {
        program.use();
        for (name in buffers) {
            var buffer = buffers[name].buffer;
            var size = buffers[name].size;
            try {
                var location = program.attribs[name].location;
            } catch (e) {
                console.log("Could not find location for", name);
                throw e;
            }
            buffer.bind();
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
            instancedExt.vertexAttribDivisorANGLE(location, buffers[name].divisor);
        }
        instancedExt.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6 * 2 * 3, primitiveCount);
        for (name in self.buffers) {
            gl.disableVertexAttribArray(program.attributes[name].location);
        }
    };

    self.initialize();
};


export function Program(gl, vertexSource, fragmentSource) {

    var self = this;

    self.initialize = function() {
        self.program = self.compileProgram(vertexSource, fragmentSource);
        self.attribs = self.gatherAttribs();
        self.uniforms = self.gatherUniforms();
    };

    self.use = function() {
        gl.useProgram(self.program);
    };

    self.compileProgram = function(vertexSource, fragmentSource) {
        var vertexShader = self.compileShader(vertexSource, gl.VERTEX_SHADER);
        var fragmentShader = self.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log(gl.getProgramInfoLog(program));
            throw "Failed to compile program.";
        }
        return program;
    };

    self.compileShader = function(source, type) {
        //console.warn("COMPILING: ", source);

        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var err = gl.getShaderInfoLog(shader);
            var lineno = parseInt(err.split(':')[2]);
            var split = source.split("\n");
            for (var i in split) {
                var q = parseInt(i);
                console.log(q + "  " + split[i]);
                if (i == lineno - 1) {
                    console.warn(err);
                }
            }
            var typeString = type == gl.VERTEX_SHADER ? "vertex" : "fragment";
            throw "Failed to compile " + typeString + " shader.";
        }
        return shader;
    };

    self.setUniform = function(name, type, value) {
        var args = Array.prototype.slice.call(arguments, 2);
        self.use(); // Make this idempotent. At the context level, perhaps?
        try {
            var location = self.uniforms[name].location;
        }
        catch (e) {
            console.log(name);
            throw e;
        }
        gl['uniform' + type].apply(gl, [location].concat(args));
    };

    self.gatherUniforms = function() {
        var uniforms = {};
        var nUniforms = gl.getProgramParameter(self.program, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < nUniforms; i++) {
            var uniform = gl.getActiveUniform(self.program, i);
            uniforms[uniform.name] = {
                name: uniform.name,
                location: gl.getUniformLocation(self.program, uniform.name),
                type: uniform.type,
                size: uniform.size
            };
        }
        return uniforms;
    };

    self.gatherAttribs = function() {
        var attribs = {};
        var nAttribs = gl.getProgramParameter(self.program, gl.ACTIVE_ATTRIBUTES);
        for (var i = 0; i < nAttribs; i++) {
            var attrib = gl.getActiveAttrib(self.program, i);
            attribs[attrib.name] = {
                name: attrib.name,
                location: gl.getAttribLocation(self.program, attrib.name),
                type: attrib.type,
                size: attrib.size
            };
        }
        return attribs;
    };

    self.initialize();
};
