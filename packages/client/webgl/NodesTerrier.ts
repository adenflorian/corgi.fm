import * as Immutable from 'immutable'
import {ObjectInfo, getVerticesForRect, UniformUpdater,
	createOrthographicProjectionMatrix, createModelViewMatrix} from './WebGlEngine';
import {modelViewProjectionVertexShader, nodeFragmentShader} from '../glsl/shaders';
import {simpleGlobalClientState} from '../SimpleGlobalClientState';
import {IClientAppState, selectExpNodesState, selectExpPosition, selectLocalClientId, selectRoomMember} from '@corgifm/common/redux';
import {RoomType} from '@corgifm/common/common-types';
import {Terrier} from './Terrier';

export class NodesTerrier extends Terrier {
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

		this._engine.drawPass(this._renderPass, nodesVertexPositions)
	}

	protected _createObjectInfo(): ObjectInfo {
		const {gl} = this._engine

		return {
			vertexPositions: [],
			vertexCount: 0,
			vertexShader: modelViewProjectionVertexShader,
			fragmentShader: nodeFragmentShader,
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