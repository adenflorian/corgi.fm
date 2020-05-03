import React, {useRef, useEffect} from 'react'
import {hot} from 'react-hot-loader'
import {WebGlEngine, Program} from './webgl/WebGlEngine'
import {logger} from './client-logger'
import {passthroughVertexShaderSource, backgroundFSSource, backgroundFragmentShader, passthroughVertexShader} from './glsl/shaders'

export const MainWebGlCanvas = hot(module)(React.memo(function _MainWebGlCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		let engine: WebGlEngine

		try {
			engine = new WebGlEngine(canvas)
		} catch (error) {
			return logger.error(`[MainWebGlCanvas] ${error}`)
		}

		const program: Program = {
			vertexPositions: [
				-1.0, 1.0,
				1.0, 1.0,
				-1.0, -1.0,
				1.0, -1.0,
			],
			vertexShader: passthroughVertexShader,
			fragmentShader: backgroundFragmentShader,
		}

		const backgroundShaderProgram = engine.createShaderProgram(passthroughVertexShaderSource, backgroundFSSource)

		if (!backgroundShaderProgram) return
	
		const programInfo = engine.createStandardProgramInfo(backgroundShaderProgram)

		const positionBuffer = engine.createPositionBuffer(program.vertexPositions)

		engine.initScene(programInfo, canvas)

		let stop = false

		requestAnimationFrame(mainLoop)

		function mainLoop(time: number) {
			if (stop || !canvasRef.current) return

			engine.drawScene(programInfo, canvasRef.current, canvasRef.current.clientWidth, canvasRef.current.clientHeight)

			requestAnimationFrame(mainLoop)
		}

		return () => {
			stop = true
		}
	}, [])

	return (
		<div
			className="mainWebGlCanvas"
			style={{
				width: '100vw',
				height: '100vh',
				position: 'fixed',
				top: 0,
				left: 0,
			}}
		>
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
				}}
			/>
		</div>
	)
}))
