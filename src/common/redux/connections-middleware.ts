import {Middleware} from 'redux'
import {colorConnections} from '../color-connections'
import {calculatePositionsGivenConnections} from '../compute-positions'
import {logger} from '../logger'
import {OrganizeGraphAction} from './common-actions'
import {BroadcastAction} from './common-redux-types'
import {ADD_CONNECTION} from './connections-redux'
import {handleStopDraggingGhostConnector} from './dragging-connections'
import {
	IClientAppState, IConnectionAction,
	ORGANIZE_GRAPH, selectAllConnections,
	selectAllPositions, STOP_DRAGGING_GHOST_CONNECTOR, updatePositions,
} from './index'

export const connectionsClientMiddleware: Middleware<{}, IClientAppState> =
	({dispatch, getState}) => next => (action: IConnectionAction | OrganizeGraphAction) => {

		const stateBefore = getState()

		next(action)

		const stateAfter = getState()

		switch (action.type) {
			case STOP_DRAGGING_GHOST_CONNECTOR: {
				if ((action as unknown as BroadcastAction).alreadyBroadcasted) return
				try {
					handleStopDraggingGhostConnector(stateBefore.room, dispatch, action.id)
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
							selectAllPositions(stateAfter.room),
							selectAllConnections(stateAfter.room),
						),
					),
				)
			case ADD_CONNECTION:
				return colorConnections(stateAfter.room, dispatch, action.connection)
			default: return
		}
	}
