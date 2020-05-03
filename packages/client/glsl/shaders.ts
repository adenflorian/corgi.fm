import * as Immutable from 'immutable'
import passthroughVertexShaderSource from './passthroughVS.glsl'
import backgroundFSSource from './backgroundFS.glsl'
import milkdropFragmentShaderSource from './milkdropFragmentShader.glsl'
import simpleMVPVertexShaderSource from './simpleProjModelVS.glsl'
import nodeFragmentShaderSource from './nodeFS.glsl'

export const passthroughVertexShader: VertexShader = {
	source: passthroughVertexShaderSource,
	type: 'vertex',
	uniforms: Immutable.Map({}),
}

export const modelViewProjectionVertexShader: VertexShader = {
	source: simpleMVPVertexShaderSource,
	type: 'vertex',
	uniforms: Immutable.Map({
		uModelViewMatrix: 'matrix4',
		uProjectionMatrix: 'matrix4',
	}),
}

export const backgroundFragmentShader: FragmentShader = {
	source: backgroundFSSource,
	type: 'fragment',
	uniforms: Immutable.Map({
		uResolution: '2f',
		uTime: '1f',
		uMouse: '2f',
		uZoom: '1f',
		uPan: '2f',
	}),
}

export const nodeFragmentShader: FragmentShader = {
	source: nodeFragmentShaderSource,
	type: 'fragment',
	uniforms: Immutable.Map({
		uResolution: '2f',
		uTime: '1f',
		uMouse: '2f',
		uZoom: '1f',
		uPan: '2f',
	}),
}

export const milkdropFragmentShader: FragmentShader = {
	source: milkdropFragmentShaderSource,
	type: 'fragment',
	uniforms: Immutable.Map({
		uTime: '1f',
		uMouse: '2f',
	}),
}

export {
	backgroundFSSource,
	passthroughVertexShaderSource,
	milkdropFragmentShaderSource,
	simpleMVPVertexShaderSource,
}

export interface Shader {
	readonly source: string
	readonly uniforms: ShaderUniforms
	readonly type: ShaderType
}

export interface VertexShader extends Shader {
	readonly type: 'vertex'
}

export interface FragmentShader extends Shader {
	readonly type: 'fragment'
}

export const shaderTypes = ['vertex', 'fragment'] as const

export type ShaderType = typeof shaderTypes[number]

export interface ShaderUniforms extends Immutable.Map<string, ShaderUniformType> {}

export const shaderUniformTypes = [
	'matrix2', 'matrix3', 'matrix4',
	'1f', '2f', '3f', '4f',
	'1fv', '2fv', '3fv', '4fv',
	'1i', '2i', '3i', '4i',
	'1iv', '2iv', '3iv', '4iv',
] as const

export type ShaderUniformType = typeof shaderUniformTypes[number]
