import {Middleware} from 'redux'
import {handleAddConnection, handleDeleteConnection} from '../color-connections'
import {calculatePositionsGivenConnections} from '../compute-positions'
import {logger} from '../logger'
import {OrganizeGraphAction} from './common-actions'
import {BroadcastAction} from './common-redux-types'
import {ADD_CONNECTION, DELETE_CONNECTIONS} from './connections-redux'
import {handleStopDraggingGhostConnector} from './dragging-connections'
import {
	IClientAppState, IConnectionAction,
	ORGANIZE_GRAPH, selectAllConnections,
	selectAllPositions, STOP_DRAGGING_GHOST_CONNECTOR, updatePositions,
} from './index'

export const connectionsClientMiddleware: Middleware<{}, IClientAppState> =
	({dispatch, getState}) => next => (action: IConnectionAction | OrganizeGraphAction) => {

		const beforeState = getState()

		next(action)

		const afterState = getState()

		switch (action.type) {
			case STOP_DRAGGING_GHOST_CONNECTOR: {
				if ((action as unknown as BroadcastAction).alreadyBroadcasted) return
				try {
					handleStopDraggingGhostConnector(beforeState.room, dispatch, action.id)
				} catch (error) {
					logger.warn('Caught error (will ignore) when handling ' + STOP_DRAGGING_GHOST_CONNECTOR + ': ', error)
					return
				}
				return
			}
			case ORGANIZE_GRAPH:
				return dispatch(
					updatePositions(
						calculatePositionsGivenConnections(
							selectAllPositions(afterState.room),
							selectAllConnections(afterState.room),
						),
					),
				)
			// case ADD_CONNECTION:
			// 	return handleAddConnection(afterState.room, dispatch, action.connection)
			// case DELETE_CONNECTIONS:
			// 	return handleDeleteConnection(beforeState.room, dispatch, action.connectionIds)
			default: return
		}
	}
