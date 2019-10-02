import {Middleware} from 'redux'
import {
	IClientAppState, ExpNodesAction, ExpConnectionAction,
	RoomsReduxAction, selectExpConnection,
	selectExpAllConnections, selectExpNodesState,
	selectRoomInfoState, RoomType, ExpPositionAction,
} from '@corgifm/common/redux'
import {SingletonContextImpl} from '../SingletonContext'
import {logger} from '../client-logger'
import {NodeManager} from './NodeManager'

type ExpMiddlewareActions = ExpNodesAction | ExpConnectionAction |
RoomsReduxAction | ExpPositionAction

type ExpMiddleware =
	(singletonContext: SingletonContextImpl) => Middleware<{}, IClientAppState>

export const createExpMiddleware: ExpMiddleware =
	singletonContext => ({dispatch, getState}) =>
		next => async function _expMiddleware(action: ExpMiddlewareActions) {
			next(action)
			const roomType = selectRoomInfoState(getState().room).roomType

			if (roomType !== RoomType.Experimental) return

			const nodeManager = singletonContext.getNodeManager()

			if (!nodeManager) return logger.error('missing node manager!')

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

		case 'EXP_NODE_AUDIO_PARAM_CHANGE':
			return nodeManager.onAudioParamChange(action)

		case 'EXP_NODE_CUSTOM_NUMBER_PARAM_CHANGE':
			return nodeManager.onCustomNumberParamChange(action)

		case 'EXP_NODE_SET_ENABLED':
			return nodeManager.enableNode(action.nodeId, action.enabled)

		case 'EXP_NODE_ADD':
			return nodeManager.addNode(action.newNode)

		case 'EXP_NODE_DELETE':
			return nodeManager.deleteNode(action.nodeId)

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
