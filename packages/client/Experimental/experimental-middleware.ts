import {Middleware} from 'redux'
import {
	IClientAppState, ExpNodesAction, ExpConnectionAction,
	RoomsReduxAction, selectExpConnection, 
	selectExpAllConnections, selectExpNodesState,
} from '@corgifm/common/redux'
import {NodeManager} from './NodeManager'

type ExpMiddlewareActions = ExpNodesAction | ExpConnectionAction | RoomsReduxAction

type ExpMiddleware =
	(nodeManager: NodeManager) => Middleware<{}, IClientAppState>

export const createExpMiddleware: ExpMiddleware =
	(nodeManager: NodeManager) => ({dispatch, getState}) =>
		next => async function _expMiddleware(action: ExpMiddlewareActions) {
			next(action)
			foo(
				action,
				nodeManager,
				() => selectExpNodesState(getState().room),
				(id: Id) => selectExpConnection(getState().room, id),
				() => selectExpAllConnections(getState().room),
			)
		}

function foo(
	action: ExpMiddlewareActions,
	nodeManager: NodeManager,
	getNodes: () => ReturnType<typeof selectExpNodesState>,
	getConnection: (id: Id) => ReturnType<typeof selectExpConnection>,
	getConnections: () => ReturnType<typeof selectExpAllConnections>,
) {
	switch (action.type) {
		// Room
		case 'SET_ACTIVE_ROOM':
			return nodeManager.cleanup()

		// Nodes
		case 'EXP_NODE_REPLACE_ALL':
			return nodeManager.addNodes(getNodes())

		// Connections
		case 'EXP_REPLACE_CONNECTIONS':
			return nodeManager.addAudioConnections(getConnections())

		case 'EXP_DELETE_CONNECTIONS':
			return action.connectionIds.forEach(
				nodeManager.deleteAudioConnection)

		case 'EXP_ADD_CONNECTION':
			return nodeManager.addAudioConnection(
				getConnection(action.connection.id))

		case 'EXP_ADD_CONNECTIONS':
			return action.connections.forEach(
				x => nodeManager.addAudioConnection(getConnection(x.id)))

		case 'EXP_DELETE_ALL_CONNECTIONS':
			return nodeManager.deleteAllAudioConnections()

		case 'EXP_UPDATE_CONNECTION_SOURCE':
			return nodeManager.changeAudioConnectionSource(
				action.id,
				action.connectionSourceInfo.sourceId,
				action.connectionSourceInfo.sourcePort)

		case 'EXP_UPDATE_CONNECTION_TARGET':
			return nodeManager.changeAudioConnectionTarget(
				action.id,
				action.connectionTargetInfo.targetId,
				action.connectionTargetInfo.targetPort)

		default: return
	}
}
