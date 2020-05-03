import passthroughVertexShaderSource from './passthroughVS.glsl'
import backgroundFSSource from './backgroundFS.glsl'
import milkdropFragmentShaderSource from './milkdropFragmentShader.glsl'
import simpleMVPVertexShaderSource from './simpleProjModelVS.glsl'

export const passthroughVertexShader: VertexShader = {
	source: passthroughVertexShaderSource,
	type: 'vertex',
	variables: [
		{glslName: 'aVertexPosition', type: '4f'},
	]
}

export const backgroundFragmentShader: FragmentShader = {
	source: backgroundFSSource,
	type: 'fragment',
	variables: [
		{glslName: 'uResolution', type: '2f'},
		{glslName: 'uTime', type: '1f'},
		{glslName: 'uMouse', type: '2f'},
		{glslName: 'uZoom', type: '1f'},
		{glslName: 'uPan', type: '2f'},
	]
}

export const milkdropFragmentShader: FragmentShader = {
	source: milkdropFragmentShaderSource,
	type: 'fragment',
	variables: [
		{glslName: 'uTime', type: '1f'},
		{glslName: 'uMouse', type: '2f'},
	]
}

export {
	backgroundFSSource,
	passthroughVertexShaderSource,
	milkdropFragmentShaderSource,
	simpleMVPVertexShaderSource,
}

export interface Shader {
	readonly source: string
	readonly variables: readonly ShaderVariable[]
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

export interface ShaderVariable {
	readonly glslName: string
	readonly type: ShaderVariableType
}

export const shaderAttributeTypes = [
	'matrix2', 'matrix3', 'matrix4',
	'1f', '2f', '3f', '4f',
	'1fv', '2fv', '3fv', '4fv',
	'1i', '2i', '3i', '4i',
	'1iv', '2iv', '3iv', '4iv',
] as const

export type ShaderVariableType = typeof shaderAttributeTypes[number]