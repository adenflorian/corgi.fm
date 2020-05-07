import * as Immutable from 'immutable'
import {ObjectInfo, getVerticesForRect, UniformUpdater,
	createOrthographicProjectionMatrix, createModelViewMatrix} from './WebGlEngine';
import {modelViewProjectionVertexShader, connectionFragmentShader} from '../glsl/shaders';
import {simpleGlobalClientState} from '../SimpleGlobalClientState';
import {IClientAppState, selectExpNodesState, selectExpPosition,
	selectLocalClientId, selectRoomMember, selectRoomSettings,
	selectExpConnectionStackOrderForTarget,
	selectExpConnectionStackOrderForSource,
	selectExpAllConnections, ExpConnection, ExpPosition} from '@corgifm/common/redux';
import {RoomType} from '@corgifm/common/common-types';
import {Terrier} from './Terrier';
import {connectorWidth, getControlPointDistance, joint} from '../Connections/ConnectionView';
import {colorFunc} from '@corgifm/common/shamu-color';
import {constant1} from '../client-utils';
import {isAudioOutputPort, ExpPort} from '../Experimental/ExpPorts';

export class ConnectionsTerrier extends Terrier {
	public draw(state: IClientAppState) {
		if (!this._renderPass) return

		if (state.room.activity.activityType !== RoomType.Experimental) return

		const currentGroupId = selectRoomMember(state.room, selectLocalClientId(state)).groupNodeId

		const nodes = selectExpNodesState(state.room)
			.filter(x => x.groupId === currentGroupId)
			.map(node => ({node, position: selectExpPosition(state.room, node.id)}))

		const nodeManager = this._singletonContext.getNodeManager()

		if (!nodeManager) return

		const nodesVertexPositions = nodes
			.reduce((vertexPositions, {node, position}) => {
				return [
					...vertexPositions,
					...getVerticesForRect(position.x, -position.y, position.width, position.height),
				]
			}, [] as number[])



		const connections = selectExpAllConnections(state.room)
			.filter(x => x.groupId === currentGroupId)

		connections.forEach(connection => {
			const sourceNode = nodes.get(connection.sourceId, null)
			const targetNode = nodes.get(connection.targetId, null)

			if (!sourceNode || !targetNode) return

			const sourcePort = nodeManager.reactContext.ports.get(sourceNode.node.id, connection.sourcePort)
			const targetPort = nodeManager.reactContext.ports.get(targetNode.node.id, connection.targetPort)

			if (!sourcePort || !targetPort) return

			const voiceCountEvent = isAudioOutputPort(sourcePort)
				? sourcePort.source.voiceCount
				: constant1

			const color = colorFunc(sourcePort.onColorChange.current)

			const {sourceX, sourceY, targetX, targetY, vertexPositions} = createVertexPositionsForConnection(
				connection, sourceNode.position, targetNode.position, sourcePort, targetPort)

			const controlPointDistance = getControlPointDistance(
				sourceX, sourceY, targetX, targetY) + joint


			const sourceStackOrder = selectExpConnectionStackOrderForSource(state.room, connection.id)
			const targetStackOrder = selectExpConnectionStackOrderForTarget(state.room, connection.id)
			const lineType = selectRoomSettings(state.room).lineType


			const sourceConnectorLeft = sourceX + (connectorWidth * sourceStackOrder)
			const sourceConnectorRight = sourceX + connectorWidth + (connectorWidth * sourceStackOrder)
			const targetConnectorLeft = targetX - connectorWidth - (connectorWidth * targetStackOrder)
			// const targetConnectorRight = targetX - (connectorWidth * targetStackOrder)

			if (!this._renderPass) return

			this._engine.drawPass(this._renderPass,
				vertexPositions, () => {
					this._engine.gl.uniform2f(this._renderPass!.uniformLocations.get('uLineStart', null)!.location,
						sourceConnectorRight, sourceY)
					this._engine.gl.uniform2f(this._renderPass!.uniformLocations.get('uLineEnd', null)!.location,
						targetConnectorLeft, targetY)
					this._engine.gl.uniform3f(this._renderPass!.uniformLocations.get('uLineColor', null)!.location,
						color.red() / 255, color.green() / 255, color.blue() / 255)
					this._engine.gl.uniform1f(this._renderPass!.uniformLocations.get('uLineThicc', null)!.location,
						voiceCountEvent.current > 1 ? 2.5 : 1)
					this._engine.gl.uniform1f(this._renderPass!.uniformLocations.get('uLineControlPointOffset', null)!.location,
						controlPointDistance)
				})
		})

		this._engine.drawPass(this._renderPass, nodesVertexPositions)
	}

	protected _createObjectInfo(): ObjectInfo {
		const {gl} = this._engine

		return {
			vertexPositions: [],
			vertexCount: 0,
			vertexShader: modelViewProjectionVertexShader,
			fragmentShader: connectionFragmentShader,
			uniformValues: Immutable.Map<UniformUpdater>({
				uMouse: location => gl.uniform2f(location,
					simpleGlobalClientState.lastMousePosition.x, simpleGlobalClientState.lastMousePosition.y),
				uTime: location => gl.uniform1f(location,
					this._engine.current()),
				uZoom: location => gl.uniform1f(location,
					simpleGlobalClientState.zoom),
				uPan: location => gl.uniform2f(location,
					simpleGlobalClientState.pan.x, simpleGlobalClientState.pan.y),
				uResolution: location => gl.uniform2f(location,
					this._canvas.clientWidth, this._canvas.clientHeight),
				uProjectionMatrix: location => gl.uniformMatrix4fv(location, false,
					createOrthographicProjectionMatrix(
						this._canvas, 1 / simpleGlobalClientState.zoom)),
				uModelViewMatrix: location => gl.uniformMatrix4fv(location, false,
					createModelViewMatrix(
						simpleGlobalClientState.pan.x,
						-simpleGlobalClientState.pan.y,
						-1.0)),
			}),
		}
	}
}

function createVertexPositionsForConnection(connection: ExpConnection, sourceNode: ExpPosition, targetNode: ExpPosition, sourcePort: ExpPort, targetPort: ExpPort) {
	const sourcePortPosition = sourcePort.onPositionChanged.current
	const targetPortPosition = targetPort.onPositionChanged.current
	const sourceX = (sourceNode.x + sourceNode.width - sourcePortPosition.x)
	const sourceY = (sourceNode.y + sourcePortPosition.y)
	const targetX = (targetNode.x + targetPortPosition.x)
	const targetY = (targetNode.y + targetPortPosition.y)
	const left = Math.min(sourceX, targetX)
	const right = Math.max(sourceX, targetX)
	const top = -Math.min(sourceY, targetY)
	const bottom = -Math.max(sourceY, targetY)
	return {
		sourceX,
		sourceY,
		targetX,
		targetY,
		vertexPositions: getVerticesForRect(left - 200, top + 200, right - left + 400, -(bottom - top - 400)),
	}
}