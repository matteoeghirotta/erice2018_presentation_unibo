#version 300 es
precision lowp float;

in vec3 aImposter;
in vec3 aPosition;
in vec4 aQuaternion;
in vec3 aRadius;
in vec3 aColor;
in vec4 a_abcd;
in vec4 a_efgh;
in vec2 a_ij;

uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uModel;
uniform float uAtomScale;
uniform float uRelativeAtomScale;
uniform float uAtomShade;

out vec3 vColor;
out vec3 vPosition;
out vec4 vQuaternion;
out vec3 vRadius;
out vec4 v_abcd;
out vec4 v_efgh;
out vec2 v_ij;

void main() {
    vRadius = uAtomScale * (1.0 + (aRadius - 1.0) * uRelativeAtomScale);
    gl_Position = uProjection * uView * uModel * vec4(vRadius * aImposter + aPosition, 1.0);
    vColor = mix(aColor, vec3(1, 1, 1), uAtomShade);
    vPosition = vec3(uModel * vec4(aPosition, 1));
    vQuaternion = aQuaternion;
    v_abcd = a_abcd;
    v_efgh = a_efgh;
    v_ij = a_ij;
}

// __split__#version 300 es
precision lowp float;

uniform vec2 uBottomLeft;
uniform vec2 uTopRight;
uniform float uRes;
uniform float uDepth;
uniform int uMode;

in vec3 vPosition;
in vec4 vQuaternion;
in vec3 vRadius;
in vec3 vColor;
in vec4 v_abcd;
in vec4 v_efgh;
in vec2 v_ij;

out vec4 color;

float rayQuadricIntersect(vec3 r0, vec3 rd) {
    // VNorm(&rd);

    vec3 ro = r0 - vPosition;

    float aq = (v_abcd[0] * (rd.x * rd.x)) +
        (2.0 * v_abcd[1] * rd.x * rd.y) +
        (2.0 * v_abcd[2] * rd.x * rd.z) +
        (v_efgh[0] * (rd.y * rd.y)) +
        (2.0 * v_efgh[1] * rd.y * rd.z) +
        (v_efgh[3] * (rd.z * rd.z));

    float bq = 2.0 * (
        (v_abcd[0] * ro.x * rd.x) +
        (v_abcd[1] * ((ro.x * rd.y) + (rd.x * ro.y))) +
        (v_abcd[2] * ((ro.x * rd.z) + (rd.x * ro.z))) +
        (v_abcd[3] * rd.x) +
        (v_efgh[0] * ro.y * rd.y) +
        (v_efgh[1] * ((ro.y * rd.z) + (rd.y * ro.z))) +
        (v_efgh[2] * rd.y) +
        (v_efgh[3] * ro.z * rd.z) +
        (v_ij[0] * rd.z)
    );

    float cq = (v_abcd[0] * (ro.x * ro.x)) +
        (2.0 * v_abcd[1] * ro.x * ro.y) +
        (2.0 * v_abcd[2] * ro.x * ro.z) +
        (2.0 * v_abcd[3] * ro.x) +
        (v_efgh[0] * (ro.y * ro.y)) +
        (2.0 * v_efgh[1] * ro.y * ro.z) +
        (2.0 * v_efgh[2] * ro.y) +
        (v_efgh[3] * (ro.z * ro.z)) +
        (2.0 * v_ij[0] * ro.z) +
        v_ij[1];

    if (aq == 0.0) {
        return - cq / bq;
    } else {
        float disc = (bq * bq - 4.0 * aq * cq);
        if (disc > 0.0) {
            disc = sqrt(disc);
            // t1 = (-bq + disc) / (2.0 * aq);
            return (-bq - disc) / (2.0 * aq);
        } else {
            return -1.0;
        }
    }
}

void main() {
    vec2 res = vec2(uRes, uRes);

    vec3 r0 = vec3(uBottomLeft + (gl_FragCoord.xy / res) * (uTopRight - uBottomLeft),
        0.0);
    vec3 rd = vec3(0, 0, -1);

    float t = rayQuadricIntersect(r0, rd);
    if (t < 0.0) {
        discard;
    }
    vec3 coord = r0 + rd * t;
    vec3 normal = normalize(coord - vPosition);
    if (uMode == 0) {
        color = vec4(vColor, 0.75);
    } else if (uMode == 1) {
        color = vec4(normal * 0.5 + 0.5, 0.75);
    }
    gl_FragDepth = -coord.z / uDepth;
}
