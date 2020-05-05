import React, {useRef, useEffect} from 'react'
import * as Immutable from 'immutable'
import {hot} from 'react-hot-loader'
import {
	WebGlEngine, ObjectInfo,
	createModelViewMatrix, UniformUpdater,
	createOrthographicProjectionMatrix, getVerticesForRect, RenderPass
} from './webgl/WebGlEngine'
import {logger} from './client-logger'
import {
	backgroundFragmentShader, passthroughVertexShader,
	nodeFragmentShader, modelViewProjectionVertexShader, connectionFragmentShader
} from './glsl/shaders'
import {simpleGlobalClientState} from './SimpleGlobalClientState'
import {selectExpNodesState, selectLocalClientId, selectRoomMember,
	selectExpPosition, IClientAppState, selectExpAllConnections,
	ExpConnection, ExpPosition, ExpNodeState} from '@corgifm/common/redux'
import {useStore} from 'react-redux'
import {RoomType} from '@corgifm/common/common-types'
import {NodeManagerContextValue} from './Experimental/NodeManager'
import {colorFunc} from '@corgifm/common/shamu-color'
import {useSingletonContext, SingletonContextImpl} from './SingletonContext'
import {isAudioOutputPort} from './Experimental/ExpPorts'
import {constant1} from './client-utils'

export const MainWebGlCanvas = hot(module)(React.memo(function _MainWebGlCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const store = useStore<IClientAppState>()
	const singletonContext = useSingletonContext()

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
			...getVerticesForRect(-1, 1, 2, 2),
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

		const nodesObjectInfo: ObjectInfo = {
			vertexPositions: [],
			vertexCount: 0,
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
						canvas, 1 / simpleGlobalClientState.zoom)),
				uModelViewMatrix: location => gl.uniformMatrix4fv(location, false,
					createModelViewMatrix(
						simpleGlobalClientState.pan.x,
						-simpleGlobalClientState.pan.y,
						-1.0)),
			}),
		}

		const nodesRenderPass = engine.createPass(nodesObjectInfo)

		if (!nodesRenderPass) return

		const connectionsObjectInfo: ObjectInfo = {
			vertexPositions: [],
			vertexCount: 0,
			vertexShader: modelViewProjectionVertexShader,
			fragmentShader: connectionFragmentShader,
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
						canvas, 1 / simpleGlobalClientState.zoom)),
				uModelViewMatrix: location => gl.uniformMatrix4fv(location, false,
					createModelViewMatrix(
						simpleGlobalClientState.pan.x,
						-simpleGlobalClientState.pan.y,
						-1.0)),
			}),
		}

		const connectionsRenderPass = engine.createPass(connectionsObjectInfo)

		if (!connectionsRenderPass) return

		let stop = false

		requestAnimationFrame(mainLoop)

		function mainLoop(time: number) {
			try {
				if (stop || !canvasRef.current) return

				const state = store.getState()

				engine.newFramePass(canvasRef.current, canvasRef.current.clientWidth, canvasRef.current.clientHeight)

				backgroundRenderPass && engine.drawPass(backgroundRenderPass)

				drawExpStuff(state, connectionsRenderPass, nodesRenderPass, engine, singletonContext)

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

function drawExpStuff(
	state: IClientAppState,
	connectionsRenderPass: RenderPass | null,
	nodesRenderPass: RenderPass | null,
	engine: WebGlEngine,
	singletonContext: SingletonContextImpl,
) {
	if (state.room.activity.activityType !== RoomType.Experimental) return
	if (!connectionsRenderPass || !nodesRenderPass) return

	const currentGroupId = selectRoomMember(state.room, selectLocalClientId(state)).groupNodeId

	const nodes = selectExpNodesState(state.room)
		.filter(x => x.groupId === currentGroupId)
		.map(node => ({node, position: selectExpPosition(state.room, node.id)}))

	const nodeManager = singletonContext.getNodeManager()

	if (!nodeManager) return

	drawConnections(state, currentGroupId, nodes, connectionsRenderPass, engine, nodeManager.reactContext)

	drawNodes(nodes, nodesRenderPass, engine)
}

function drawNodes(nodes: Immutable.Map<Id, {node: ExpNodeState; position: ExpPosition;}>, nodesRenderPass: RenderPass, engine: WebGlEngine) {
	const nodesVertexPositions = nodes
		.reduce((vertexPositions, {node, position}) => {
			return [...vertexPositions, ...getVerticesForRect(position.x, -position.y, position.width, position.height)]
		}, [] as number[])

	engine.drawPass(nodesRenderPass, nodesVertexPositions)
}

function drawConnections(
	state: IClientAppState,
	currentGroupId: Id,
	nodes: Immutable.Map<Id, {node: ExpNodeState; position: ExpPosition;}>,
	connectionsRenderPass: RenderPass,
	engine: WebGlEngine,
	nodeManagerContext: NodeManagerContextValue,
) {

	const connections = selectExpAllConnections(state.room)
		.filter(x => x.groupId === currentGroupId)

	connections.forEach(connection => {
		const sourceNode = nodes.get(connection.sourceId, null)
		const targetNode = nodes.get(connection.targetId, null)

		if (!sourceNode || !targetNode) return

		const port = nodeManagerContext.ports.get(sourceNode.node.id, connection.sourcePort)

		if (!port) return

		const voiceCountEvent = isAudioOutputPort(port)
			? port.source.voiceCount
			: constant1

		const connectionDrawInfo = createVertexPositionsForConnection(connection, sourceNode.position, targetNode.position)

		const color = colorFunc(port.onColorChange.current)

		engine.drawPass(connectionsRenderPass,
			connectionDrawInfo.vertexPositions, () => {
				engine.gl.uniform2f(connectionsRenderPass.uniformLocations.get('uLineStart', null)!.location,
					connectionDrawInfo.sourceX, connectionDrawInfo.sourceY)
				engine.gl.uniform2f(connectionsRenderPass.uniformLocations.get('uLineEnd', null)!.location,
					connectionDrawInfo.targetX, connectionDrawInfo.targetY)
				engine.gl.uniform3f(connectionsRenderPass.uniformLocations.get('uLineColor', null)!.location,
					color.red() / 255, color.green() / 255, color.blue() / 255)
				engine.gl.uniform1f(connectionsRenderPass.uniformLocations.get('uLineThicc', null)!.location,
					voiceCountEvent.current > 1 ? 5.5 : 2)
			})
	})
}

function createVertexPositionsForConnection(connection: ExpConnection, sourceNode: ExpPosition, targetNode: ExpPosition) {
	const sourceX = (sourceNode.x + sourceNode.width)
	const sourceY = (-sourceNode.y)
	const targetX = (targetNode.x)
	const targetY = (-targetNode.y)
	return {
		sourceX,
		sourceY,
		targetX,
		targetY,
		vertexPositions: [
			sourceX - 100, sourceY,
			targetX + 100, sourceY,
			sourceX - 100, targetY,

			targetX + 100, sourceY,
			sourceX - 100, targetY,
			targetX + 100, targetY,
		]
	}
}

function determineStartingCorner(startX: number, startY: number, endX: number, endY: number): readonly [number, number] {
	if (startX <= endX) {
		if (startY >= endY) {
			return [-1, 1]
		} else {
			return [-1, -1]
		}
	} else {
		if (startY >= endY) {
			return [1, 1]
		} else {
			return [1, -1]
		}
	}
}
