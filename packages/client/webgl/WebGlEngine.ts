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

		if (!context) {
			throw new Error(`could not create a ${contextName} context`)
		}

		this.gl = context

		// TODO Will probably need to be done every frame
		// gl.clearColor(...getColorForTime(Date.now() / 1000, 16))
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
		// this._gl.clearColor(0.0, 0.0, 0.0, 1.0)  // Clear to black, fully opaque
		this.gl.clearDepth(1.0)                 // Clear everything
		this.gl.enable(this.gl.DEPTH_TEST)           // Enable depth testing
		this.gl.depthFunc(this.gl.LEQUAL)            // Near things obscure far things

		// Clear the canvas before we start drawing on it.
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
	}

	public createShaderProgram(vsSource: string, fsSource: string) {
		const vertexShader = this._loadShader(this.gl.VERTEX_SHADER, vsSource)
		const fragmentShader = this._loadShader(this.gl.FRAGMENT_SHADER, fsSource)

		if (!vertexShader || !fragmentShader) {
			logger.error('shaderProgram null sad face: ' + JSON.stringify({vsSource, fsSource}))
			return null
		}

		// Create the shader program
		const shaderProgram = this.gl.createProgram()
		if (shaderProgram === null) {
			logger.error('shaderProgram null sad face: ' + JSON.stringify({vsSource, fsSource}))
			return null
		}

		this.gl.attachShader(shaderProgram, vertexShader)
		this.gl.attachShader(shaderProgram, fragmentShader)
		this.gl.linkProgram(shaderProgram)

		// If creating the shader program failed, alert
		if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
			logger.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram))
			return null
		}

		return shaderProgram
	}

	public createPass(objectInfo: ObjectInfo): RenderPass | null {
		const shaderProgram = this.createShaderProgram(objectInfo.vertexShader.source, objectInfo.fragmentShader.source)

		if (!shaderProgram) return null

		const uniformLocations = objectInfo.vertexShader.uniforms
			.merge(objectInfo.fragmentShader.uniforms)
			.map((type, key) => ({location: this.gl.getUniformLocation(shaderProgram, key), type}))
			.filter(x => x !== null)

		const positionBuffer = this.createPositionBuffer(objectInfo.vertexPositions)

		if (!positionBuffer) return null

		return {
			shaderProgram,
			positionBuffer,
			vertexPositionAttributeLocation: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
			uniformLocations,
			objectInfo,
		}
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

	public createPositionBuffer(positions: readonly number[]) {
		// Create a buffer for the square's positions.
		const positionBuffer = this.gl.createBuffer()

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

	public drawScene(
		renderPass: RenderPass,
		canvasElement: HTMLCanvasElement,
		width: number,
		height: number,
	) {
		this._resize(canvasElement, width, height)

		// Tell WebGL to use our program when drawing
		this.gl.useProgram(renderPass.shaderProgram)

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderPass.positionBuffer)

		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute.
		{
			const numComponents = 2  // pull out 2 values per iteration
			const type = this.gl.FLOAT    // the data in the buffer is 32bit floats
			const normalize = false  // don't normalize
			const stride = 0         // how many bytes to get from one set of values to the next
			// 0 = use type and numComponents above
			const offset = 0         // how many bytes inside the buffer to start from
			// already did this in initBuffers()
			// this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffers.position)
			this.gl.vertexAttribPointer(
				renderPass.vertexPositionAttributeLocation,
				numComponents,
				type,
				normalize,
				stride,
				offset)
			this.gl.enableVertexAttribArray(
				renderPass.vertexPositionAttributeLocation)
		}

		renderPass.objectInfo.uniformValues.forEach((x, key) => {
			const location = renderPass.uniformLocations.get(key, null)
			if (!location) return
			x(location.location)
		})

		{
			const offset = 0
			const vertexCount = renderPass.objectInfo.vertexCount
			this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount)
		}
	}

	private _resize(canvas: HTMLCanvasElement, width: number, height: number) {
		// Check if the canvas is not the same size.
		if (canvas.width != width ||
			canvas.height != height) {

			// Make the canvas the same size
			canvas.width = width;
			canvas.height = height;

			this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
		}
	}
}

export interface ObjectInfo {
	readonly vertexPositions: number[]
	readonly vertexCount: number
	readonly vertexShader: VertexShader
	readonly fragmentShader: FragmentShader
	readonly uniformValues: ProgramUniformValues
}

export interface ProgramUniformValues extends Immutable.Map<string, UniformUpdater> {}

export type UniformUpdater = (location: WebGLUniformLocation | null) => void

export function createProjectionMatrix(canvasElement: HTMLCanvasElement) {
	// Create a perspective matrix, a special matrix that is
	// used to simulate the distortion of perspective in a camera.
	// Our field of view is 45 degrees, with a width/height
	// ratio that matches the display size of the canvas
	// and we only want to see objects between 0.1 units
	// and 100 units away from the camera.

	// TODO Look into web SIMD

	const fieldOfView = 45 * Math.PI / 180   // in radians
	const aspect = canvasElement.clientWidth / canvasElement.clientHeight
	const zNear = 0.1
	const zFar = 100.0
	const projectionMatrix = mat4.create()

	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	mat4.perspective(projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar)

	return projectionMatrix
}

export function createModelViewMatrix() {
	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = mat4.create()

	// TODO Look into web SIMD

	// Now move the drawing position a bit to where we want to
	// start drawing the square.

	mat4.translate(modelViewMatrix,     // destination matrix
		modelViewMatrix,     // matrix to translate
		[-0.0, 0.0, -3.0])  // amount to translate

	return modelViewMatrix
}
