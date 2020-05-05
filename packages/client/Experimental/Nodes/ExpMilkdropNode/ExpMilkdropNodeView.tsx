import React, {useRef, useEffect} from 'react'
import {hot} from 'react-hot-loader'
import * as Immutable from 'immutable'
import {CorgiNumberChangedEvent} from '../../CorgiEvents'
import {useExpPosition} from '../../../react-hooks'
import {useNodeContext} from '../../CorgiNode'
import {logger} from '../../../client-logger'
import {passthroughVertexShader, milkdropFragmentShader} from '../../../glsl/shaders'
import {ObjectInfo, WebGlEngine, UniformUpdater, getVerticesForRect} from '../../../webgl/WebGlEngine'
import {useStore} from 'react-redux'
import {selectExpPosition} from '@corgifm/common/redux'
import {simpleGlobalClientState} from '../../../SimpleGlobalClientState'

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

		const {gl} = engine

		const vertexPositions = [
			...getVerticesForRect({x: -1, y: 1}, 2, 2),
		]

		const program: ObjectInfo = {
			vertexPositions,
			vertexCount: vertexPositions.length / 2,
			vertexShader: passthroughVertexShader,
			fragmentShader: milkdropFragmentShader,
			uniformValues: Immutable.Map<UniformUpdater>({
				uMouse: location => gl.uniform2f(location,
					simpleGlobalClientState.lastMousePosition.x, simpleGlobalClientState.lastMousePosition.y),
				uTime: location => gl.uniform1f(location,
					engine.current()),
			}),
		}

		const renderPass = engine.createPass(program)

		if (!renderPass) return

		let stop = false

		requestAnimationFrame(mainLoop)

		function mainLoop(time: number) {
			if (stop || !canvasRef.current || !renderPass) return

			const positionLatest = selectExpPosition(store.getState().room, node.id)

			engine.newFramePass(canvasRef.current, positionLatest.width, positionLatest.height)

			engine.drawPass(renderPass)

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
