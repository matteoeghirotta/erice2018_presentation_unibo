#version 300 es
precision lowp float;

in vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1);
}


// __split__#version 300 es
precision lowp float;

uniform sampler2D uTexture;
uniform float uRes;

out vec4 color;

void main() {
    color = texture(uTexture, gl_FragCoord.xy/uRes);
}
