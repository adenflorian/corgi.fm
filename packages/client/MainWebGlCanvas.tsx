import React, {useRef, useEffect} from 'react'
import {hot} from 'react-hot-loader'
import * as webgl from './webgl/webgl'
import vsSource from './glsl/passthroughVS.glsl'
import backgroundFS from './glsl/backgroundFS.glsl'
import {logger} from './client-logger'

export const MainWebGlCanvas = hot(module)(React.memo(function _MainWebGlCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		const glMaybe = canvas.getContext('webgl', {
			premultipliedAlpha: false,
		})

		if (!glMaybe) return

		const gl = glMaybe

		let stop = false

		initGl(gl, canvas)

		function initGl(gl: WebGLRenderingContext, canvasElement: HTMLCanvasElement) {

			const shaderProgram = webgl.initShaderProgram(
				gl,
				vsSource,
				backgroundFS,
			)

			if (!shaderProgram) return

			const programInfo = webgl.createStandardProgramInfo(gl, shaderProgram)

			const buffers = webgl.initBuffers(gl)

			webgl.initScene(gl, programInfo, buffers, canvasElement)

			requestAnimationFrame(mainLoop)

			function mainLoop(time: number) {
				if (stop || !canvasRef.current) return

				webgl.drawScene(gl, programInfo, buffers, canvasRef.current)

				requestAnimationFrame(mainLoop)
			}
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
