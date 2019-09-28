import {Middleware} from 'redux'
import {
	IClientAppState, ExpNodesAction, ExpConnectionAction, RoomsReduxAction, selectExpConnection,
} from '@corgifm/common/redux'
import {NodeManager} from './NodeManager'

type ExpMiddlewareActions = ExpNodesAction | ExpConnectionAction | RoomsReduxAction

type ExpMiddleware =
	(nodeManager: NodeManager) => Middleware<{}, IClientAppState>

export const createExpMiddleware: ExpMiddleware =
	(nodeManager: NodeManager) => ({dispatch, getState}) =>
		next => async function _expMiddleware(action: ExpMiddlewareActions) {
			next(action)

			switch (action.type) {
				case 'EXP_NODE_REPLACE_ALL': return nodeManager.addNodes(getState().room.expNodes)
				case 'EXP_REPLACE_CONNECTIONS': return nodeManager.addAudioConnections(getState().room.expConnections.connections)
				case 'SET_ACTIVE_ROOM': return nodeManager.cleanup()
				case 'EXP_DELETE_CONNECTIONS': return action.connectionIds.forEach(nodeManager.deleteAudioConnection)
				case 'EXP_ADD_CONNECTION': return nodeManager.addAudioConnection(selectExpConnection(getState().room, action.connection.id))
				case 'EXP_ADD_CONNECTIONS': return action.connections.forEach(x => nodeManager.addAudioConnection(selectExpConnection(getState().room, x.id)))
				case 'EXP_DELETE_ALL_CONNECTIONS': return nodeManager.deleteAllAudioConnections()
				case 'EXP_UPDATE_CONNECTION_SOURCE': return nodeManager.changeAudioConnectionSource(
					action.id, action.connectionSourceInfo.sourceId, action.connectionSourceInfo.sourcePort)
				case 'EXP_UPDATE_CONNECTION_TARGET': return nodeManager.changeAudioConnectionTarget(
					action.id, action.connectionTargetInfo.targetId, action.connectionTargetInfo.targetPort)
				default: return
			}
		}
