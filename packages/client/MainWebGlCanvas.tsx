import React, {useRef, useEffect} from 'react'
import * as Immutable from 'immutable'
import {hot} from 'react-hot-loader'
import {WebGlEngine, ObjectInfo,
	createModelViewMatrix, UniformUpdater, createOrthographicProjectionMatrix, getVerticesForRect} from './webgl/WebGlEngine'
import {logger} from './client-logger'
import {backgroundFragmentShader, passthroughVertexShader,
	nodeFragmentShader, modelViewProjectionVertexShader} from './glsl/shaders'
import {simpleGlobalClientState} from './SimpleGlobalClientState'
import {selectExpNodesState, selectLocalClientId, selectRoomMember, selectExpPosition, IClientAppState} from '@corgifm/common/redux'
import {useStore} from 'react-redux'
import {RoomType} from '@corgifm/common/common-types'

export const MainWebGlCanvas = hot(module)(React.memo(function _MainWebGlCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const store = useStore<IClientAppState>()

	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		let engine: WebGlEngine

		try {
			engine = new WebGlEngine(canvas)
		} catch (error) {
			return logger.error(`[MainWebGlCanvas] ${error}`)
		}

		const {gl} = engine

		const backgroundVertexPositions = [
			...getVerticesForRect({x: -1, y: 1}, 2, 2),
		]

		const backgroundObjectInfo: ObjectInfo = {
			vertexPositions: backgroundVertexPositions,
			vertexCount: backgroundVertexPositions.length / 2,
			vertexShader: passthroughVertexShader,
			fragmentShader: backgroundFragmentShader,
			uniformValues: Immutable.Map<UniformUpdater>({
				uMouse: location => gl.uniform2f(location,
					simpleGlobalClientState.lastMousePosition.x, simpleGlobalClientState.lastMousePosition.y),
				uTime: location => gl.uniform1f(location,
					engine.current()),
				uZoom: location => gl.uniform1f(location,
					simpleGlobalClientState.zoom),
				uPan: location => gl.uniform2f(location,
					simpleGlobalClientState.pan.x, simpleGlobalClientState.pan.y),
				uResolution: location => gl.uniform2f(location,
					canvasRef.current ? canvasRef.current.clientWidth : 100,
					canvasRef.current ? canvasRef.current.clientHeight : 100),
			}),
			writeToDepthBuffer: false,
		}

		const backgroundRenderPass = engine.createPass(backgroundObjectInfo)

		if (!backgroundRenderPass) return

		const nodesVertexPositions = [
			...getVerticesForRect({x: -1, y: 1}, 2, 2),
			...getVerticesForRect({x: -3, y: -6}, 2, 2),
		]

		const nodesObjectInfo: ObjectInfo = {
			vertexPositions: nodesVertexPositions,
			vertexCount: nodesVertexPositions.length / 2,
			vertexShader: modelViewProjectionVertexShader,
			fragmentShader: nodeFragmentShader,
			uniformValues: Immutable.Map<UniformUpdater>({
				uMouse: location => gl.uniform2f(location,
					simpleGlobalClientState.lastMousePosition.x, simpleGlobalClientState.lastMousePosition.y),
				uTime: location => gl.uniform1f(location,
					engine.current()),
				uZoom: location => gl.uniform1f(location,
					simpleGlobalClientState.zoom),
				uPan: location => gl.uniform2f(location,
					simpleGlobalClientState.pan.x, simpleGlobalClientState.pan.y),
				uResolution: location => gl.uniform2f(location,
					canvasRef.current ? canvasRef.current.clientWidth : 100,
					canvasRef.current ? canvasRef.current.clientHeight : 100),
				uProjectionMatrix: location => gl.uniformMatrix4fv(location, false,
					createOrthographicProjectionMatrix(
						canvas, 0.01 / simpleGlobalClientState.zoom)),
				uModelViewMatrix: location => gl.uniformMatrix4fv(location, false,
					createModelViewMatrix(
						simpleGlobalClientState.pan.x / 100,
						simpleGlobalClientState.pan.y / 100,
						-1.0)),
			}),
		}

		const nodesRenderPass = engine.createPass(nodesObjectInfo)

		if (!nodesRenderPass) return

		let stop = false

		requestAnimationFrame(mainLoop)

		function mainLoop(time: number) {
			try {
				if (stop || !canvasRef.current || !backgroundRenderPass || !nodesRenderPass) return
				
				const state = store.getState()

				engine.newFramePass(canvasRef.current, canvasRef.current.clientWidth, canvasRef.current.clientHeight)

				engine.drawPass(backgroundRenderPass)

				if (state.room.activity.activityType === RoomType.Experimental) {
					const currentGroupId = selectRoomMember(state.room, selectLocalClientId(state)).groupNodeId

					const nodesToRender = selectExpNodesState(state.room)
						.filter(x => x.groupId === currentGroupId)
						.map(node => ({node, position: selectExpPosition(state.room, node.id)}))

					engine.drawPass(nodesRenderPass)
				}

				requestAnimationFrame(mainLoop)
			} catch (error) {
				logger.error('error in [MainWebGlCanvas] mainLoop: ', error)
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
