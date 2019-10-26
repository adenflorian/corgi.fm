import {Middleware, Dispatch, Store} from 'redux'
import {Set} from 'immutable'
import {
	IClientAppState, ExpNodesAction, ExpConnectionAction,
	RoomsReduxAction, selectExpConnection,
	selectExpAllConnections, selectExpNodesState,
	selectRoomInfoState, RoomType, ExpPositionAction,
	ExpGhostConnectorAction, BroadcastAction, LocalAction,
	expGhostConnectorActions,
	createLocalActiveExpGhostConnectionSelector, selectExpNode,
	ExpLocalAction, expNodesActions, makeExpNodeState,
	expPositionActions, makeExpPosition, selectExpPosition,
	expConnectionsActions, selectLocalClientId, selectRoomMember,
} from '@corgifm/common/redux'
import {serverClientId} from '@corgifm/common/common-constants'
import {SingletonContextImpl} from '../SingletonContext'
import {logger} from '../client-logger'
import {handleStopDraggingExpGhostConnector} from '../exp-dragging-connections'
import {mouseFromScreenToBoard, simpleGlobalClientState} from '../SimpleGlobalClientState'
import {NodeManager} from './NodeManager'

type ExpMiddlewareActions = ExpNodesAction | ExpConnectionAction
| ExpLocalAction | RoomsReduxAction | ExpPositionAction
| ExpGhostConnectorAction | LocalAction

type ExpMiddleware =
	(singletonContext: SingletonContextImpl) => Middleware<{}, IClientAppState>

export const createExpMiddleware: ExpMiddleware =
	singletonContext => ({dispatch, getState}) =>
		next => async function _expMiddleware(action: ExpMiddlewareActions) {
			const beforeState = getState()
			next(action)
			const afterState = getState()
			const roomType = selectRoomInfoState(getState().room).roomType

			if (roomType !== RoomType.Experimental) return

			let nodeManager = singletonContext.getNodeManager()

			if (!nodeManager) {
				logger.log('creating node manager')
				singletonContext.setNodeManager(new NodeManager(singletonContext))
				nodeManager = singletonContext.getNodeManager()

				if (!nodeManager) {
					return logger.error('missing node manager!')
				}
			}

			after(
				beforeState,
				afterState,
				action,
				nodeManager,
				() => selectExpNodesState(getState().room),
				(id: Id) => selectExpConnection(getState().room, id),
				() => selectExpAllConnections(getState().room),
				dispatch,
			)
		}

function before(
	beforeState: IClientAppState,
	action: ExpMiddlewareActions,
	nodeManager: NodeManager,
) {
	switch (action.type) {
		// case 'LOCAL_MIDI_KEY_PRESS':
		// return nodeManager.onLocalMidiKeypress(action.midiNote, action.velocity)
		// case 'LOCAL_MIDI_KEY_UP':
		// 	return nodeManager.onLocalMidiKeyUp(action.midiNote)
		// case 'LOCAL_MIDI_OCTAVE_CHANGE':
		// 	return nodeManager.onLocalMidiOctaveChange(action., action.velocity)

		default: return
	}
}

