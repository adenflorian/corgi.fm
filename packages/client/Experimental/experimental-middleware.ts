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
	makeExpPortState, ExpConnection,
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
			return createGroup(dispatch, action.nodeIds, afterState, nodeManager)
		}

		default: return
	}
}

function createGroup(dispatch: Dispatch, nodeIds: Set<Id>, state: IClientAppState, nodeManager: NodeManager) {
	const localClientId = selectLocalClientId(state)
	const currentNodeGroupId = selectRoomMember(state.room, localClientId).groupNodeId

	const nodes = selectExpNodesState(state.room)
		.filter(x => nodeIds.includes(x.id) && x.type !== 'groupInput' && x.type !== 'groupOutput' && x.groupId === currentNodeGroupId)
	const actualNodeIds = nodes.map(x => x.id).toSet()

	// create new group node and position
	const average = averagePositionByIds(actualNodeIds, state)
	const extremes = extremesPositionByIds(actualNodeIds, state)

	const allConnections = selectExpAllConnections(state.room)
	const internalConnections = allConnections.filter(x =>
		actualNodeIds.includes(x.sourceId) && actualNodeIds.includes(x.targetId))
	// Boundary connections
	const inputConnections = allConnections.filter(x =>
		(!actualNodeIds.includes(x.sourceId) && actualNodeIds.includes(x.targetId)))
	const outputConnections = allConnections.filter(x =>
		(actualNodeIds.includes(x.sourceId) && !actualNodeIds.includes(x.targetId)))

	// Maps connections to their new port Ids
	const updatedConnectionsMap = new Map<Id, Id>()

	let inputCount = 0
	const inputPorts = inputConnections.map((connection) => {
		const newPortId = (connection.targetPort as string) + '-' + inputCount++
		updatedConnectionsMap.set(connection.id, newPortId)
		const [,isAudioParam] = nodeManager.getPortType(connection.targetId, connection.targetPort)
		return makeExpPortState({
			id: newPortId,
			inputOrOutput: 'input',
			type: connection.type,
			isAudioParamInput: isAudioParam,
		})
	})
	let outputCount = 0
	const outputPorts = outputConnections.map((connection) => {
		const newPortId = (connection.sourcePort as string) + '-' + outputCount++
		updatedConnectionsMap.set(connection.id, newPortId)
		const [, isAudioParam] = nodeManager.getPortType(connection.sourceId, connection.sourcePort)
		return makeExpPortState({
			id: newPortId,
			inputOrOutput: 'output',
			type: connection.type,
			isAudioParamInput: isAudioParam,
		})
	})
	
	const groupNode = makeExpNodeState({
		type: 'group',
		groupId: currentNodeGroupId,
		ports: inputPorts.concat(outputPorts),
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
			x: extremes.left - 500,
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
			x: extremes.right + 200,
			y: average.y,
		})))

	// set group Ids of selected nodes
	dispatch(expNodesActions.setGroup(actualNodeIds, groupNode.id))

	// set group Ids for connections
	dispatch(expConnectionsActions.setGroup(internalConnections.keySeq().toSet(), groupNode.id))

	// do something with boundary connections
	inputConnections.forEach(connection => {
		const targetPort = updatedConnectionsMap.get(connection.id)
		if (targetPort === undefined) return logger.error('no target port found for connection', {connection, targetPort, updatedConnectionsMap})
		dispatch(expConnectionsActions.updateTarget(connection.id, {
			targetId: groupNode.id,
			targetType: groupNode.type,
			targetPort: targetPort,
		}))
		dispatch(expConnectionsActions.add(new ExpConnection(
			groupInputNode.id,
			groupInputNode.type,
			connection.targetId,
			connection.targetType,
			targetPort,
			connection.targetPort,
			connection.type,
			groupNode.id,
			connection.audioParamInput,
		)))
	})
	outputConnections.forEach(connection => {
		const sourcePort = updatedConnectionsMap.get(connection.id)
		if (sourcePort === undefined) return logger.error('no source port found for connection', {connection, sourcePort, updatedConnectionsMap})
		dispatch(expConnectionsActions.updateSource(connection.id, {
			sourceId: groupNode.id,
			sourceType: groupNode.type,
			sourcePort: sourcePort,
		}))
		dispatch(expConnectionsActions.add(new ExpConnection(
			connection.sourceId,
			connection.sourceType,
			groupOutputNode.id,
			groupOutputNode.type,
			connection.sourcePort,
			sourcePort,
			connection.type,
			groupNode.id,
		)))
	})
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
			return nodeManager.addNode(selectExpNode(state.room, action.newNode.id))

		case 'EXP_NODE_DELETE':
			return nodeManager.deleteNode(action.nodeId)

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
