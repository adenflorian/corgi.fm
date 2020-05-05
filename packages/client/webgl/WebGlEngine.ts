// @ts-ignore
import * as mat4 from 'gl-matrix/esm/mat4'
import * as Immutable from 'immutable'
import {logger} from '../client-logger'
import {VertexShader, FragmentShader, ShaderUniformType} from '../glsl/shaders'

export interface RenderPass {
	readonly shaderProgram: WebGLProgram
	readonly positionBuffer: WebGLBuffer
	readonly vertexPositionAttributeLocation: GLint
	readonly uniformLocations: Immutable.Map<string, {location: WebGLUniformLocation | null, type: ShaderUniformType}>
	readonly objectInfo: ObjectInfo
}

export class WebGlEngine {
	public readonly gl: WebGLRenderingContext
	public readonly _startTimeSeconds = Date.now() / 1000
	public current() {return (Date.now() / 1000) - this._startTimeSeconds}

	public constructor(
		private readonly _canvas: HTMLCanvasElement,
	) {
		const contextName = 'webgl'
		const context = this._canvas.getContext(contextName, {
			premultipliedAlpha: false,
		})

		if (!context) throw new Error(`could not create a ${contextName} context`)

		this.gl = context

		this.gl.clearColor(0.0, 0.0, 0.0, 1.0)  // Clear to black, fully opaque
		this.gl.clearDepth(1.0)                 // Clear everything
		this.gl.enable(this.gl.DEPTH_TEST)      // Enable depth testing
		this.gl.depthFunc(this.gl.LEQUAL)       // Near things obscure far things

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
	}

	public createPass(objectInfo: ObjectInfo): RenderPass | null {
		const shaderProgram = this._createShaderProgram(objectInfo.vertexShader.source, objectInfo.fragmentShader.source)
		const positionBuffer = this._createPositionBuffer(objectInfo.vertexPositions)

		if (!shaderProgram || !positionBuffer) return null

		const uniformLocations = objectInfo.vertexShader.uniforms
			.merge(objectInfo.fragmentShader.uniforms)
			.map((type, key) => ({location: this.gl.getUniformLocation(shaderProgram, key), type}))
			.filter(x => x !== null)

		return {
			shaderProgram,
			positionBuffer,
			vertexPositionAttributeLocation: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
			uniformLocations,
			objectInfo,
		}
	}

	private _createShaderProgram(vsSource: string, fsSource: string) {
		const vertexShader = this._loadShader(this.gl.VERTEX_SHADER, vsSource)
		const fragmentShader = this._loadShader(this.gl.FRAGMENT_SHADER, fsSource)
		const shaderProgram = this.gl.createProgram()

		if (!vertexShader || !fragmentShader || !shaderProgram) {
			logger.error('[createShaderProgram] something is null sad face: '
				+ JSON.stringify({vsSource, fsSource, vertexShader, fragmentShader, shaderProgram}))
			return null
		}

		this.gl.attachShader(shaderProgram, vertexShader)
		this.gl.attachShader(shaderProgram, fragmentShader)
		this.gl.linkProgram(shaderProgram)

		// Check if creating the shader program failed
		if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
			logger.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram))
			return null
		}

		return shaderProgram
	}

	private _loadShader(type: GLenum, source: string) {
		const shader = this.gl.createShader(type)
		if (shader === null) {
			logger.error('shader null sad face: ' + JSON.stringify({type, source}))
			return null
		}

		// Send the source to the shader object
		this.gl.shaderSource(shader, source)

		// Compile the shader program
		this.gl.compileShader(shader)

		// See if it compiled successfully
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			const info = this.gl.getShaderInfoLog(shader)
			this.gl.deleteShader(shader)
			logger.error('An error occurred compiling the shaders: ' + info)
			return null
		}

		return shader
	}

	private _createPositionBuffer(positions: readonly number[]) {
		// Create a buffer for the square's positions.
		const positionBuffer = this.gl.createBuffer()

		if (!positionBuffer) {
			logger.error('positionBuffer is null :(', {positionBuffer})
			return null
		}

		// Select the positionBuffer as the one to apply buffer
		// operations to from here out.
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)

		// Now pass the list of positions into WebGL to build the
		// shape. We do this by creating a Float32Array from the
		// JavaScript array, then use it to fill the current buffer.
		this.gl.bufferData(this.gl.ARRAY_BUFFER,
			new Float32Array(positions),
			this.gl.STATIC_DRAW)

		return positionBuffer
	}

	public newFramePass(canvasElement: HTMLCanvasElement, width: number, height: number) {
		this._updateCanvasSize(canvasElement, width, height)
		this.gl.clearDepth(1.0)
	}

	private _updateCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
		if (canvas.width !== width || canvas.height !== height) {

			canvas.width = width;
			canvas.height = height;

			this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
		}
	}

	public drawPass(renderPass: RenderPass) {
		this._setDepthBufferEnabled(renderPass.objectInfo.writeToDepthBuffer)

		this.gl.useProgram(renderPass.shaderProgram)

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderPass.positionBuffer)

		this._setupVertexAttribStuff(renderPass)

		this._updateUniforms(renderPass)

		this.gl.drawArrays(this.gl.TRIANGLES, 0, renderPass.objectInfo.vertexCount)
	}

	private _setDepthBufferEnabled(enabled = true) {
		if (enabled) {
			this.gl.enable(this.gl.DEPTH_TEST)
		} else {
			this.gl.disable(this.gl.DEPTH_TEST)
		}
	}

	private _setupVertexAttribStuff(renderPass: RenderPass) {
		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute.
		this.gl.vertexAttribPointer(
			renderPass.vertexPositionAttributeLocation,
			2,				// numComponents
			this.gl.FLOAT,	// the data in the buffer is 32bit floats
			false,			// don't normalize
			0,				// stride - how many bytes to get from one set of values to the next
			0)				// offset - how many bytes inside the buffer to start from

		this.gl.enableVertexAttribArray(renderPass.vertexPositionAttributeLocation)
	}

	private _updateUniforms(renderPass: RenderPass) {
		renderPass.objectInfo.uniformValues.forEach((x, key) => {
			x(renderPass.uniformLocations.get(key, null)!.location)
		})
	}
}

