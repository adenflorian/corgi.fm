import {Middleware, Dispatch, Store} from 'redux'
import * as Immutable from 'immutable'
import {
	IClientAppState, ExpNodesAction, ExpConnectionAction,
	RoomsReduxAction, selectExpConnection,
	selectExpAllConnections, selectExpNodesState,
	selectRoomInfoState, ExpPositionAction,
	ExpGhostConnectorAction, BroadcastAction, LocalAction,
	expGhostConnectorActions,
	createLocalActiveExpGhostConnectionSelector, selectExpNode,
	ExpLocalAction, expNodesActions, makeExpNodeState,
	expPositionActions, makeExpPosition, selectExpPosition,
	expConnectionsActions, selectLocalClientId, selectRoomMember,
	makeExpPortState, ExpConnection, OptionsAction, AppOptions,
	expGraphsActions, makeExpGraphMeta, ExpNodeState,
	makeExpPositionsState,
	selectLocalClient, selectMainExpGraph, ExpGraphsAction,
	chatSystemMessage, selectPreset, ExpGraph,
	ExpNodesState, ExpPositions, ExpConnections,
	selectShamuMetaState, ExpPosition, WithConnections,
	shamuMetaActions, makeExpConnectionsState, defaultExpPositionRecord,
	defaultExpNodeRecord, isGroupInOutNode, GroupType,
	selectExpConnectionsWithTargetIds,
	selectExpConnectionsWithSourceIds, selectExpAllPositions,
	ActivityAction, ExpMidiPatternsAction, ExpMidiPatternViewsAction,
	selectExpMidiPattern, selectActivityType, makeExpMidiPatternState,
	expMidiPatternsActions, selectExpMidiPatternsState,
} from '@corgifm/common/redux'
import {serverClientId, GroupId, expBetterSequencerMainPatternParamId} from '@corgifm/common/common-constants'
import {createNodeId, arrayToESIdKeyMap} from '@corgifm/common/common-utils'
import {SingletonContextImpl} from '../SingletonContext'
import {logger} from '../client-logger'
import {handleStopDraggingExpGhostConnector} from '../exp-dragging-connections'
import {mouseFromScreenToBoard, simpleGlobalClientState} from '../SimpleGlobalClientState'
import {NodeManager} from './NodeManager'
import {RoomType} from '@corgifm/common/common-types'
import {patternA} from '@corgifm/common/default-midi'

type ExpMiddlewareActions = ExpNodesAction | ExpConnectionAction
	| ExpLocalAction | RoomsReduxAction | ExpPositionAction
	| ExpGhostConnectorAction | LocalAction | OptionsAction
	| ExpGraphsAction | ActivityAction | ExpMidiPatternsAction
	| ExpMidiPatternViewsAction

type ExpMiddleware =
	(singletonContext: SingletonContextImpl) => Middleware<{}, IClientAppState>

