import atoms from './shaders/atoms.glsl';
import ellipsoids from './shaders/ellipsoids.glsl';
import bonds from './shaders/bonds.glsl';
import texturedquad from './shaders/textured-quad.glsl';
import accumulator from './shaders/accumulator.glsl';
import ao from './shaders/ao.glsl';
import fxaa from './shaders/fxaa.glsl';
import dof from './shaders/dof.glsl';

export var ShaderChunk = {
    atoms: atoms,
    ellipsoids: ellipsoids,
    bonds, bonds,
    texturedquad: texturedquad,
    accumulator: accumulator,
    ao: ao,
    fxaa: fxaa,
    dof: dof
};
