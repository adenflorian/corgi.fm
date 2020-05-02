import React, {useRef, useEffect} from 'react'
import {hot} from 'react-hot-loader'
import {CorgiNumberChangedEvent} from '../../CorgiEvents'
import {useExpPosition} from '../../../react-hooks'
import {useNodeContext} from '../../CorgiNode'
import vsSource from '../../../glsl/simpleVertexShader.glsl'
import fsSource from '../../../glsl/simpleFragmentShader.glsl'
import * as webgl from '../../../webgl/webgl'

interface Props {
	newSampleEvent: CorgiNumberChangedEvent
}

export const ExpMilkdropNodeExtra = hot(module)(React.memo(function _ExpMilkdropNodeExtra({
	newSampleEvent,
}: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const node = useNodeContext()
	const position = useExpPosition(node.id)

	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		canvas.width = position.width + 2
		canvas.height = position.height + 2

		const glMaybe = canvas.getContext('webgl2', {
			premultipliedAlpha: false,
		})

		if (!glMaybe) return

		const gl = glMaybe

		let stop = false

		initGl(gl, canvas)

		function initGl(gl: WebGL2RenderingContext, canvasElement: HTMLCanvasElement) {

			const shaderProgram = webgl.initShaderProgram(
				gl,
				vsSource,
				fsSource,
			)

			if (!shaderProgram) return

			const programInfo = {
				program: shaderProgram,
				attribLocations: {
					vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				},
				uniformLocations: {
					projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
					modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
					time: gl.getUniformLocation(shaderProgram, 'uTime'),
					mouse: gl.getUniformLocation(shaderProgram, 'uMouse'),
				},
			}

			const buffers = webgl.initBuffers(gl)

			webgl.initScene(gl, programInfo, buffers, canvasElement)

			requestAnimationFrame(mainLoop)

			function mainLoop(time: number) {
				if (stop) return

				webgl.drawScene(gl, programInfo, buffers, canvasElement)

				requestAnimationFrame(mainLoop)
			}
		}

		return () => {
			stop = true
		}
	}, [])

	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				position: 'absolute',
				top: 0,
				left: 0,
				borderBottomLeftRadius: 8,
				borderBottomRightRadius: 8,
				overflow: 'hidden',
			}}
		>
			<canvas
				ref={canvasRef}
				style={{
					marginLeft: -1,
					marginTop: -1,
				}}
			/>
		</div>
	)
}))