export const createExpMiddleware: ExpMiddleware =
	singletonContext => ({dispatch, getState}) =>
		next => async function _expMiddleware(action: ExpMiddlewareActions) {
			const beforeState = getState()
			before(beforeState, action, dispatch)
			next(action)
			const afterState = getState()
			const roomType = selectActivityType(afterState.room)

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
	dispatch: Dispatch,
) {
	switch (action.type) {
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
			return createGroup(dispatch, action.nodeIds, afterState, nodeManager, action.groupType)
		}

		case 'EXP_CREATE_PRESET': {
			const node = selectExpNode(afterState.room, action.nodeId)
			const localClient = selectLocalClient(afterState)
			const presetName = node.type + '-' + node.id.substr(0, 4) + '-' + localClient.name

			const clones = _cloneExpNodes(selectMainExpGraph(afterState.room), Immutable.Set([node.id]), 'none', node.groupId)

			const graph: ExpGraph = {
				meta: makeExpGraphMeta({
					name: presetName,
					ownerId: localClient.id,
				}),
				nodes: clones ? clones.clones : Immutable.Map(),
				connections: makeExpConnectionsState({
					connections: clones ? clones.cloneConnections : Immutable.Map(),
				}),
				positions: makeExpPositionsState({
					all: clones ? clones.clonePositions : Immutable.Map(),
				}),
			}

			dispatch(expGraphsActions.add(graph))
			dispatch(chatSystemMessage(`Created preset: ${presetName}`, 'success'))
			return
		}

		case 'EXP_CREATE_NODE_FROM_PRESET': {
			const preset = selectPreset(afterState.room, action.presetId)
			if (!preset) return logger.error('[EXP_CREATE_NODE_FROM_PRESET] no preset found', {action})
			// if (preset.nodes.count() !== 1) return logger.error('[EXP_CREATE_NODE_FROM_PRESET] invalid node preset, not exactly 1 node', {action, preset, count: preset.nodes.count()})

			if (preset.nodes.count() === 0) {
				logger.error('[EXP_CREATE_NODE_FROM_PRESET] preset has no nodes', {preset, nodes: preset.nodes.toJS()})
				return dispatch(chatSystemMessage('Something went wrong while trying to create node(s) from a preset', 'error'))
			}
			const presetNode = preset.nodes.first(null)
			if (!presetNode) {
				logger.error('[EXP_CREATE_NODE_FROM_PRESET] missing preset node', {presetNode, preset, nodes: preset.nodes.toJS()})
				return dispatch(chatSystemMessage('Something went wrong while trying to create a node from a preset', 'error'))
			}

			const topGroup = determineTopGroupInGraph(preset.nodes)

			if (!topGroup) {
				logger.error('[EXP_CREATE_NODE_FROM_PRESET] no top group', {topGroup, presetNode, preset, nodes: preset.nodes.toJS()})
				return dispatch(chatSystemMessage('Something went wrong while trying to create a node from a preset', 'error'))
			}

			const topNodes = preset.nodes.filter(x => x.groupId === topGroup).keySeq().toSet()

			const localClientId = selectLocalClientId(afterState)
			const currentNodeGroupId = selectRoomMember(afterState.room, localClientId).groupNodeId

			const clones = _cloneExpNodes(preset, topNodes, 'none', currentNodeGroupId)

			if (!clones) {
				logger.error('[EXP_CREATE_NODE_FROM_PRESET] no clones', {clones, topGroup, presetNode, preset, nodes: preset.nodes.toJS()})
				return dispatch(chatSystemMessage('Something went wrong while trying to create a node from a preset', 'error'))
			}

			// TODO Adjust position of top level nodes

			dispatchCreationOfCloneInfos(dispatch, clones)

			return
		}

		case 'EXP_CONVERT_GROUP_TO_POLY_GROUP': {
			// clone group node and child group in/out nodes
			const nodes = selectExpNodesState(afterState.room)
			const positions = selectExpAllPositions(afterState.room)
			const groupNode = nodes.get(action.groupNodeId, null)
			const groupInputNode = nodes.find(x => x.type === 'groupInput' && x.groupId === action.groupNodeId)
			const groupOutputNode = nodes.find(x => x.type === 'groupOutput' && x.groupId === action.groupNodeId)
			if (!groupNode || !groupInputNode || !groupOutputNode) {
				logger.error('not all needed nodes are present, sad day:', {action, groupNode, groupInputNode, groupOutputNode})
				return
			}
			if (groupNode.type !== 'group') {
				logger.error('expected a group node, BUT IT WAS NOT A GROUP NODE WAS IT?', {action, groupNode, groupInputNode, groupOutputNode})
				return
			}

			const groupPosition = positions.get(groupNode.id, null)
			const groupInputPosition = positions.get(groupInputNode.id, null)
			const groupOutputPosition = positions.get(groupOutputNode.id, null)
			if (!groupPosition || !groupInputPosition || !groupOutputPosition) {
				logger.error('not all needed positions are present, very sad day:', {action, groupPosition, groupInputPosition, groupOutputPosition})
				return
			}

			const groupNodeClone = groupNode.set('id', createNodeId())
				.set('type', 'polyphonicGroup')
			const groupInputNodeClone = groupInputNode.set('id', createNodeId())
				.set('type', 'polyphonicGroupInput')
				.set('groupId', groupNodeClone.id)
			const groupOutputNodeClone = groupOutputNode.set('id', createNodeId())
				.set('type', 'polyphonicGroupOutput')
				.set('groupId', groupNodeClone.id)

			dispatch(expNodesActions.addMany(Immutable.Map(arrayToESIdKeyMap([groupNodeClone, groupInputNodeClone, groupOutputNodeClone]))))

			const groupPositionClone = groupPosition.set('id', groupNodeClone.id)
				.set('targetType', groupNode.type)
			const groupInputPositionClone = groupInputPosition.set('id', groupInputNodeClone.id)
				.set('targetType', groupInputNode.type)
			const groupOutputPositionClone = groupOutputPosition.set('id', groupOutputNodeClone.id)
				.set('targetType', groupOutputNode.type)

			dispatch(expPositionActions.addMany(Immutable.Map(arrayToESIdKeyMap([groupPositionClone, groupInputPositionClone, groupOutputPositionClone]))))

			// reroute connections
			const connectionsToOldGroupNode = selectExpConnectionsWithTargetIds(afterState.room, groupNode.id)
			connectionsToOldGroupNode.forEach(x => dispatch(expConnectionsActions
				.updateTarget(x.id, {targetId: groupNodeClone.id, targetType: groupNodeClone.type, targetPort: x.targetPort})))

			const connectionsFromOldGroupNode = selectExpConnectionsWithSourceIds(afterState.room, [groupNode.id])
			connectionsFromOldGroupNode.forEach(x => dispatch(expConnectionsActions
				.updateSource(x.id, {sourceId: groupNodeClone.id, sourceType: groupNodeClone.type, sourcePort: x.sourcePort})))

			const connectionsFromOldGroupInputNode = selectExpConnectionsWithSourceIds(afterState.room, [groupInputNode.id])
			connectionsFromOldGroupInputNode.forEach(x => dispatch(expConnectionsActions
				.updateSource(x.id, {sourceId: groupInputNodeClone.id, sourceType: groupInputNodeClone.type, sourcePort: x.sourcePort})))

			const connectionsFromToGroupOutputNode = selectExpConnectionsWithTargetIds(afterState.room, groupOutputNode.id)
			connectionsFromToGroupOutputNode.forEach(x => dispatch(expConnectionsActions
				.updateTarget(x.id, {targetId: groupOutputNodeClone.id, targetType: groupOutputNodeClone.type, targetPort: x.targetPort})))

			const connectionsFromOldGroup = selectExpAllConnections(afterState.room).filter(x => x.groupId === groupNode.id)
			dispatch(expConnectionsActions.setGroup(connectionsFromOldGroup.keySeq().toSet(), groupNodeClone.id))

			// change groupId for direct children
			const directChildren = nodes.filter(x => !isGroupInOutNode(x) && x.groupId === groupNode.id)
			dispatch(expNodesActions.setGroup(directChildren.keySeq().toSet(), groupNodeClone.id))

			// delete old group nodes
			dispatch(expNodesActions.deleteMany([groupNode.id, groupInputNode.id, groupOutputNode.id]))

			return
		}

		case 'CLONE_EXP_NODES': {
			const selectedExpNodes = selectShamuMetaState(afterState.room).selectedNodes

			return cloneExpNodes(dispatch, afterState, selectedExpNodes, action.withConnections)
		}

		case 'EXP_NODE_ADD': {
			if (!(action as unknown as BroadcastAction).alreadyBroadcasted) {
				if (action.newNode.type === 'betterSequencer') {
					const newPattern = makeExpMidiPatternState(patternA())

					dispatch(expMidiPatternsActions.add(newPattern))
					dispatch(expNodesActions.referenceParamChange(
						action.newNode.id, expBetterSequencerMainPatternParamId, {targetId: newPattern.id, targetType: 'midiPattern'}))
				}
			}
			return
		}
		default: return
	}
}

