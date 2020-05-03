import React, {useRef, useEffect} from 'react'
import {hot} from 'react-hot-loader'
import {CorgiNumberChangedEvent} from '../../CorgiEvents'
import {useExpPosition} from '../../../react-hooks'
import {useNodeContext} from '../../CorgiNode'
import {logger} from '../../../client-logger'
import {passthroughVertexShaderSource, milkdropFragmentShaderSource, passthroughVertexShader, milkdropFragmentShader} from '../../../glsl/shaders'
import {Program, WebGlEngine} from '../../../webgl/WebGlEngine'
import {useStore} from 'react-redux'
import {selectExpPosition} from '@corgifm/common/redux'

interface Props {
	newSampleEvent: CorgiNumberChangedEvent
}

export const ExpMilkdropNodeExtra = hot(module)(React.memo(function _ExpMilkdropNodeExtra({
	newSampleEvent,
}: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const node = useNodeContext()
	const position = useExpPosition(node.id)
	const store = useStore()

	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		canvas.width = position.width + 2
		canvas.height = position.height + 2

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
			fragmentShader: milkdropFragmentShader,
		}

		const backgroundShaderProgram = engine.createShaderProgram(passthroughVertexShaderSource, milkdropFragmentShaderSource)

		if (!backgroundShaderProgram) return

		const programInfo = engine.createStandardProgramInfo(backgroundShaderProgram)

		const positionBuffer = engine.createPositionBuffer(program.vertexPositions)

		engine.initScene(programInfo, canvas)

		let stop = false

		requestAnimationFrame(mainLoop)

		function mainLoop(time: number) {
			if (stop || !canvasRef.current) return

			const positionLatest = selectExpPosition(store.getState().room, node.id)

			engine.drawScene(programInfo, canvasRef.current, positionLatest.width, positionLatest.height)

			requestAnimationFrame(mainLoop)
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
