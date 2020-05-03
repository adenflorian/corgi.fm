// @ts-ignore
import * as mat4 from 'gl-matrix/esm/mat4'
import {logger} from '../client-logger'
import {VertexShader, FragmentShader} from '../glsl/shaders'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'

const start = Date.now() / 1000
function now() {
	return Date.now() / 1000
}
function current() {
	return now() - start
}

let mousePosition = {x: 0, y: 0}
window.addEventListener('mousemove', e => {
	mousePosition = {
		x: e.clientX,
		y: e.clientY,
	}
})

export class WebGlEngine {
	private readonly _gl: WebGLRenderingContext

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

		this._gl = context
	}

	public createShaderProgram(vsSource: string, fsSource: string) {
		const vertexShader = this._loadShader(this._gl.VERTEX_SHADER, vsSource)
		const fragmentShader = this._loadShader(this._gl.FRAGMENT_SHADER, fsSource)

		if (!vertexShader || !fragmentShader) {
			logger.error('shaderProgram null sad face: ' + JSON.stringify({vsSource, fsSource}))
			return null
		}

		// Create the shader program
		const shaderProgram = this._gl.createProgram()
		if (shaderProgram === null) {
			logger.error('shaderProgram null sad face: ' + JSON.stringify({vsSource, fsSource}))
			return null
		}

		this._gl.attachShader(shaderProgram, vertexShader)
		this._gl.attachShader(shaderProgram, fragmentShader)
		this._gl.linkProgram(shaderProgram)

		// If creating the shader program failed, alert
		if (!this._gl.getProgramParameter(shaderProgram, this._gl.LINK_STATUS)) {
			logger.error('Unable to initialize the shader program: ' + this._gl.getProgramInfoLog(shaderProgram))
			return null
		}

		return shaderProgram
	}

	private _loadShader(type: GLenum, source: string) {
		const shader = this._gl.createShader(type)
		if (shader === null) {
			logger.error('shader null sad face: ' + JSON.stringify({type, source}))
			return null
		}

		// Send the source to the shader object
		this._gl.shaderSource(shader, source)

		// Compile the shader program
		this._gl.compileShader(shader)

		// See if it compiled successfully
		if (!this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
			const info = this._gl.getShaderInfoLog(shader)
			this._gl.deleteShader(shader)
			logger.error('An error occurred compiling the shaders: ' + info)
			return null
		}

		return shader
	}

	public createStandardProgramInfo(shaderProgram: WebGLProgram) {
		return _createStandardProgramInfo(this._gl, shaderProgram)
	}

	public createPositionBuffer(positions: readonly number[]) {
		// Create a buffer for the square's positions.
		const positionBuffer = this._gl.createBuffer()

		// Select the positionBuffer as the one to apply buffer
		// operations to from here out.

		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, positionBuffer)

		// Now pass the list of positions into WebGL to build the
		// shape. We do this by creating a Float32Array from the
		// JavaScript array, then use it to fill the current buffer.
		this._gl.bufferData(this._gl.ARRAY_BUFFER,
			new Float32Array(positions),
			this._gl.STATIC_DRAW)

		return positionBuffer
	}

	public initScene(
		programInfo: ProgramInfo,
		canvasElement: HTMLCanvasElement,
	) {
		// gl.clearColor(...getColorForTime(Date.now() / 1000, 16))
		this._gl.clearColor(0.0, 0.0, 0.0, 0.0)
		// this._gl.clearColor(0.0, 0.0, 0.0, 1.0)  // Clear to black, fully opaque
		this._gl.clearDepth(1.0)                 // Clear everything
		this._gl.enable(this._gl.DEPTH_TEST)           // Enable depth testing
		this._gl.depthFunc(this._gl.LEQUAL)            // Near things obscure far things

		// Clear the canvas before we start drawing on it.

		this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT)

		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute.
		{
			const numComponents = 2  // pull out 2 values per iteration
			const type = this._gl.FLOAT    // the data in the buffer is 32bit floats
			const normalize = false  // don't normalize
			const stride = 0         // how many bytes to get from one set of values to the next
			// 0 = use type and numComponents above
			const offset = 0         // how many bytes inside the buffer to start from
			// already did this in initBuffers()
			// this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffers.position)
			this._gl.vertexAttribPointer(
				programInfo.attribLocations.vertexPosition,
				numComponents,
				type,
				normalize,
				stride,
				offset)
			this._gl.enableVertexAttribArray(
				programInfo.attribLocations.vertexPosition)
		}

		// Tell WebGL to use our program when drawing
		this._gl.useProgram(programInfo.program)

		this._updateProjectionMatrix(programInfo.uniformLocations.projectionMatrix, canvasElement)

		this._updateModelMatrix(programInfo.uniformLocations.modelViewMatrix, canvasElement)
	}

	private _updateProjectionMatrix(projectionMatrixLocation: WebGLUniformLocation | null, canvasElement: HTMLCanvasElement) {
		if (!projectionMatrixLocation) return
		// Create a perspective matrix, a special matrix that is
		// used to simulate the distortion of perspective in a camera.
		// Our field of view is 45 degrees, with a width/height
		// ratio that matches the display size of the canvas
		// and we only want to see objects between 0.1 units
		// and 100 units away from the camera.

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

		this._gl.uniformMatrix4fv(
			projectionMatrixLocation,
			false,
			projectionMatrix)
	}

	private _updateModelMatrix(modelMatrixLocation: WebGLUniformLocation | null, canvasElement: HTMLCanvasElement) {
		if (!modelMatrixLocation) return
		// Set the drawing position to the "identity" point, which is
		// the center of the scene.
		const modelViewMatrix = mat4.create()

		// Now move the drawing position a bit to where we want to
		// start drawing the square.

		mat4.translate(modelViewMatrix,     // destination matrix
			modelViewMatrix,     // matrix to translate
			[-0.0, 0.0, -3.0])  // amount to translate

		this._gl.uniformMatrix4fv(
			modelMatrixLocation,
			false,
			modelViewMatrix)
	}

	public drawScene(
		programInfo: ProgramInfo,
		canvasElement: HTMLCanvasElement,
		width: number,
		height: number,
	) {
		this._resize(canvasElement, width, height)

		// updateProjectionMatrix(this._gl, programInfo.uniformLocations.projectionMatrix, canvasElement)

		// updateModelMatrix(this._gl, programInfo.uniformLocations.projectionMatrix, canvasElement)

		this._gl.uniform2f(
			programInfo.uniformLocations.resolution,
			canvasElement.clientWidth, canvasElement.clientHeight)
		this._gl.uniform1f(
			programInfo.uniformLocations.time,
			current())
		this._gl.uniform2f(
			programInfo.uniformLocations.mouse,
			mousePosition.x, mousePosition.y)
		this._gl.uniform1f(
			programInfo.uniformLocations.zoom,
			simpleGlobalClientState.zoom)
		this._gl.uniform2f(
			programInfo.uniformLocations.pan,
			simpleGlobalClientState.pan.x, simpleGlobalClientState.pan.y)

		{
			const offset = 0
			const vertexCount = programInfo.vertexCount
			this._gl.drawArrays(this._gl.TRIANGLE_STRIP, offset, vertexCount)
		}
	}

	private _resize(canvas: HTMLCanvasElement, width: number, height: number) {
		// Check if the canvas is not the same size.
		if (canvas.width != width ||
			canvas.height != height) {

			// Make the canvas the same size
			canvas.width = width;
			canvas.height = height;

			this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height)
		}
	}
}

export interface Program {
	readonly vertexPositions: number[]
	readonly vertexShader: VertexShader
	readonly fragmentShader: FragmentShader
}

function _createStandardProgramInfo(gl: WebGLRenderingContext, shaderProgram: WebGLProgram) {
	return {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
			resolution: gl.getUniformLocation(shaderProgram, 'uResolution'),
			time: gl.getUniformLocation(shaderProgram, 'uTime'),
			mouse: gl.getUniformLocation(shaderProgram, 'uMouse'),
			zoom: gl.getUniformLocation(shaderProgram, 'uZoom'),
			pan: gl.getUniformLocation(shaderProgram, 'uPan'),
		},
		vertexCount: 4,
	}
}

export interface ProgramInfo extends ReturnType<typeof _createStandardProgramInfo> {}