function determineTopGroupInGraph(nodes: ExpGraph['nodes']) {
	// The top group is the groupId that is not an ID of any of the nodes in the graph
	const node = nodes.find(x => !nodes.some(y => y.id === x.groupId))
	return node
		? node.groupId
		: undefined
}

function createGroup(
	dispatch: Dispatch,
	nodeIds: Immutable.Set<Id>,
	state: IClientAppState,
	nodeManager: NodeManager,
	groupType: GroupType,
) {
	const localClientId = selectLocalClientId(state)
	const currentNodeGroupId = selectRoomMember(state.room, localClientId).groupNodeId

	const nodes = selectExpNodesState(state.room)
		.filter(x => nodeIds.includes(x.id) && !isGroupInOutNode(x) && x.groupId === currentNodeGroupId)
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
	const inputPorts = inputConnections.map(connection => {
		const newPortId = (connection.targetPort as string) + '-' + inputCount++
		updatedConnectionsMap.set(connection.id, newPortId)
		const [, isAudioParam] = nodeManager.getPortType(connection.targetId, connection.targetPort)
		return makeExpPortState({
			id: newPortId,
			inputOrOutput: 'input',
			type: connection.type,
			isAudioParamInput: isAudioParam,
		})
	})
	let outputCount = 0
	const outputPorts = outputConnections.map(connection => {
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
		type: groupType,
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
			targetType: groupNode.type,
		})))

	const groupInputNode = makeExpNodeState({
		type: groupType === 'group' ? 'groupInput' : 'polyphonicGroupInput',
		groupId: groupNode.id,
	})
	dispatch(expNodesActions.add(groupInputNode))
	dispatch(expPositionActions.add(
		makeExpPosition({
			id: groupInputNode.id,
			ownerId: serverClientId,
			x: extremes.left - 500,
			y: average.y,
			targetType: groupInputNode.type,
		})))

	const groupOutputNode = makeExpNodeState({
		type: groupType === 'group' ? 'groupOutput' : 'polyphonicGroupOutput',
		groupId: groupNode.id,
	})
	dispatch(expNodesActions.add(groupOutputNode))
	dispatch(expPositionActions.add(
		makeExpPosition({
			id: groupOutputNode.id,
			ownerId: serverClientId,
			x: extremes.right + 200,
			y: average.y,
			targetType: groupOutputNode.type,
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
			targetPort,
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
			sourcePort,
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

function averagePositionByIds(positionIds: Immutable.Set<Id>, state: IClientAppState) {
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

function extremesPositionByIds(positionIds: Immutable.Set<Id>, state: IClientAppState): Extremes {
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

		const roomType = selectActivityType(state.room)

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

		// Graphs
		case 'ACTIVITY_REPLACE':
			if (action.activityState.activityType === RoomType.Experimental) {
				return nodeManager.loadMainGraph(
					selectMainExpGraph(state.room), selectExpMidiPatternsState(state.room))
			} else {
				return
			}

		// Nodes
		case 'EXP_NODE_AUDIO_PARAM_CHANGE':
			return nodeManager.onAudioParamChange(action)

		case 'EXP_NODE_CUSTOM_NUMBER_PARAM_CHANGE':
			return nodeManager.onCustomNumberParamChange(action)

		case 'EXP_NODE_CUSTOM_ENUM_PARAM_CHANGE':
			return nodeManager.onCustomEnumParamChange(action)

		case 'EXP_NODE_CUSTOM_STRING_PARAM_CHANGE':
			return nodeManager.onCustomStringParamChange(action)

		case 'EXP_NODE_REFERENCE_PARAM_CHANGE':
			return nodeManager.onReferenceParamChange(action)

		case 'EXP_NODE_SET_ENABLED':
			return nodeManager.enableNode(action.nodeId, action.enabled)

		case 'EXP_NODE_ADD':
			return nodeManager.addNode(selectExpNode(state.room, action.newNode.id))

		case 'EXP_NODE_ADD_MANY':
			return nodeManager.addNodes(selectExpNodesState(state.room)
				.filter(x => action.newNodes.keySeq().includes(x.id)))

		case 'EXP_NODE_DELETE':
			return nodeManager.deleteNode(action.nodeId)

		case 'EXP_NODE_LOAD_PRESET':
			return nodeManager.loadNodePreset(selectExpNode(state.room, action.nodeId))

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

		// Midi
		case 'EXP_MIDI_PATTERN_ADD':
			return nodeManager.patternUpdated(selectExpMidiPattern(state.room, action.newPattern.id))
		case 'EXP_MIDI_PATTERN_ADD_EVENT':
			return nodeManager.patternUpdated(selectExpMidiPattern(state.room, action.id))
		case 'EXP_MIDI_PATTERN_DELETE':
			return nodeManager.patternDeleted(action.id)

		// Other
		case 'SET_OPTION': {
			if (action.option === AppOptions.graphicsExtraAnimations) {
				nodeManager.onExtraAnimationsChange(action.value as boolean)
			}
			return
		}

		default: return
	}
}

interface CloneNodeResult {
	readonly clone: ExpNodeState
	readonly clonePosition: ExpPosition
}

interface CloneChildrenResult {
	readonly clones: ExpNodesState
	readonly clonesTop: ExpNodesState
	readonly clonePositions: ExpPositions
	readonly cloneConnections: ExpConnections
}

function cloneExpNodes(dispatch: Dispatch, state: IClientAppState, nodeIds: Immutable.Set<Id>, withConnections: WithConnections) {
	const firstNodeId = nodeIds.first(null)
	if (!firstNodeId) return
	const firstNode = selectExpNode(state.room, firstNodeId)
	const cloneInfos = _cloneExpNodes(selectMainExpGraph(state.room), nodeIds, withConnections, firstNode.groupId)
	if (!cloneInfos) return
	dispatchCreationOfCloneInfos(dispatch, cloneInfos)
}

function dispatchCreationOfCloneInfos(dispatch: Dispatch, cloneInfos: CloneChildrenResult) {
	dispatch(expNodesActions.addMany(cloneInfos.clones))
	dispatch(expPositionActions.addMany(cloneInfos.clonePositions))
	if (cloneInfos.cloneConnections.count() > 0) dispatch(expConnectionsActions.addMultiple(cloneInfos.cloneConnections.toList()))
	dispatch(shamuMetaActions.setSelectedNodes(cloneInfos.clonesTop.keySeq().toSet()))
}

function _cloneExpNodes(graph: ExpGraph, nodeIds: Immutable.Set<Id>, withConnections: WithConnections, newTopGroupId: GroupId): CloneChildrenResult | null {
	const nodes = graph.nodes.filter(x => nodeIds.includes(x.id) && !isGroupInOutNode(x))
	const firstNode = nodes.first(null)
	if (!firstNode) return null
	const filteredNodeIds = nodes.map(x => x.id)

	let nodeCloneMap = Immutable.Map<Id, Id>()
	let clones: ExpNodesState = Immutable.Map()
	let clonesTop: ExpNodesState = Immutable.Map()
	let clonePositions: ExpPositions = Immutable.Map()
	let cloneConnections: ExpConnections = Immutable.Map()

	nodes.forEach(node => {
		const {clone, clonePosition} = _cloneExpNode(graph, node.id, newTopGroupId)
		nodeCloneMap = nodeCloneMap.set(node.id, clone.id)
		clones = clones.set(clone.id, clone)
		clonesTop = clonesTop.set(clone.id, clone)
		clonePositions = clonePositions.set(clonePosition.id, clonePosition)
		const childrenResult = _cloneExpChildren(graph, node.id, clone.id)
		clones = clones.merge(childrenResult.clones)
		clonePositions = clonePositions.merge(childrenResult.clonePositions)
		cloneConnections = cloneConnections.merge(childrenResult.cloneConnections)
	})

	if (withConnections === 'all') {
		cloneConnections = cloneConnections.merge(graph.connections.connections
			.filter(x => filteredNodeIds.includes(x.sourceId) || filteredNodeIds.includes(x.targetId))
			.map((x): ExpConnection => ({
				...x,
				id: createNodeId(),
				sourceId: nodeCloneMap.get(x.sourceId, x.sourceId),
				targetId: nodeCloneMap.get(x.targetId, x.targetId),
				groupId: newTopGroupId,
			})))
	}

	return {clones, clonesTop, clonePositions, cloneConnections}
}

function _cloneExpChildren(graph: ExpGraph, oldParentNodeId: Id, newCloneParentId: GroupId): CloneChildrenResult {
	const childrenToClone = graph.nodes.filter(x => x.groupId === oldParentNodeId)
	const childrenIds = childrenToClone.map(x => x.id)

	let nodeCloneMap = Immutable.Map<Id, Id>()
	let clones: ExpNodesState = Immutable.Map()
	let clonePositions: ExpPositions = Immutable.Map()
	let cloneConnections: ExpConnections = Immutable.Map()

	childrenToClone.forEach(node => {
		const {clone, clonePosition} = _cloneExpNode(graph, node.id, newCloneParentId)
		nodeCloneMap = nodeCloneMap.set(node.id, clone.id)
		clones = clones.set(clone.id, clone)
		clonePositions = clonePositions.set(clonePosition.id, clonePosition)
		const childrenResult = _cloneExpChildren(graph, node.id, clone.id)
		clones = clones.merge(childrenResult.clones)
		clonePositions = clonePositions.merge(childrenResult.clonePositions)
		cloneConnections = cloneConnections.merge(childrenResult.cloneConnections)
	})

	cloneConnections = cloneConnections.merge(graph.connections.connections
		.filter(x => childrenIds.includes(x.sourceId) || childrenIds.includes(x.targetId))
		.map((x): ExpConnection => ({
			...x,
			id: createNodeId(),
			sourceId: nodeCloneMap.get(x.sourceId, x.sourceId),
			targetId: nodeCloneMap.get(x.targetId, x.targetId),
			groupId: newCloneParentId,
		})))

	return {clones, clonePositions, cloneConnections, clonesTop: Immutable.Map()}
}

function _cloneExpNode(graph: ExpGraph, nodeId: Id, groupId: GroupId): CloneNodeResult {
	const stateToClone = graph.nodes.get(nodeId, defaultExpNodeRecord)

	const clone = stateToClone
		.set('id', createNodeId())
		.set('groupId', groupId)

	const positionToClone = graph.positions.all.get(nodeId, defaultExpPositionRecord)

	const clonePosition = positionToClone
		.set('id', clone.id)
		.set('x', positionToClone.x + 32)
		.set('y', positionToClone.y)

	return {clone, clonePosition}
}
