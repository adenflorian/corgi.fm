import {Middleware} from 'redux'
import {calculatePositionsGivenConnections} from '@corgifm/common/compute-positions'
import {logger} from '@corgifm/common/logger'
import {OrganizeGraphAction} from '@corgifm/common/redux/common-actions'
import {BroadcastAction} from '@corgifm/common/redux/common-redux-types'
import {
	GhostConnectorAction, IClientAppState,
	IConnectionAction, PositionAction,
	selectAllConnections, selectAllPositions, selectConnection,
	selectConnectionsWithSourceId, updatePositions, LocalAction,
	createLocalActiveGhostConnectionSelector, ghostConnectorActions,
} from '@corgifm/common/redux'
import {handleStopDraggingGhostConnector} from './dragging-connections'
import {GetAllInstruments} from './instrument-manager'

type ConnectionClientMiddleWareAction = IConnectionAction | OrganizeGraphAction |
GhostConnectorAction | PositionAction | LocalAction

// TODO Merge with local middleware?
export const makeConnectionsClientMiddleware: (getAllInstruments: GetAllInstruments) => Middleware<{}, IClientAppState> =
	(getAllInstruments: GetAllInstruments) => ({dispatch, getState}) => next => function _connectionsClientMiddleware(action: ConnectionClientMiddleWareAction) {

		const beforeState = getState()

		next(action)

		const afterState = getState()

		switch (action.type) {
			case 'GHOST_CONNECTION_DELETE': {
				if ((action as unknown as BroadcastAction).alreadyBroadcasted) return

				if (!action.info) return

				try {
					handleStopDraggingGhostConnector(beforeState.room, dispatch, action.id, action.info)
				} catch (error) {
					logger.warn('Caught error (will ignore) when handling GHOST_CONNECTION_DELETE: ', error)
					return
				}

				return
			}
			case 'MOUSE_UP_ON_PLACEHOLDER': {
				const localActiveGhostConnection = createLocalActiveGhostConnectionSelector()(afterState)
				if (localActiveGhostConnection) {
					dispatch(ghostConnectorActions.delete(localActiveGhostConnection.id, action))
				}
				return
			}
			case 'ORGANIZE_GRAPH':
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
			case 'DELETE_CONNECTIONS': {
				const instruments = getAllInstruments()
				action.connectionIds.forEach(x => {
					const connection = selectConnection(beforeState.room, x)
					const instrument = instruments.get(connection.targetId)
					if (instrument) {
						instrument.releaseAllScheduledFromSourceId(connection.sourceId)
					}
				})
				// return handleDeleteConnection(beforeState.room, dispatch, action.connectionIds)
				return
			}
			case 'SET_ENABLED_NODE': {
				if (action.enabled) return

				const instruments = getAllInstruments()

				return selectConnectionsWithSourceId(getState().room, action.id)
					.forEach(connection => {
						const instrument = instruments.get(connection.targetId)
						if (instrument) {
							instrument.releaseAllScheduledFromSourceId(connection.sourceId)
						}
					})
			}
			default: return
		}
	}
