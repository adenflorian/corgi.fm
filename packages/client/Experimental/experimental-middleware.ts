import {Middleware} from 'redux'
import {
	IClientAppState, ExpNodesAction, ExpConnectionAction, RoomsReduxAction,
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
				case 'EXP_REPLACE_CONNECTIONS': return nodeManager.addConnections(getState().room.expConnections.connections)
				case 'SET_ACTIVE_ROOM': return nodeManager.cleanup()
				default: return
			}
		}