function after(
	beforeState: IClientAppState,
	afterState: IClientAppState,
	action: ExpMiddlewareActions,
	nodeManager: NodeManager,
	getNodes: () => ReturnType<typeof selectExpNodesState>,
	getConnection: (id: Id) => ReturnType<typeof selectExpConnection>,
	getConnections: () => ReturnType<typeof selectExpAllConnections>,
	dispatch: Dispatch,
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

		case 'EXP_NODE_CUSTOM_ENUM_PARAM_CHANGE':
			return nodeManager.onCustomEnumParamChange(action)

		case 'EXP_NODE_SET_ENABLED':
			return nodeManager.enableNode(action.nodeId, action.enabled)

		case 'EXP_NODE_ADD':
			return nodeManager.addNode(selectExpNode(afterState.room, action.newNode.id))

		case 'EXP_NODE_DELETE':
			return nodeManager.deleteNode(action.nodeId)

		// Connections
		case 'EXP_DELETE_ALL_CONNECTIONS':
			return nodeManager.deleteAllConnections()

		case 'EXP_UPDATE_CONNECTION_SOURCE':
			return nodeManager.changeConnectionSource(
				action.id,
				action.connectionSourceInfo.sourceId,
				action.connectionSourceInfo.sourcePort)

		case 'EXP_UPDATE_CONNECTION_TARGET':
			return nodeManager.changeConnectionTarget(
				action.id,
				action.connectionTargetInfo.targetId,
				action.connectionTargetInfo.targetPort)

		case 'EXP_GHOST_CONNECTION_DELETE': {
			if ((action as unknown as BroadcastAction).alreadyBroadcasted) return

			if (!action.info) return

			try {
				handleStopDraggingExpGhostConnector(beforeState.room, dispatch, action.id, action.info, nodeManager)
			} catch (error) {
				logger.warn('Caught error (will ignore) when handling EXP_GHOST_CONNECTION_DELETE: ', error)
				return
			}

			return
		}

		case 'MOUSE_UP_ON_EXP_PLACEHOLDER': {
			const localActiveGhostConnection = createLocalActiveExpGhostConnectionSelector()(afterState)
			if (localActiveGhostConnection) {
				dispatch(expGhostConnectorActions.delete(localActiveGhostConnection.id, action))
			}
			return
		}

		case 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_GAIN':
			return nodeManager.onAudioParamInputGainChange(action.id, action.gain)

		case 'EXP_UPDATE_CONNECTION_AUDIO_PARAM_INPUT_CENTERING':
			return nodeManager.onAudioParamInputCenteringChange(action.id, action.centering)

			// Exp Local Actions
		case 'EXP_CREATE_GROUP': {
			const {nodeIds} = action
			const localClientId = selectLocalClientId(afterState)
			const currentNodeGroupId = selectRoomMember(afterState.room, localClientId).groupNodeId

			// create new group node and position
			const average = averagePositionByIds(nodeIds, afterState)
			const extremes = extremesPositionByIds(nodeIds, afterState)

			const groupNode = makeExpNodeState({
				type: 'group',
				groupId: currentNodeGroupId,
			})
			dispatch(expNodesActions.add(groupNode))
			dispatch(expPositionActions.add(
				makeExpPosition({
					id: groupNode.id,
					ownerId: serverClientId,
					x: average.x,
					y: average.y,
				})))

			const groupInputNode = makeExpNodeState({
				type: 'groupInput',
				groupId: groupNode.id,
			})
			dispatch(expNodesActions.add(groupInputNode))
			dispatch(expPositionActions.add(
				makeExpPosition({
					id: groupInputNode.id,
					ownerId: serverClientId,
					x: extremes.left - 400,
					y: average.y,
				})))

			const groupOutputNode = makeExpNodeState({
				type: 'groupOutput',
				groupId: groupNode.id,
			})
			dispatch(expNodesActions.add(groupOutputNode))
			dispatch(expPositionActions.add(
				makeExpPosition({
					id: groupOutputNode.id,
					ownerId: serverClientId,
					x: extremes.right + 100,
					y: average.y,
				})))

			// set group Ids of selected nodes
			dispatch(expNodesActions.setGroup(nodeIds, groupNode.id))

			// set group Ids for connections
			const allConnections = selectExpAllConnections(afterState.room)
			const internalConnections = allConnections.filter(x =>
				nodeIds.includes(x.sourceId) && nodeIds.includes(x.targetId))
			const boundaryConnections = allConnections.filter(x =>
				(nodeIds.includes(x.sourceId) && !nodeIds.includes(x.targetId)) ||
				(!nodeIds.includes(x.sourceId) && nodeIds.includes(x.targetId)))

			dispatch(expConnectionsActions.setGroup(internalConnections.keySeq().toSet(), groupNode.id))

			// do something with boundary connections
			// Temporary
			dispatch(expConnectionsActions.delete(boundaryConnections.keySeq().toList()))

			return
		}

		default: return
	}
}

function averagePositionByIds(positionIds: Set<Id>, state: IClientAppState) {
	if (positionIds.count() === 0) return mouseFromScreenToBoard(simpleGlobalClientState.lastMousePosition)

	const sumOfPositions = positionIds.reduce((sum, current) => {
		const {x, y} = selectExpPosition(state.room, current)
		return {
			x: sum.x + x,
			y: sum.y + y,
		}
	}, {x: 0, y: 0})

	return {
		x: sumOfPositions.x / positionIds.count(),
		y: sumOfPositions.y / positionIds.count(),
	}
}

function extremesPositionByIds(positionIds: Set<Id>, state: IClientAppState): Extremes {
	return positionIds.reduce((extremes, current) => {
		const {x, y, width, height} = selectExpPosition(state.room, current)
		return {
			top: Math.min(extremes.top, y),
			right: Math.max(extremes.right, x + width),
			bottom: Math.max(extremes.bottom, y + height),
			left: Math.min(extremes.left, x),
		}
	}, {top: 0, right: 0, bottom: 0, left: 0} as Extremes)
}

interface Extremes {
	readonly top: number
	readonly right: number
	readonly bottom: number
	readonly left: number
}

export function createExpTupperware(
	store: Store<IClientAppState>, singletonContext: SingletonContextImpl,
) {
	return () => {
		const state = store.getState()
		const action = state.other.lastAction as ExpMiddlewareActions

		const roomType = selectRoomInfoState(state.room).roomType

		if (roomType !== RoomType.Experimental) return

		let nodeManager = singletonContext.getNodeManager()

		if (!nodeManager) {
			logger.log('creating node manager')
			singletonContext.setNodeManager(new NodeManager(singletonContext))
			nodeManager = singletonContext.getNodeManager()

			if (!nodeManager) {
				return logger.error('missing node manager!')
			}
		}

		bar(
			state,
			action,
			nodeManager,
			() => selectExpNodesState(state.room),
			(id: Id) => selectExpConnection(state.room, id),
			() => selectExpAllConnections(state.room),
			store.dispatch,
		)
	}
}

function bar(
	state: IClientAppState,
	action: ExpMiddlewareActions,
	nodeManager: NodeManager,
	getNodes: () => ReturnType<typeof selectExpNodesState>,
	getConnection: (id: Id) => ReturnType<typeof selectExpConnection>,
	getConnections: () => ReturnType<typeof selectExpAllConnections>,
	dispatch: Dispatch,
) {
	switch (action.type) {
		// Connections
		case 'EXP_REPLACE_CONNECTIONS':
			return nodeManager.addConnections(getConnections())

		case 'EXP_DELETE_CONNECTIONS':
			return action.connectionIds.forEach(
				nodeManager.deleteConnection)

		case 'EXP_ADD_CONNECTION':
			return nodeManager.addConnection(
				getConnection(action.connection.id))

		case 'EXP_ADD_CONNECTIONS':
			return action.connections.forEach(
				x => nodeManager.addConnection(getConnection(x.id)))

		default: return
	}
}