export interface ObjectInfo {
	readonly vertexPositions: number[]
	readonly vertexCount: number
	readonly vertexShader: VertexShader
	readonly fragmentShader: FragmentShader
	readonly uniformValues: ProgramUniformValues
	readonly writeToDepthBuffer?: boolean
}

export interface ProgramUniformValues extends Immutable.Map<string, UniformUpdater> {}

export type UniformUpdater = (location: WebGLUniformLocation | null) => void

const fieldOfView = 45 * Math.PI / 180   // in radians
const zNear = 0.1
const zFar = 100.0

export function createPerspectiveProjectionMatrix(canvasElement: HTMLCanvasElement) {
	// Create a perspective matrix, a special matrix that is
	// used to simulate the distortion of perspective in a camera.
	// Our field of view is 45 degrees, with a width/height
	// ratio that matches the display size of the canvas
	// and we only want to see objects between 0.1 units
	// and 100 units away from the camera.

	// TODO Look into web SIMD

	const aspect = canvasElement.clientWidth / canvasElement.clientHeight
	const projectionMatrix = mat4.create()

	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.perspective(
		projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar)

	return projectionMatrix
}

export function createOrthographicProjectionMatrix(canvasElement: HTMLCanvasElement, size: number) {
	// TODO Look into web SIMD

	const halfCanvasWidth = canvasElement.clientWidth / 2
	const halfCanvasHeight = canvasElement.clientHeight / 2
	const projectionMatrix = mat4.create()

	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.ortho(
		projectionMatrix,
		-halfCanvasWidth * size,	// left
		halfCanvasWidth * size,		// right
		halfCanvasHeight * size,	// bottom
		-halfCanvasHeight * size,	// top
		zNear,						// near
		zFar)						// far

	return projectionMatrix
}

export function createModelViewMatrix(x: number, y: number, z: number) {
	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = mat4.create()

	// TODO Look into web SIMD

	// Now move the drawing position a bit to where we want to
	// start drawing the square.
	mat4.translate(
		modelViewMatrix,	// destination matrix
		modelViewMatrix,	// matrix to translate
		[x, y, z])			// amount to translate

	return modelViewMatrix
}

export function getVerticesForRect(position: Point, width: number, height: number): readonly number[] {
	return [
		position.x, position.y,
		position.x + width, position.y,
		position.x, position.y - height,

		position.x + width, position.y,
		position.x, position.y - height,
		position.x + width, position.y - height,
	]
}
