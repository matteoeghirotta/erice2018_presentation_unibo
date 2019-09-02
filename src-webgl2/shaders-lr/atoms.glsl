#version 300 es
precision lowp float;

in vec3 aImposter;
in vec3 aPosition;
in float aRadius;
in vec3 aColor;

uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uModel;
uniform float uAtomScale;
uniform float uRelativeAtomScale;
uniform float uAtomShade;

out vec3 vColor;
out vec3 vPosition;
out float vRadius;

void main() {
    vRadius = uAtomScale * (1.0 + (aRadius - 1.0) * uRelativeAtomScale);
    gl_Position = uProjection * uView * uModel * vec4(vRadius * aImposter
						      + aPosition, 1.0);
    vColor = mix(aColor, vec3(1,1,1), uAtomShade);
    vPosition = vec3(uModel * vec4(aPosition, 1));
}

// __split__#version 300 es
precision lowp float;

uniform vec2 uBottomLeft;
uniform vec2 uTopRight;
uniform float uRes;
uniform float uDepth;
uniform int uMode;

in vec3 vPosition;
in float vRadius;
in vec3 vColor;

out vec4 color;

float raySphereIntersect(vec3 r0, vec3 rd) {
    float a = dot(rd, rd);
    vec3 s0_r0 = r0 - vPosition;
    float b = 2.0 * dot(rd, s0_r0);
    float c = dot(s0_r0, s0_r0) - (vRadius * vRadius);
    float disc = b*b - 4.0*a*c;
    if (disc <= 0.0) {
        return -1.0;
    }
    return (-b -sqrt(disc))/(2.0*a);
}

void main() {
    vec2 res = vec2(uRes, uRes);

    vec3 r0 = vec3(uBottomLeft + (gl_FragCoord.xy/res) * (uTopRight - uBottomLeft),
		   0.0);
    vec3 rd = vec3(0, 0, -1);
    float t = raySphereIntersect(r0, rd);
    if (t < 0.0) {
        discard;
    }
    vec3 coord = r0 + rd * t;
    vec3 normal = normalize(coord - vPosition);
    if (uMode == 0) {
      color = vec4(vColor, 1);
    } else if (uMode == 1) {
      color = vec4(normal * 0.5 + 0.5, 1);
    }

// ad-hoc rule for ellipsoid
    // if (abs(vRadius-5.0) < 0.1) {
    //     color.a = 0.75;
    // }
    
    gl_FragDepth = -coord.z/uDepth;
}
